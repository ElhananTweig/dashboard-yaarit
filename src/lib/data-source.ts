/**
 * Client data layer for the dashboard.
 *
 * This module is now a thin client over the `/api/sheet/*` routes, plus a set
 * of pure local helpers (`apply*`) that the UI uses for optimistic updates.
 *
 * Pattern: the UI immediately applies the change locally with `apply*`, then
 * fires the matching `api*` call. On error the caller can rollback by inverting
 * the local apply. This is what keeps the dashboard feeling instant even
 * though every change hits Google Sheets.
 *
 * IDs for new rows/tasks are generated on the CLIENT and passed to the API.
 * That way the optimistic state already has the final ID — no remount, no
 * swap, no jank.
 *
 * Note: `getSnapshot` is intentionally not in this file anymore — the server
 * page calls `loadSnapshot` directly from `@/lib/sheets/repository` for the
 * initial render. Client refresh, if ever needed, can use `apiGetSnapshot`.
 */
import type {
  DashboardSnapshot,
  ManagementRow,
  NewTaskInput,
  Task,
} from "./types";

const MGMT_ID = "mgmt";

/* ----------------------------------------------------------------------- */
/*                              ID HELPERS                                  */
/* ----------------------------------------------------------------------- */

function uuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback: only fires on very old browsers — collision-resistant enough
  // for the lifetime of a dashboard session.
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const newTaskId = (): string => `t_${uuid()}`;
export const newRowId = (): string => `mgmt_${uuid()}`;

/* ----------------------------------------------------------------------- */
/*                       LOCAL (OPTIMISTIC) UPDATERS                        */
/* ----------------------------------------------------------------------- */

function clone(snapshot: DashboardSnapshot): DashboardSnapshot {
  return {
    offices: snapshot.offices,
    departments: [...snapshot.departments],
    officeTasks: Object.fromEntries(
      Object.entries(snapshot.officeTasks).map(([office, byDept]) => [
        office,
        Object.fromEntries(
          Object.entries(byDept).map(([dept, tasks]) => [dept, [...tasks]]),
        ),
      ]),
    ),
    managementRows: snapshot.managementRows.map((r) => ({
      ...r,
      tasks: [...r.tasks],
    })),
  };
}

export function applyAddTask(snapshot: DashboardSnapshot, task: Task): DashboardSnapshot {
  const next = clone(snapshot);
  if (task.officeId === MGMT_ID) {
    next.managementRows = next.managementRows.map((r) =>
      r.name === task.dept ? { ...r, tasks: [...r.tasks, task] } : r,
    );
  } else {
    const bucket = next.officeTasks[task.officeId] ?? {};
    next.officeTasks = {
      ...next.officeTasks,
      [task.officeId]: {
        ...bucket,
        [task.dept]: [...(bucket[task.dept] ?? []), task],
      },
    };
  }
  return next;
}

export function applyRemoveTask(
  snapshot: DashboardSnapshot,
  t: { id: string; officeId: string; dept: string },
): DashboardSnapshot {
  const next = clone(snapshot);
  if (t.officeId === MGMT_ID) {
    next.managementRows = next.managementRows.map((r) =>
      r.name === t.dept ? { ...r, tasks: r.tasks.filter((x) => x.id !== t.id) } : r,
    );
  } else {
    const bucket = next.officeTasks[t.officeId] ?? {};
    next.officeTasks = {
      ...next.officeTasks,
      [t.officeId]: {
        ...bucket,
        [t.dept]: (bucket[t.dept] ?? []).filter((x) => x.id !== t.id),
      },
    };
  }
  return next;
}

export function applyAddManagementRow(
  snapshot: DashboardSnapshot,
  row: ManagementRow,
): DashboardSnapshot {
  const next = clone(snapshot);
  next.managementRows = [...next.managementRows, row];
  return next;
}

export function applyRemoveManagementRow(
  snapshot: DashboardSnapshot,
  rowId: string,
): DashboardSnapshot {
  const next = clone(snapshot);
  next.managementRows = next.managementRows.filter((r) => r.id !== rowId);
  return next;
}

export function applyRenameManagementRow(
  snapshot: DashboardSnapshot,
  rowId: string,
  name: string,
): DashboardSnapshot {
  const next = clone(snapshot);
  next.managementRows = next.managementRows.map((r) =>
    r.id === rowId ? { ...r, name } : r,
  );
  return next;
}

/* ----------------------------------------------------------------------- */
/*                            REMOTE (API) CALLS                            */
/* ----------------------------------------------------------------------- */

async function asJson<T>(p: Promise<Response>, what: string): Promise<T> {
  const r = await p;
  if (!r.ok) {
    let detail = "";
    try {
      detail = (await r.json())?.error ?? "";
    } catch {
      /* ignore */
    }
    throw new Error(`${what} failed (${r.status})${detail ? `: ${detail}` : ""}`);
  }
  return r.json() as Promise<T>;
}

export async function apiGetSnapshot(): Promise<DashboardSnapshot> {
  return asJson(fetch("/api/sheet", { cache: "no-store" }), "getSnapshot");
}

export interface CreateTaskRequest extends NewTaskInput {
  id: string;
}

export async function apiAddTask(input: CreateTaskRequest): Promise<Task> {
  return asJson(
    fetch("/api/sheet/tasks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    }),
    "addTask",
  );
}

export async function apiRemoveTask(t: { id: string; officeId: string }): Promise<void> {
  await asJson<{ ok: true }>(
    fetch(
      `/api/sheet/tasks/${encodeURIComponent(t.id)}?officeId=${encodeURIComponent(t.officeId)}`,
      { method: "DELETE" },
    ),
    "removeTask",
  );
}

export async function apiAddManagementRow(opts: {
  id: string;
  name?: string;
}): Promise<ManagementRow> {
  return asJson(
    fetch("/api/sheet/mgmt-rows", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(opts),
    }),
    "addManagementRow",
  );
}

export async function apiRemoveManagementRow(rowId: string): Promise<void> {
  await asJson<{ ok: true }>(
    fetch(`/api/sheet/mgmt-rows/${encodeURIComponent(rowId)}`, { method: "DELETE" }),
    "removeManagementRow",
  );
}

export async function apiRenameManagementRow(rowId: string, name: string): Promise<void> {
  await asJson<{ ok: true }>(
    fetch(`/api/sheet/mgmt-rows/${encodeURIComponent(rowId)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    }),
    "renameManagementRow",
  );
}
