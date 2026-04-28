/**
 * Google Sheets client + metadata caching.
 *
 * Server-only (`server-only` import below). Reads the service-account JSON
 * pointed to by GOOGLE_SERVICE_ACCOUNT_PATH and caches the auth client + each
 * tab's numeric sheetId so subsequent calls don't pay the metadata cost.
 */
import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { google, type sheets_v4 } from "googleapis";

import { ALL_TABS, type TabName } from "./schema";

type SheetIds = Record<TabName, number>;

let sheetsClientPromise: Promise<sheets_v4.Sheets> | null = null;
let sheetIdsPromise: Promise<SheetIds> | null = null;

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

export function getSpreadsheetId(): string {
  const id = process.env.GOOGLE_SHEET_ID;
  if (!id) throw new Error("GOOGLE_SHEET_ID is not set in .env.local");
  return id;
}

async function loadCredentials(): Promise<{ client_email: string; private_key: string }> {
  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH;
  if (!keyPath) throw new Error("GOOGLE_SERVICE_ACCOUNT_PATH is not set in .env.local");
  const absPath = path.isAbsolute(keyPath) ? keyPath : path.resolve(process.cwd(), keyPath);
  let raw: string;
  try {
    raw = await fs.readFile(absPath, "utf8");
  } catch (err) {
    throw new Error(
      `Could not read service-account file at ${absPath}: ${(err as Error).message}`,
    );
  }
  const creds = JSON.parse(raw);
  if (!creds.client_email || !creds.private_key) {
    throw new Error(`Service-account JSON at ${absPath} is missing client_email/private_key`);
  }
  return creds;
}

export async function getSheetsClient(): Promise<sheets_v4.Sheets> {
  if (!sheetsClientPromise) {
    sheetsClientPromise = (async () => {
      const creds = await loadCredentials();
      const auth = new google.auth.JWT({
        email: creds.client_email,
        key: creds.private_key,
        scopes: SCOPES,
      });
      await auth.authorize();
      return google.sheets({ version: "v4", auth });
    })().catch((err) => {
      sheetsClientPromise = null;
      throw err;
    });
  }
  return sheetsClientPromise;
}

/**
 * Returns a map of tab name → numeric sheetId. Creates any missing tab and
 * writes its header row. Cached for the life of the server process.
 */
export async function getSheetIds(): Promise<SheetIds> {
  if (!sheetIdsPromise) {
    sheetIdsPromise = (async () => {
      const sheets = await getSheetsClient();
      const spreadsheetId = getSpreadsheetId();
      const meta = await sheets.spreadsheets.get({ spreadsheetId });

      const existing = new Map<string, number>();
      for (const s of meta.data.sheets ?? []) {
        const title = s.properties?.title;
        const id = s.properties?.sheetId;
        if (title != null && id != null) existing.set(title, id);
      }

      const missing: TabName[] = ALL_TABS.filter((t) => !existing.has(t.name)).map((t) => t.name);
      if (missing.length > 0) {
        const res = await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: missing.map((name) => ({
              addSheet: { properties: { title: name } },
            })),
          },
        });
        for (const reply of res.data.replies ?? []) {
          const props = reply.addSheet?.properties;
          if (props?.title && props.sheetId != null) {
            existing.set(props.title, props.sheetId);
          }
        }
        // Seed header rows for the just-created tabs.
        const headerData: sheets_v4.Schema$ValueRange[] = ALL_TABS
          .filter((t) => missing.includes(t.name))
          .map((t) => ({
            range: `${t.name}!A1`,
            values: [[...t.headers]],
          }));
        if (headerData.length > 0) {
          await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId,
            requestBody: { valueInputOption: "RAW", data: headerData },
          });
        }
      }

      // For tabs that already existed, make sure they have a header row.
      // (Cheap one-time guarantee — only patches if A1 is empty.)
      const checkRanges = ALL_TABS
        .filter((t) => existing.has(t.name) && !missing.includes(t.name))
        .map((t) => `${t.name}!A1:${columnLetter(t.headers.length)}1`);
      if (checkRanges.length > 0) {
        const r = await sheets.spreadsheets.values.batchGet({
          spreadsheetId,
          ranges: checkRanges,
        });
        const patches: sheets_v4.Schema$ValueRange[] = [];
        (r.data.valueRanges ?? []).forEach((vr, i) => {
          const tab = ALL_TABS[i];
          const firstRow = vr.values?.[0] ?? [];
          if (firstRow.length === 0 || firstRow.every((v) => !v)) {
            patches.push({ range: `${tab.name}!A1`, values: [[...tab.headers]] });
          }
        });
        if (patches.length > 0) {
          await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId,
            requestBody: { valueInputOption: "RAW", data: patches },
          });
        }
      }

      const ids = {} as SheetIds;
      for (const tab of ALL_TABS) {
        const id = existing.get(tab.name);
        if (id == null) throw new Error(`Failed to resolve sheetId for tab ${tab.name}`);
        ids[tab.name] = id;
      }
      return ids;
    })().catch((err) => {
      sheetIdsPromise = null;
      throw err;
    });
  }
  return sheetIdsPromise;
}

/** Convert 1-based column index to A1 letter (1 → A, 27 → AA). */
export function columnLetter(n: number): string {
  let s = "";
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}
