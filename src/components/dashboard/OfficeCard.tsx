"use client";

import Link from "next/link";
import { hexToSoft } from "@/lib/colors";
import type { Office, Task } from "@/lib/types";
import { CalendarIcon, FilterSmallIcon, MoreIcon, PlusSmallIcon } from "./icons";
import TaskChip from "./TaskChip";

interface OfficeCardProps {
  office: Office;
  departments: string[];
  tasksByDept: Record<string, Task[]>;
  /** Set of task IDs that should animate in. */
  newTaskIds: Set<string>;
  filter: "all" | "yomi" | "kavua";
  onQuickAdd: (officeId: string, dept: string) => void;
  onRemoveTask: (task: Task) => void;
  /** Optional staggered animation delay in ms. */
  animationDelayMs?: number;
}

export default function OfficeCard({
  office,
  departments,
  tasksByDept,
  newTaskIds,
  filter,
  onQuickAdd,
  onRemoveTask,
  animationDelayMs,
}: OfficeCardProps) {
  let yomi = 0;
  let kavua = 0;
  departments.forEach((d) => {
    (tasksByDept[d] ?? []).forEach((t) => {
      if (t.type === "יומי") yomi++;
      else kavua++;
    });
  });
  const total = yomi + kavua;
  const ratio = total ? Math.round((yomi / total) * 100) : 0;

  return (
    <article
      className="card animate-in"
      data-office={office.id}
      style={
        {
          "--brand": office.brand,
          "--brand-soft": hexToSoft(office.brand),
          animationDelay: animationDelayMs ? `${animationDelayMs}ms` : undefined,
        } as React.CSSProperties
      }
    >
      <header className="card-head">
        <div className="logo-tile" style={{ ["--logo-bg" as string]: office.logoBg } as React.CSSProperties}>
          {/* Plain <img> keeps logoBg backdrops simple; no Next/Image for these tiny brand marks. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={office.logo} alt={office.name} loading="lazy" />
        </div>
        <div className="office-id">
          <div className="name">
            {office.name}
            <span className="brand-pill">{office.meta}</span>
          </div>
          <div className="meta">
            5 מחלקות
            <span className="dot-sep">·</span>
            <span>{total}</span> משימות
          </div>
        </div>
        <div className="head-actions">
          <Link href={`/calendar/${office.id}`} className="ico" title="יומן חודשי">
            <CalendarIcon />
          </Link>
          <button className="ico" title="פילטר" type="button">
            <FilterSmallIcon />
          </button>
          <button className="ico" title="עוד" type="button">
            <MoreIcon />
          </button>
        </div>
      </header>

      <div className="dept-list">
        {departments.map((d) => {
          const tasks = tasksByDept[d] ?? [];
          return (
            <div className="dept" data-dept={d} key={d}>
              <div className="dept-name">
                <span className="nub" />
                {d}
              </div>
              <div className="dept-tasks">
                {tasks.length ? (
                  tasks.map((task) => (
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
              <button
                className="dept-add"
                title="הוסף משימה"
                type="button"
                onClick={() => onQuickAdd(office.id, d)}
              >
                <PlusSmallIcon />
              </button>
            </div>
          );
        })}
      </div>

      <footer className="card-foot">
        <span className="stat-mini y" title="יומי">
          <span className="dot" />
          {yomi}
        </span>
        <span className="stat-mini k" title="קבוע">
          <span className="dot" />
          {kavua}
        </span>
        <div className="progress" title={`${ratio}% מהמשימות יומיות`}>
          <span style={{ width: `${ratio}%` }} />
        </div>
        <span style={{ color: "var(--fg-3)", fontFeatureSettings: "'tnum'" }}>
          {ratio}%
        </span>
      </footer>
    </article>
  );
}
