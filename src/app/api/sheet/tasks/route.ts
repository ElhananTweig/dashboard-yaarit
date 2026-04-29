import { NextResponse, type NextRequest } from "next/server";
import { createTask } from "@/lib/sheets/repository";
import type { NewTaskInput, TaskAssignee, TaskType } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<NewTaskInput> & { id?: string };
    if (!body.officeId || !body.dept || !body.text) {
      return NextResponse.json({ error: "officeId, dept, and text are required" }, { status: 400 });
    }
    const type: TaskType = body.type === "קבוע" ? "קבוע" : "יומי";
    const assignee: TaskAssignee = body.assignee === "רחמים" ? "רחמים" : "יערית";
    const task = await createTask(
      {
        officeId: body.officeId,
        dept: body.dept,
        text: body.text,
        type,
        assignee,
      },
      typeof body.id === "string" && body.id ? body.id : undefined,
    );
    return NextResponse.json(task);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
