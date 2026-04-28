"use client";

import { useEffect, useRef, useState } from "react";
import type { ManagementRow, Task } from "@/lib/types";
import { MoreIcon, PlusSmallIcon, StarIcon, TrashIcon } from "./icons";
import TaskChip from "./TaskChip";

interface ManagementCardProps {
  rows: ManagementRow[];
  newTaskIds: Set<string>;
  /** ID of a row that was just added — its row should animate in and focus the input. */
  newRowId: string | null;
  filter: "all" | "yomi" | "kavua";
  onQuickAdd: (rowName: string) => void;
  onAddRow: () => void;
  onRemoveRow: (rowId: string) => void;
  onRenameRow: (rowId: string, name: string) => void;
  onRemoveTask: (task: Task) => void;
  animationDelayMs?: number;
}

export default function ManagementCard({
  rows,
  newTaskIds,
  newRowId,
  filter,
  onQuickAdd,
  onAddRow,
  onRemoveRow,
  onRenameRow,
  onRemoveTask,
  animationDelayMs,
}: ManagementCardProps) {
  const [removingRowId, setRemovingRowId] = useState<string | null>(null);
  const newRowRef = useRef<HTMLInputElement | null>(null);

  let yomi = 0;
  let kavua = 0;
  rows.forEach((r) =>
    r.tasks.forEach((t) => {
      if (t.type === "יומי") yomi++;
      else kavua++;
    }),
  );
  const total = yomi + kavua;
  const ratio = total ? Math.round((yomi / total) * 100) : 0;

  // When a new row is added, focus its name input.
  useEffect(() => {
    if (newRowId && newRowRef.current) {
      newRowRef.current.focus();
      newRowRef.current.select();
    }
  }, [newRowId]);

  const handleDeleteRow = (rowId: string) => {
    setRemovingRowId(rowId);
    window.setTimeout(() => {
      onRemoveRow(rowId);
      setRemovingRowId(null);
    }, 230);
  };

  return (
    <article
      className="card mgmt animate-in"
      data-office="mgmt"
      style={
        {
          "--brand": "#8b5cf6",
          "--brand-soft": "rgba(139,92,246,.12)",
          animationDelay: animationDelayMs ? `${animationDelayMs}ms` : undefined,
        } as React.CSSProperties
      }
    >
      <header className="card-head">
        <div className="logo-tile">
          <StarIcon />
        </div>
        <div className="office-id">
          <div className="name">
            הנהלה
            <span className="brand-pill">גמיש · עריכה חופשית</span>
          </div>
          <div className="meta">
            <span>{rows.length}</span> שורות
            <span className="dot-sep">·</span>
            <span>{total}</span> משימות
          </div>
        </div>
        <div className="head-actions">
          <button className="ico" title="עוד" type="button">
            <MoreIcon />
          </button>
        </div>
      </header>

      <div className="dept-list">
        {rows.map((row) => {
          const isRemoving = removingRowId === row.id;
          const isNewRow = row.id === newRowId;
          return (
            <div
              className={`dept${isRemoving ? " removing" : ""}${isNewRow ? " new" : ""}`}
              data-row-id={row.id}
              key={row.id}
            >
              <div className="dept-name">
                <span className="nub" />
                <input
                  ref={isNewRow ? newRowRef : undefined}
                  className="row-name"
                  defaultValue={row.name}
                  maxLength={32}
                  onChange={(e) => onRenameRow(row.id, e.target.value)}
                  dir="rtl"
                />
              </div>
              <div className="dept-tasks">
                {row.tasks.length ? (
                  row.tasks.map((task) => (
                    <TaskChip
                      key={task.id}
                      task={task}
                      isNew={newTaskIds.has(task.id)}
                      filter={filter}
                      onRemove={onRemoveTask}
                    />
                  ))
                ) : (
                  <span className="empty-tasks">— אין משימות —</span>
                )}
              </div>
              <div className="row-controls">
                <button
                  className="dept-add"
                  title="הוסף משימה"
                  type="button"
                  style={{ opacity: 1 }}
                  onClick={() => onQuickAdd(row.name)}
                >
                  <PlusSmallIcon />
                </button>
                <button
                  className="row-del"
                  title="מחק שורה"
                  type="button"
                  onClick={() => handleDeleteRow(row.id)}
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button className="add-row" type="button" onClick={onAddRow}>
        <span className="plus">+</span>
        הוסף שורה חדשה
      </button>

      <footer className="card-foot">
        <span className="stat-mini y">
          <span className="dot" />
          {yomi}
        </span>
        <span className="stat-mini k">
          <span className="dot" />
          {kavua}
        </span>
        <div className="progress">
          <span style={{ width: `${ratio}%` }} />
        </div>
        <span style={{ color: "var(--fg-3)", fontFeatureSettings: "'tnum'" }}>{ratio}%</span>
      </footer>
    </article>
  );
}
