/**
 * Daily cleanup — removes all type='יומי' tasks whose createdAt date is
 * before "today" in the dashboard timezone (Asia/Jerusalem by default).
 *
 * Runs lazily: triggered the first time loadSnapshot() is called on a new
 * calendar day, then memoized for the rest of that day in the server process.
 * If the server restarts mid-day it'll just run once more — idempotent.
 */
import "server-only";

import type { sheets_v4 } from "googleapis";

import { columnLetter, getSheetIds, getSheetsClient, getSpreadsheetId } from "./client";
import {
  MGMT_TASK_COL,
  MGMT_TASKS_HEADERS,
  TAB_MGMT_TASKS,
  TAB_MGMT_TASKS_ARCHIVE,
  TAB_TASKS,
  TAB_TASKS_ARCHIVE,
  TASK_COL,
  TASKS_HEADERS,
} from "./schema";

const TZ_DEFAULT = "Asia/Jerusalem";

let lastCleanupKey: string | null = null;

/** Returns "YYYY-MM-DD" for the current date in the dashboard timezone. */
function todayKeyInTz(tz: string): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date()); // en-CA gives YYYY-MM-DD
}

/** Convert a task's createdAt (ISO timestamp) to its calendar date in tz. */
function dateKeyInTz(iso: string, tz: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * Sweeps stale יומי tasks from `tasks` and `mgmt_tasks`. Safe to call on every
 * page load: the actual sheet writes only happen once per calendar day.
 */
export async function dailyCleanup(): Promise<{ removed: number } | { skipped: true }> {
  const tz = process.env.DASHBOARD_TZ || TZ_DEFAULT;
  const todayKey = todayKeyInTz(tz);
  if (lastCleanupKey === todayKey) return { skipped: true };

  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const sheetIds = await getSheetIds();

  const [tasksRange, mgmtTasksRange] = await Promise.all([
    sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${TAB_TASKS}!A2:${columnLetter(TASKS_HEADERS.length)}`,
    }),
    sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${TAB_MGMT_TASKS}!A2:${columnLetter(MGMT_TASKS_HEADERS.length)}`,
    }),
  ]);

  const taskRows = (tasksRange.data.values ?? []) as string[][];
  const mgmtRows = (mgmtTasksRange.data.values ?? []) as string[][];

  const stalesTasks: number[] = [];
  taskRows.forEach((row, i) => {
    if ((row[TASK_COL.type] ?? "") !== "יומי") return;
    const createdAt = row[TASK_COL.createdAt] ?? "";
    if (!createdAt) return;
    const key = dateKeyInTz(createdAt, tz);
    if (key && key < todayKey) stalesTasks.push(i + 1); // +1 for header
  });

  const staleMgmt: number[] = [];
  mgmtRows.forEach((row, i) => {
    if ((row[MGMT_TASK_COL.type] ?? "") !== "יומי") return;
    const createdAt = row[MGMT_TASK_COL.createdAt] ?? "";
    if (!createdAt) return;
    const key = dateKeyInTz(createdAt, tz);
    if (key && key < todayKey) staleMgmt.push(i + 1);
  });

  // Archive stale rows before deleting so the monthly calendar can read history.
  // Stale index values are 1-based (i+1 from forEach), so original row is at [idx-1].
  const archiveTaskRows = stalesTasks.map((idx) => taskRows[idx - 1]);
  const archiveMgmtRows = staleMgmt.map((idx) => mgmtRows[idx - 1]);

  const archiveWrites: Promise<unknown>[] = [];
  if (archiveTaskRows.length > 0) {
    archiveWrites.push(
      sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${TAB_TASKS_ARCHIVE}!A:G`,
        valueInputOption: "RAW",
        requestBody: { values: archiveTaskRows },
      }),
    );
  }
  if (archiveMgmtRows.length > 0) {
    archiveWrites.push(
      sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${TAB_MGMT_TASKS_ARCHIVE}!A:F`,
        valueInputOption: "RAW",
        requestBody: { values: archiveMgmtRows },
      }),
    );
  }
  if (archiveWrites.length > 0) {
    await Promise.all(archiveWrites);
  }

  // Now delete from the active tabs.
  const requests: sheets_v4.Schema$Request[] = [
    ...indicesToDeleteRequests(sheetIds[TAB_TASKS], stalesTasks),
    ...indicesToDeleteRequests(sheetIds[TAB_MGMT_TASKS], staleMgmt),
  ];

  if (requests.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests },
    });
  }

  lastCleanupKey = todayKey;
  return { removed: stalesTasks.length + staleMgmt.length };
}

/** Force a cleanup on next call — useful for tests. */
export function resetCleanupCache(): void {
  lastCleanupKey = null;
}

function indicesToDeleteRequests(
  sheetId: number,
  indices: number[],
): sheets_v4.Schema$Request[] {
  if (indices.length === 0) return [];
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
