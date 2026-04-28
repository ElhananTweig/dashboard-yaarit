import { NextResponse, type NextRequest } from "next/server";
import { deleteTask } from "@/lib/sheets/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const url = new URL(req.url);
    const officeId = url.searchParams.get("officeId");
    if (!officeId) {
      return NextResponse.json(
        { error: "officeId query param is required" },
        { status: 400 },
      );
    }
    await deleteTask(ctx.params.id, officeId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
