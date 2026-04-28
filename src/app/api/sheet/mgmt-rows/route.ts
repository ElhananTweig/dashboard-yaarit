import { NextResponse, type NextRequest } from "next/server";
import { createManagementRow } from "@/lib/sheets/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    let body: { id?: string; name?: string } = {};
    try {
      body = (await req.json()) as { id?: string; name?: string };
    } catch {
      /* empty body is fine */
    }
    const row = await createManagementRow(
      typeof body.id === "string" && body.id ? body.id : undefined,
      typeof body.name === "string" && body.name ? body.name : undefined,
    );
    return NextResponse.json(row);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
