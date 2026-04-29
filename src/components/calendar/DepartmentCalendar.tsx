"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Task } from "@/lib/types";
import type { FilterValue } from "@/components/dashboard/Toolbar";
import { hexToSoft } from "@/lib/colors";
import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon, StarIcon } from "@/components/dashboard/icons";
import TopNav from "@/components/dashboard/TopNav";

const HEBREW_DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

const HEBREW_MONTHS: Record<string, string> = {
  "01": "ינואר",
  "02": "פברואר",
  "03": "מרץ",
  "04": "אפריל",
  "05": "מאי",
  "06": "יוני",
  "07": "יולי",
  "08": "אוגוסט",
  "09": "ספטמבר",
  "10": "אוקטובר",
  "11": "נובמבר",
  "12": "דצמבר",
};

interface OfficeInfo {
  id: string;
  name: string;
  logo: string;
  logoBg: string;
  brand: string;
  meta: string;
}

interface DepartmentCalendarProps {
  officeId: string;
  office: OfficeInfo | null;
  yearMonth: string;
  yomiByDate: Record<string, Task[]>;
  kavuaTasks: Task[];
  departments: string[];
}

function shiftMonth(yearMonth: string, delta: number): string {
  const [y, m] = yearMonth.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function todayKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function daysInMonth(yearMonth: string): number {
  const [y, m] = yearMonth.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

function firstDayOfWeek(yearMonth: string): number {
  const [y, m] = yearMonth.split("-").map(Number);
  return new Date(y, m - 1, 1).getDay(); // 0=Sun
}

function dateKey(yearMonth: string, day: number): string {
  return `${yearMonth}-${String(day).padStart(2, "0")}`;
}

interface DayCellProps {
  day: number;
  yearMonth: string;
  filter: FilterValue;
  yomiByDate: Record<string, Task[]>;
  kavuaTasks: Task[];
  isToday: boolean;
}

function DayCell({ day, yearMonth, filter, yomiByDate, kavuaTasks, isToday }: DayCellProps) {
  const dk = dateKey(yearMonth, day);
  const yomiTasks = filter !== "kavua" ? (yomiByDate[dk] ?? []) : [];
  const fixedTasks = filter !== "yomi" ? kavuaTasks : [];
  const allTasks = [...yomiTasks, ...fixedTasks];

  return (
    <div className={`cal-cell${isToday ? " today" : ""}${allTasks.length ? " has-tasks" : ""}`}>
      <div className="cal-date">{day}</div>
      {allTasks.length > 0 && (
        <div className="cal-tasks">
          {yomiTasks.map((t) => (
            <div key={t.id} className="cal-chip yomi" title={`${t.dept} · ${t.text}`}>
              <span className="cal-chip-dot" />
              <span className="cal-chip-text">{t.text}</span>
            </div>
          ))}
          {fixedTasks.map((t) => (
            <div key={t.id} className="cal-chip kavua" title={`${t.dept} · ${t.text}`}>
              <span className="cal-chip-dot" />
              <span className="cal-chip-text">{t.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DepartmentCalendar({
  officeId,
  office,
  yearMonth,
  yomiByDate,
  kavuaTasks,
  departments,
}: DepartmentCalendarProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterValue>("all");

  const [, monthNum] = yearMonth.split("-");
  const monthLabel = HEBREW_MONTHS[monthNum] ?? monthNum;
  const yearNum = yearMonth.split("-")[0];

  const prevMonth = useMemo(() => shiftMonth(yearMonth, -1), [yearMonth]);
  const nextMonth = useMemo(() => shiftMonth(yearMonth, 1), [yearMonth]);

  const today = useMemo(() => todayKey(), []);
  const totalDays = useMemo(() => daysInMonth(yearMonth), [yearMonth]);
  const startDow = useMemo(() => firstDayOfWeek(yearMonth), [yearMonth]);

  const goToMonth = useCallback(
    (ym: string) => {
      router.push(`/calendar/${officeId}?month=${ym}`);
    },
    [router, officeId],
  );

  const officeBrand = office?.brand ?? "#8b5cf6";
  const officeBrandSoft = hexToSoft(officeBrand);

  // Count stats for the displayed month
  const totalYomi = Object.values(yomiByDate).reduce((s, arr) => s + arr.length, 0);

  const seg = (val: FilterValue, label: string) => (
    <button
      key={val}
      className={filter === val ? "on" : ""}
      onClick={() => setFilter(val)}
      type="button"
    >
      {label}
    </button>
  );

  return (
    <div data-theme-host>
      <div className="shell">

        {/* ── Top Nav ── */}
        <TopNav />

        {/* ── Calendar Header ── */}
        <header className="cal-page-head"
          style={{ "--brand": officeBrand, "--brand-soft": officeBrandSoft } as React.CSSProperties}>
          <div className="cal-office-info">
            <Link href="/" className="btn btn-ghost btn-sm cal-back-btn" style={{ gap: 6, flexShrink: 0 }}>
              <ArrowRightIcon />
              חזרה
            </Link>
            {office ? (
              <div className="logo-tile cal-logo-tile"
                style={{ ["--logo-bg" as string]: office.logoBg } as React.CSSProperties}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={office.logo} alt={office.name} loading="lazy" />
              </div>
            ) : (
              <div className="logo-tile cal-logo-tile">
                <StarIcon width={20} height={20} />
              </div>
            )}
            <div>
              <h1 className="h-title" style={{ fontSize: 22 }}>
                {office?.name ?? "הנהלה"}
                <span className="brand-pill">{office?.meta ?? "גמיש · עריכה חופשית"}</span>
              </h1>
              <p style={{ fontSize: 12.5, color: "var(--fg-3)", margin: "4px 0 0" }}>
                {departments.length} מחלקות
                <span style={{ margin: "0 8px", color: "var(--fg-4)" }}>·</span>
                {totalYomi} יומיות נרשמו
                <span style={{ margin: "0 8px", color: "var(--fg-4)" }}>·</span>
                {kavuaTasks.length} קבועות
              </p>
            </div>
          </div>

          {/* Month navigation */}
          <div className="cal-month-nav">
            <button
              className="icon-btn"
              title="חודש הבא"
              onClick={() => goToMonth(nextMonth)}
              type="button"
            >
              <ChevronLeftIcon />
            </button>
            <div className="cal-month-label">
              <span className="cal-month-name">{monthLabel}</span>
              <span className="cal-month-year">{yearNum}</span>
            </div>
            <button
              className="icon-btn"
              title="חודש קודם"
              onClick={() => goToMonth(prevMonth)}
              type="button"
            >
              <ChevronRightIcon />
            </button>
          </div>
        </header>

        {/* ── Filter Toolbar ── */}
        <div className="toolbar" style={{ marginBottom: 20 }}>
          <div className="seg">
            {seg("all", "הכל")}
            {seg("yomi", "יומי")}
            {seg("kavua", "קבוע")}
          </div>
          <div className="spacer" />
          <span style={{ fontSize: "11.5px", color: "var(--fg-3)" }}>
            <b>{totalDays}</b> ימים בחודש
          </span>
        </div>

        {/* ── Calendar Grid ── */}
        <div className="cal-grid-wrap">
          {/* Day-of-week headers */}
          <div className="cal-grid cal-header-row">
            {HEBREW_DAYS.map((d) => (
              <div key={d} className="cal-day-head">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="cal-grid cal-body">
            {/* Leading empty cells */}
            {Array.from({ length: startDow }, (_, i) => (
              <div key={`empty-start-${i}`} className="cal-cell empty" />
            ))}

            {/* Day cells */}
            {Array.from({ length: totalDays }, (_, i) => {
              const day = i + 1;
              const dk = dateKey(yearMonth, day);
              return (
                <DayCell
                  key={dk}
                  day={day}
                  yearMonth={yearMonth}
                  filter={filter}
                  yomiByDate={yomiByDate}
                  kavuaTasks={kavuaTasks}
                  isToday={dk === today}
                />
              );
            })}
          </div>
        </div>

        {/* ── Legend ── */}
        <footer className="foot-note" style={{ marginTop: 32 }}>
          <div className="legend">
            <span className="lg">
              <span className="ld" style={{ background: "var(--yomi)" }} />
              יומי · נרשם ביום הספציפי
            </span>
            <span className="lg">
              <span className="ld" style={{ background: "var(--kavua)" }} />
              קבוע · מוצג בכל ימי החודש
            </span>
          </div>
          <div>יערית / Operations</div>
        </footer>

      </div>
    </div>
  );
}
