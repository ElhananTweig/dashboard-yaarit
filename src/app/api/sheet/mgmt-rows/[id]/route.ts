import { NextResponse, type NextRequest } from "next/server";
import {
  deleteManagementRow,
  renameManagementRowSheet,
} from "@/lib/sheets/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(_req: NextRequest, ctx: { params: { id: string } }) {
  try {
    await deleteManagementRow(ctx.params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const body = (await req.json()) as { name?: string };
    if (typeof body.name !== "string") {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    await renameManagementRowSheet(ctx.params.id, body.name);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
