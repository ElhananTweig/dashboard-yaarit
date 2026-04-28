"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DashboardSnapshot, NewTaskInput, TaskType } from "@/lib/types";

interface AddTaskModalProps {
  open: boolean;
  snapshot: DashboardSnapshot;
  prefillOffice?: string;
  prefillDept?: string;
  onClose: () => void;
  onSave: (input: NewTaskInput) => void;
}

const MGMT_ID = "mgmt";

export default function AddTaskModal({
  open,
  snapshot,
  prefillOffice,
  prefillDept,
  onClose,
  onSave,
}: AddTaskModalProps) {
  const [office, setOffice] = useState<string>(prefillOffice ?? snapshot.offices[0].id);
  const [dept, setDept] = useState<string>(prefillDept ?? snapshot.departments[0]);
  const [type, setType] = useState<TaskType>("יומי");
  const [text, setText] = useState("");
  const textRef = useRef<HTMLTextAreaElement | null>(null);

  // Build the dept list based on the selected office.
  const deptOptions = useMemo(() => {
    if (office === MGMT_ID) return snapshot.managementRows.map((r) => r.name);
    return snapshot.departments;
  }, [office, snapshot.managementRows, snapshot.departments]);

  // Reset state when the modal opens.
  useEffect(() => {
    if (!open) return;
    const o = prefillOffice ?? snapshot.offices[0].id;
    const initialDeptList =
      o === MGMT_ID ? snapshot.managementRows.map((r) => r.name) : snapshot.departments;
    const d = prefillDept && initialDeptList.includes(prefillDept) ? prefillDept : initialDeptList[0] ?? "";
    setOffice(o);
    setDept(d);
    setType("יומי");
    setText("");
    const t = window.setTimeout(() => textRef.current?.focus(), 220);
    return () => window.clearTimeout(t);
  }, [open, prefillOffice, prefillDept, snapshot.managementRows, snapshot.departments, snapshot.offices]);

  // Keep dept valid when office changes.
  useEffect(() => {
    if (deptOptions.length === 0) {
      setDept("");
      return;
    }
    if (!deptOptions.includes(dept)) setDept(deptOptions[0]);
  }, [deptOptions, dept]);

  // Keyboard shortcuts while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, office, dept, type, text]);

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      textRef.current?.focus();
      return;
    }
    onSave({ officeId: office, dept, type, text: trimmed });
  };

  return (
    <>
      <div className={`scrim${open ? " open" : ""}`} onClick={onClose} />
      <div
        className={`modal${open ? " open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modalTitle"
      >
        <h3 id="modalTitle">משימה חדשה</h3>
        <p className="sub">בחר משרד, מחלקה וסוג משימה.</p>

        <div className="field">
          <label className="label">משרד</label>
          <select
            className="select"
            value={office}
            onChange={(e) => setOffice(e.target.value)}
          >
            {snapshot.offices.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
            <option value={MGMT_ID}>הנהלה</option>
          </select>
        </div>

        <div className="field">
          <label className="label">מחלקה</label>
          <select
            className="select"
            value={dept}
            onChange={(e) => setDept(e.target.value)}
          >
            {deptOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="label">סוג משימה</label>
          <div className="toggle-row">
            <button
              type="button"
              className={type === "יומי" ? "on" : ""}
              data-val="yomi"
              onClick={() => setType("יומי")}
            >
              <span className="pip" />
              יומי
            </button>
            <button
              type="button"
              className={type === "קבוע" ? "on" : ""}
              data-val="kavua"
              onClick={() => setType("קבוע")}
            >
              <span className="pip" />
              קבוע
            </button>
          </div>
        </div>

        <div className="field">
          <label className="label">תיאור המשימה</label>
          <textarea
            ref={textRef}
            className="input"
            rows={2}
            placeholder="לדוגמה: כתבה ראשית · חדשות בוקר"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        <div className="modal-actions">
          <span className="meta">
            <span className="kbd">⌘ ↵</span>
            לשמירה
          </span>
          <button className="btn btn-ghost" type="button" onClick={onClose}>
            ביטול
          </button>
          <button className="btn btn-primary" type="button" onClick={submit}>
            שמירה
          </button>
        </div>
      </div>
    </>
  );
}
