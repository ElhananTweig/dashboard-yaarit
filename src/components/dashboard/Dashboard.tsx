"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  apiAddManagementRow,
  apiAddTask,
  apiRemoveManagementRow,
  apiRemoveTask,
  apiRenameManagementRow,
  applyAddManagementRow,
  applyAddTask,
  applyRemoveManagementRow,
  applyRemoveTask,
  applyRenameManagementRow,
  newRowId,
  newTaskId,
} from "@/lib/data-source";
import { useReveal } from "@/hooks/useReveal";
import type { DashboardSnapshot, ManagementRow, NewTaskInput, Task } from "@/lib/types";
import AddTaskModal from "./AddTaskModal";
import ManagementCard from "./ManagementCard";
import OfficeCard from "./OfficeCard";
import PageHeader from "./PageHeader";
import StatsStrip from "./StatsStrip";
import Toast from "./Toast";
import Toolbar, { AssigneeFilterValue, FilterValue } from "./Toolbar";
import TopNav from "./TopNav";

interface DashboardProps {
  initial: DashboardSnapshot;
}

const MGMT_ID = "mgmt";
const TOAST_DURATION_MS = 1800;
const NEW_HIGHLIGHT_MS = 350;
const RENAME_DEBOUNCE_MS = 600;

export default function Dashboard({ initial }: DashboardProps) {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>(initial);
  const [filter, setFilter] = useState<FilterValue>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<AssigneeFilterValue>("all");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [prefillOffice, setPrefillOffice] = useState<string | undefined>();
  const [prefillDept, setPrefillDept] = useState<string | undefined>();

  // Toast state
  const [toast, setToast] = useState<{ message: string; show: boolean }>({
    message: "",
    show: false,
  });
  const toastTimer = useRef<number | null>(null);

  // Animation tracking
  const [newTaskIds, setNewTaskIds] = useState<Set<string>>(new Set());
  const [newRowIdState, setNewRowIdState] = useState<string | null>(null);

  // Per-row debounce timers for rename PATCH calls.
  const renameTimers = useRef<Map<string, number>>(new Map());

  useReveal([snapshot]);

  // Counters used by header / stats
  const counts = useMemo(() => {
    let yomi = 0;
    let kavua = 0;
    Object.values(snapshot.officeTasks).forEach((byDept) =>
      Object.values(byDept).forEach((arr) =>
        arr.forEach((t) => (t.type === "יומי" ? yomi++ : kavua++)),
      ),
    );
    snapshot.managementRows.forEach((r) =>
      r.tasks.forEach((t) => (t.type === "יומי" ? yomi++ : kavua++)),
    );
    return { yomi, kavua, total: yomi + kavua };
  }, [snapshot]);

  // Open modal helpers
  const openAdd = useCallback((office?: string, dept?: string) => {
    setPrefillOffice(office);
    setPrefillDept(dept);
    setModalOpen(true);
  }, []);
  const closeAdd = useCallback(() => setModalOpen(false), []);

  // Global "N" hotkey to open the modal.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (modalOpen) return;
      if (e.key !== "n" && e.key !== "N") return;
      const tag = (document.activeElement?.tagName ?? "").toUpperCase();
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      e.preventDefault();
      openAdd();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modalOpen, openAdd]);

  // Toast helper
  const showToast = useCallback((message: string) => {
    setToast({ message, show: true });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(
      () => setToast((t) => ({ ...t, show: false })),
      TOAST_DURATION_MS,
    );
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
      // Flush all pending rename timers on unmount.
      const timers = renameTimers.current;
      timers.forEach((id) => window.clearTimeout(id));
      timers.clear();
    };
  }, []);

  /* ============ DATA OPERATIONS (optimistic + API) ============ */

  const handleSave = (input: NewTaskInput) => {
    // 1. Build the optimistic task with a client-supplied ID.
    const id = newTaskId();
    const optimisticTask: Task = {
      id,
      officeId: input.officeId,
      dept: input.dept,
      type: input.type,
      assignee: input.assignee,
      text: input.text,
      createdAt: new Date().toISOString(),
    };

    // 2. Apply locally and animate.
    setSnapshot((s) => applyAddTask(s, optimisticTask));
    closeAdd();
    setNewTaskIds((prev) => new Set(prev).add(id));
    window.setTimeout(() => {
      setNewTaskIds((prev) => {
        const copy = new Set(prev);
        copy.delete(id);
        return copy;
      });
    }, NEW_HIGHLIGHT_MS);
    showToast("המשימה נוספה");

    // 3. Persist. On failure, undo the optimistic add and toast.
    apiAddTask({ id, ...input }).catch(() => {
      setSnapshot((s) =>
        applyRemoveTask(s, { id, officeId: optimisticTask.officeId, dept: optimisticTask.dept }),
      );
      showToast("שמירה נכשלה — נסה שוב");
    });
  };

  const handleRemoveTask = (task: Task) => {
    setSnapshot((s) =>
      applyRemoveTask(s, { id: task.id, officeId: task.officeId, dept: task.dept }),
    );
    apiRemoveTask({ id: task.id, officeId: task.officeId }).catch(() => {
      // Rollback by re-inserting the task.
      setSnapshot((s) => applyAddTask(s, task));
      showToast("מחיקה נכשלה — נסה שוב");
    });
  };

  const handleAddRow = () => {
    const id = newRowId();
    const optimisticRow: ManagementRow = { id, name: "שורה חדשה", tasks: [] };
    setSnapshot((s) => applyAddManagementRow(s, optimisticRow));
    setNewRowIdState(id);
    window.setTimeout(
      () => setNewRowIdState((cur) => (cur === id ? null : cur)),
      NEW_HIGHLIGHT_MS,
    );

    apiAddManagementRow({ id, name: optimisticRow.name }).catch(() => {
      setSnapshot((s) => applyRemoveManagementRow(s, id));
      showToast("הוספת שורה נכשלה");
    });
  };

  const handleRemoveRow = (rowId: string) => {
    // Snapshot the pre-removal state for rollback.
    const before = snapshot;
    setSnapshot((s) => applyRemoveManagementRow(s, rowId));
    // Cancel any pending rename for this row.
    const pending = renameTimers.current.get(rowId);
    if (pending) {
      window.clearTimeout(pending);
      renameTimers.current.delete(rowId);
    }
    apiRemoveManagementRow(rowId).catch(() => {
      setSnapshot(before);
      showToast("מחיקת שורה נכשלה");
    });
  };

  const handleRenameRow = (rowId: string, name: string) => {
    // Local update is instant; debounce the network write so we don't fire
    // a PATCH on every keystroke.
    setSnapshot((s) => applyRenameManagementRow(s, rowId, name));
    const existing = renameTimers.current.get(rowId);
    if (existing) window.clearTimeout(existing);
    const timer = window.setTimeout(() => {
      renameTimers.current.delete(rowId);
      apiRenameManagementRow(rowId, name).catch(() => {
        showToast("עדכון השם נכשל");
      });
    }, RENAME_DEBOUNCE_MS);
    renameTimers.current.set(rowId, timer);
  };

  /* ============ RENDER ============ */

  return (
    <div data-theme-host>
      <div className="shell">
        <TopNav />

        <PageHeader
          yomiCount={counts.yomi}
          kavuaCount={counts.kavua}
          onAdd={() => openAdd()}
        />

        <StatsStrip
          total={counts.total}
          yomi={counts.yomi}
          kavua={counts.kavua}
          weeklyRate={94}
        />

        <Toolbar
          filter={filter}
          onFilterChange={setFilter}
          assigneeFilter={assigneeFilter}
          onAssigneeFilterChange={setAssigneeFilter}
          updatedAgo="דקה"
        />

        <main className="grid">
          {snapshot.offices.map((office, i) => (
            <OfficeCard
              key={office.id}
              office={office}
              departments={snapshot.departments}
              tasksByDept={snapshot.officeTasks[office.id] ?? {}}
              newTaskIds={newTaskIds}
              filter={filter}
              assigneeFilter={assigneeFilter}
              animationDelayMs={60 * i}
              onQuickAdd={(officeId, dept) => openAdd(officeId, dept)}
              onRemoveTask={handleRemoveTask}
            />
          ))}
          <ManagementCard
            rows={snapshot.managementRows}
            newTaskIds={newTaskIds}
            newRowId={newRowIdState}
            filter={filter}
            assigneeFilter={assigneeFilter}
            animationDelayMs={60 * snapshot.offices.length}
            onQuickAdd={(rowName) => openAdd(MGMT_ID, rowName)}
            onAddRow={handleAddRow}
            onRemoveRow={handleRemoveRow}
            onRenameRow={handleRenameRow}
            onRemoveTask={handleRemoveTask}
          />
        </main>

        <footer className="foot-note">
          <div className="legend">
            <span className="lg">
              <span className="ld" style={{ background: "var(--yomi)" }} />
              יומי · נמחק אוטומטית למחרת
            </span>
            <span className="lg">
              <span className="ld" style={{ background: "var(--kavua)" }} />
              קבוע · משימה מתמשכת
            </span>
          </div>
          <div>v2.0 · Next.js</div>
        </footer>
      </div>

      <AddTaskModal
        open={modalOpen}
        snapshot={snapshot}
        prefillOffice={prefillOffice}
        prefillDept={prefillDept}
        onClose={closeAdd}
        onSave={handleSave}
      />

      <Toast message={toast.message} show={toast.show} />
    </div>
  );
}
