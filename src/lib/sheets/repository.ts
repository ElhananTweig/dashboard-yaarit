/**
 * Sheets repository — high-level CRUD that builds and mutates the
 * DashboardSnapshot the UI consumes.
 *
 * Office config (id/name/logo/brand/meta) is intentionally NOT in the sheet.
 * It's static config in `mock-data.ts` (renamed conceptually to "site config").
 * If you ever want offices to be editable, add an `offices` tab and read it
 * here — the UI doesn't have to change.
 *
 * Server-only.
 */
import "server-only";

import { randomUUID } from "node:crypto";
import type { sheets_v4 } from "googleapis";

import { OFFICES, DEPARTMENTS } from "../mock-data";
import type {
  DashboardSnapshot,
  ManagementRow,
  NewTaskInput,
  Task,
  TaskType,
} from "../types";

import { columnLetter, getSheetIds, getSheetsClient, getSpreadsheetId } from "./client";
import {
  MGMT_ROW_COL,
  MGMT_TASK_COL,
  MGMT_ROWS_HEADERS,
  MGMT_TASKS_HEADERS,
  TAB_MGMT_ROWS,
  TAB_MGMT_TASKS,
  TAB_TASKS,
  TASK_COL,
  TASKS_HEADERS,
  taskRowToValues,
  mgmtRowRowToValues,
  mgmtTaskRowToValues,
} from "./schema";
import { dailyCleanup } from "./cleanup";

const MGMT_ID = "mgmt";

/* ----------------------------------------------------------------------- */
/*                              READ HELPERS                                */
/* ----------------------------------------------------------------------- */

async function readDataRows(tab: string, columnCount: number): Promise<string[][]> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const range = `${tab}!A2:${columnLetter(columnCount)}`;
  const r = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  return (r.data.values ?? []) as string[][];
}

/**
 * Returns row-index (0-based, where 0 = header) for every row whose ID column
 * matches one of the requested IDs. Use the result + the tab's numeric sheetId
 * to issue deleteDimension requests.
 */
async function findRowIndicesById(
  tab: string,
  columnCount: number,
  idColumn: number,
  ids: Set<string>,
): Promise<number[]> {
  const rows = await readDataRows(tab, columnCount);
  const indices: number[] = [];
  rows.forEach((row, i) => {
    if (ids.has(row[idColumn] ?? "")) indices.push(i + 1); // +1 for header row
  });
  return indices;
}

/* ----------------------------------------------------------------------- */
/*                              SNAPSHOT                                    */
/* ----------------------------------------------------------------------- */

/**
 * Reads everything from the sheet and assembles a DashboardSnapshot.
 * Also runs the daily cleanup of stale יומי tasks before reading, so the
 * returned snapshot already reflects the sweep.
 */
export async function loadSnapshot(): Promise<DashboardSnapshot> {
  // Make sure tabs/headers are in place before any read.
  await getSheetIds();

  // Sweep stale yomi tasks first; the read after this won't see them.
  await dailyCleanup();

  const [taskRows, mgmtRowRows, mgmtTaskRows] = await Promise.all([
    readDataRows(TAB_TASKS, TASKS_HEADERS.length),
    readDataRows(TAB_MGMT_ROWS, MGMT_ROWS_HEADERS.length),
    readDataRows(TAB_MGMT_TASKS, MGMT_TASKS_HEADERS.length),
  ]);

  /* ---- office tasks: bucket by officeId → dept ---- */
  const officeTasks: Record<string, Record<string, Task[]>> = {};
  for (const row of taskRows) {
    const id = row[TASK_COL.id];
    if (!id) continue;
    const officeId = row[TASK_COL.officeId] ?? "";
    const dept = row[TASK_COL.dept] ?? "";
    const type = (row[TASK_COL.type] as TaskType) || "יומי";
    const text = row[TASK_COL.text] ?? "";
    const createdAt = row[TASK_COL.createdAt] ?? new Date().toISOString();
    const task: Task = { id, officeId, dept, type, text, createdAt };
    const bucket = (officeTasks[officeId] ??= {});
    (bucket[dept] ??= []).push(task);
  }

  /* ---- management rows + their tasks ---- */
  const rowsByIndex: { row: ManagementRow; sortIndex: number }[] = mgmtRowRows
    .map((r) => {
      const id = r[MGMT_ROW_COL.id];
      if (!id) return null;
      const name = r[MGMT_ROW_COL.name] ?? "שורה חדשה";
      const sortIndex = Number(r[MGMT_ROW_COL.sortIndex] ?? 0) || 0;
      return { row: { id, name, tasks: [] as Task[] }, sortIndex };
    })
    .filter((x): x is { row: ManagementRow; sortIndex: number } => x !== null);

  const rowsById = new Map(rowsByIndex.map((x) => [x.row.id, x.row]));
  for (const row of mgmtTaskRows) {
    const id = row[MGMT_TASK_COL.id];
    const rowId = row[MGMT_TASK_COL.rowId];
    if (!id || !rowId) continue;
    const target = rowsById.get(rowId);
    if (!target) continue;
    const type = (row[MGMT_TASK_COL.type] as TaskType) || "יומי";
    const text = row[MGMT_TASK_COL.text] ?? "";
    const createdAt = row[MGMT_TASK_COL.createdAt] ?? new Date().toISOString();
    target.tasks.push({
      id,
      officeId: MGMT_ID,
      dept: target.name, // dept always reflects the row's CURRENT name
      type,
      text,
      createdAt,
    });
  }

  rowsByIndex.sort((a, b) => a.sortIndex - b.sortIndex);
  const managementRows = rowsByIndex.map((x) => x.row);

  return {
    offices: OFFICES,
    departments: [...DEPARTMENTS],
    officeTasks,
    managementRows,
  };
}

/* ----------------------------------------------------------------------- */
/*                              MUTATIONS                                   */
/* ----------------------------------------------------------------------- */

export async function createTask(
  input: NewTaskInput,
  clientId?: string,
): Promise<Task> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const createdAt = new Date().toISOString();
  const id = clientId || `t_${randomUUID()}`;

  if (input.officeId === MGMT_ID) {
    // dept is the row's CURRENT name — resolve to a rowId.
    const rowId = await findMgmtRowIdByName(input.dept);
    if (!rowId) throw new Error(`Management row not found: ${input.dept}`);
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${TAB_MGMT_TASKS}!A:E`,
      valueInputOption: "RAW",
      requestBody: {
        values: [
          mgmtTaskRowToValues({ id, rowId, type: input.type, text: input.text, createdAt }),
        ],
      },
    });
    return { id, officeId: MGMT_ID, dept: input.dept, type: input.type, text: input.text, createdAt };
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${TAB_TASKS}!A:F`,
    valueInputOption: "RAW",
    requestBody: {
      values: [
        taskRowToValues({
          id,
          officeId: input.officeId,
          dept: input.dept,
          type: input.type,
          text: input.text,
          createdAt,
        }),
      ],
    },
  });
  return { id, officeId: input.officeId, dept: input.dept, type: input.type, text: input.text, createdAt };
}

export async function deleteTask(taskId: string, officeId: string): Promise<void> {
  const isMgmt = officeId === MGMT_ID;
  const tab = isMgmt ? TAB_MGMT_TASKS : TAB_TASKS;
  const cols = isMgmt ? MGMT_TASKS_HEADERS.length : TASKS_HEADERS.length;
  const idCol = isMgmt ? MGMT_TASK_COL.id : TASK_COL.id;
  const sheetIds = await getSheetIds();
  const sheetId = sheetIds[tab];
  const indices = await findRowIndicesById(tab, cols, idCol, new Set([taskId]));
  if (indices.length === 0) return;
  await deleteRows(sheetId, indices);
}

export async function createManagementRow(
  clientId?: string,
  initialName?: string,
): Promise<ManagementRow> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const id = clientId || `mgmt_${randomUUID()}`;
  const name = initialName || "שורה חדשה";
  // Place it at the end. Sort index = current count.
  const existing = await readDataRows(TAB_MGMT_ROWS, MGMT_ROWS_HEADERS.length);
  const sortIndex = existing.length;
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${TAB_MGMT_ROWS}!A:C`,
    valueInputOption: "RAW",
    requestBody: { values: [mgmtRowRowToValues({ id, name, sortIndex })] },
  });
  return { id, name, tasks: [] };
}

export async function deleteManagementRow(rowId: string): Promise<void> {
  const sheetIds = await getSheetIds();

  // Delete the row record + every task attached to it. Issue both as one
  // batchUpdate so we only pay one round-trip.
  const [rowIndices, taskIndices] = await Promise.all([
    findRowIndicesById(TAB_MGMT_ROWS, MGMT_ROWS_HEADERS.length, MGMT_ROW_COL.id, new Set([rowId])),
    findTaskRowsByRowIds(new Set([rowId])),
  ]);

  const requests: sheets_v4.Schema$Request[] = [
    ...indicesToDeleteRequests(sheetIds[TAB_MGMT_ROWS], rowIndices),
    ...indicesToDeleteRequests(sheetIds[TAB_MGMT_TASKS], taskIndices),
  ];
  if (requests.length === 0) return;

  const sheets = await getSheetsClient();
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: getSpreadsheetId(),
    requestBody: { requests },
  });
}

export async function renameManagementRowSheet(rowId: string, name: string): Promise<void> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const rows = await readDataRows(TAB_MGMT_ROWS, MGMT_ROWS_HEADERS.length);
  const idx = rows.findIndex((r) => r[MGMT_ROW_COL.id] === rowId);
  if (idx === -1) return;
  const sheetRow = idx + 2; // +1 for 1-based, +1 for header
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${TAB_MGMT_ROWS}!B${sheetRow}`,
    valueInputOption: "RAW",
    requestBody: { values: [[name]] },
  });
}

/* ----------------------------------------------------------------------- */
/*                            INTERNAL HELPERS                              */
/* ----------------------------------------------------------------------- */

async function findMgmtRowIdByName(name: string): Promise<string | null> {
  const rows = await readDataRows(TAB_MGMT_ROWS, MGMT_ROWS_HEADERS.length);
  for (const r of rows) {
    if ((r[MGMT_ROW_COL.name] ?? "") === name) return r[MGMT_ROW_COL.id] ?? null;
  }
  return null;
}

async function findTaskRowsByRowIds(rowIds: Set<string>): Promise<number[]> {
  const rows = await readDataRows(TAB_MGMT_TASKS, MGMT_TASKS_HEADERS.length);
  const indices: number[] = [];
  rows.forEach((row, i) => {
    if (rowIds.has(row[MGMT_TASK_COL.rowId] ?? "")) indices.push(i + 1);
  });
  return indices;
}

/** Build deleteDimension requests for the given 0-based row indices. */
function indicesToDeleteRequests(
  sheetId: number,
  indices: number[],
): sheets_v4.Schema$Request[] {
  if (indices.length === 0) return [];
  // Delete bottom-up so earlier deletes don't shift later ones.
  const sorted = [...indices].sort((a, b) => b - a);
  return sorted.map((i) => ({
    deleteDimension: {
      range: {
        sheetId,
        dimension: "ROWS",
        startIndex: i,
        endIndex: i + 1,
      },
    },
  }));
}

async function deleteRows(sheetId: number, indices: number[]): Promise<void> {
  const requests = indicesToDeleteRequests(sheetId, indices);
  if (requests.length === 0) return;
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: getSpreadsheetId(),
    requestBody: { requests },
  });
}
