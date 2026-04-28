/**
 * Domain types for the operations dashboard.
 *
 * These types are the contract between the UI and the data source.
 * When wiring up Google Sheets later, the sheet adapter just needs to return
 * these shapes from `data-source.ts` — the UI never has to change.
 */

export type TaskType = "יומי" | "קבוע";

export interface Task {
  id: string;
  type: TaskType;
  text: string;
  /** Office ID or "mgmt" for the management card. */
  officeId: string;
  /** Department name (or management row name). */
  dept: string;
  /** ISO timestamp (UTC) when the task was created. Required for the daily יומי cleanup. */
  createdAt: string;
}

export interface Office {
  id: string;
  name: string;
  /** Path under /public, e.g. "/assets/kikar.png". */
  logo: string;
  /** Background color behind the logo tile. */
  logoBg: string;
  /** Brand accent color (used for borders, gradients, footer progress). */
  brand: string;
  /** Short label shown in the brand pill, e.g. "חדשות חרדיות". */
  meta: string;
}

export interface ManagementRow {
  id: string;
  name: string;
  tasks: Task[];
}

/** A grouping of tasks under a single department row inside an OfficeCard. */
export interface DepartmentRow {
  name: string;
  tasks: Task[];
}

/** Snapshot of all data needed to render the dashboard. */
export interface DashboardSnapshot {
  offices: Office[];
  /** Fixed list of department names used by every office card. */
  departments: string[];
  /** Tasks per office id → department name. */
  officeTasks: Record<string, Record<string, Task[]>>;
  /** Flexible management card rows. */
  managementRows: ManagementRow[];
}

export interface NewTaskInput {
  officeId: string;
  dept: string;
  type: TaskType;
  text: string;
}
