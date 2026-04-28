"use client";

import { useState } from "react";
import type { Task } from "@/lib/types";

interface TaskChipProps {
  task: Task;
  isNew?: boolean;
  filter: "all" | "yomi" | "kavua";
  onRemove: (task: Task) => void;
}

export default function TaskChip({ task, isNew, filter, onRemove }: TaskChipProps) {
  const [removing, setRemoving] = useState(false);
  const type = task.type === "יומי" ? "yomi" : "kavua";

  const visible = filter === "all" || filter === type;
  if (!visible) return null;

  const handleRemove = () => {
    setRemoving(true);
    window.setTimeout(() => onRemove(task), 180);
  };

  return (
    <span
      className={`task${isNew ? " new" : ""}${removing ? " removing" : ""}`}
      data-type={type}
      data-text={task.text}
    >
      <span className="tip" />
      <span className="text">{task.text}</span>
      <button className="x" type="button" onClick={handleRemove} title="הסר" aria-label="הסר">
        ×
      </button>
    </span>
  );
}
