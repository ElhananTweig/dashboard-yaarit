/**
 * Sheet schema — single source of truth for tab names + columns.
 *
 *   tasks               id | officeId | dept   | type | text | createdAt
 *   mgmt_rows           id | name     | sortIndex
 *   mgmt_tasks          id | rowId    | type   | text | createdAt
 *   tasks_archive       id | officeId | dept   | type | text | createdAt  (same as tasks)
 *   mgmt_tasks_archive  id | rowId    | type   | text | createdAt          (same as mgmt_tasks)
 *
 * Office tasks live in `tasks`; management tasks live in `mgmt_tasks`
 * (keyed by rowId, so renaming a row doesn't orphan its tasks).
 * Archive tabs hold historical יומי tasks after daily cleanup, enabling
 * the monthly calendar view.
 */

export const TAB_TASKS = "tasks" as const;
export const TAB_MGMT_ROWS = "mgmt_rows" as const;
export const TAB_MGMT_TASKS = "mgmt_tasks" as const;
export const TAB_TASKS_ARCHIVE = "tasks_archive" as const;
export const TAB_MGMT_TASKS_ARCHIVE = "mgmt_tasks_archive" as const;

export type TabName =
  | typeof TAB_TASKS
  | typeof TAB_MGMT_ROWS
  | typeof TAB_MGMT_TASKS
  | typeof TAB_TASKS_ARCHIVE
  | typeof TAB_MGMT_TASKS_ARCHIVE;

export const TASKS_HEADERS = ["id", "officeId", "dept", "type", "text", "createdAt"] as const;
export const MGMT_ROWS_HEADERS = ["id", "name", "sortIndex"] as const;
export const MGMT_TASKS_HEADERS = ["id", "rowId", "type", "text", "createdAt"] as const;

export const ALL_TABS = [
  { name: TAB_TASKS, headers: TASKS_HEADERS },
  { name: TAB_MGMT_ROWS, headers: MGMT_ROWS_HEADERS },
  { name: TAB_MGMT_TASKS, headers: MGMT_TASKS_HEADERS },
  { name: TAB_TASKS_ARCHIVE, headers: TASKS_HEADERS },
  { name: TAB_MGMT_TASKS_ARCHIVE, headers: MGMT_TASKS_HEADERS },
] as const;

/** Column index (0-based) lookups, so we don't sprinkle magic numbers around. */
export const TASK_COL = {
  id: 0,
  officeId: 1,
  dept: 2,
  type: 3,
  text: 4,
  createdAt: 5,
} as const;

export const MGMT_ROW_COL = {
  id: 0,
  name: 1,
  sortIndex: 2,
} as const;

export const MGMT_TASK_COL = {
  id: 0,
  rowId: 1,
  type: 2,
  text: 3,
  createdAt: 4,
} as const;

/** Convenience for serializing a task to a sheet row in the canonical order. */
export interface TaskRow {
  id: string;
  officeId: string;
  dept: string;
  type: string;
  text: string;
  createdAt: string;
}

export interface MgmtRowRow {
  id: string;
  name: string;
  sortIndex: number;
}

export interface MgmtTaskRow {
  id: string;
  rowId: string;
  type: string;
  text: string;
  createdAt: string;
}

export function taskRowToValues(t: TaskRow): (string | number)[] {
  return [t.id, t.officeId, t.dept, t.type, t.text, t.createdAt];
}

export function mgmtRowRowToValues(r: MgmtRowRow): (string | number)[] {
  return [r.id, r.name, r.sortIndex];
}

export function mgmtTaskRowToValues(t: MgmtTaskRow): (string | number)[] {
  return [t.id, t.rowId, t.type, t.text, t.createdAt];
}
