"use client";

import { useEffect, useState } from "react";
import { ExportIcon, PlusIcon, RefreshIcon } from "./icons";

interface PageHeaderProps {
  yomiCount: number;
  kavuaCount: number;
  onAdd: () => void;
}

const HEBREW_MONTHS = [
  "בינואר",
  "בפברואר",
  "במרץ",
  "באפריל",
  "במאי",
  "ביוני",
  "ביולי",
  "באוגוסט",
  "בספטמבר",
  "באוקטובר",
  "בנובמבר",
  "בדצמבר",
];

function formatHebrewDate(d: Date) {
  return `${d.getDate()} ${HEBREW_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export default function PageHeader({ yomiCount, kavuaCount, onAdd }: PageHeaderProps) {
  const [today, setToday] = useState<string>("");

  useEffect(() => {
    setToday(formatHebrewDate(new Date()));
  }, []);

  return (
    <header className="page-head">
      <div>
        <h1 className="h-title">
          סקירת תפעול
          <span className="live-dot" title="עדכון חי" />
        </h1>
        <p className="h-sub">
          חמישה משרדים · חמש מחלקות · נכון להיום, <span>{today}</span>
          <span className="sep">·</span>
          <span>
            {yomiCount} משימות יומיות פעילות · {kavuaCount} קבועות
          </span>
        </p>
      </div>
      <div className="h-actions">
        <button className="btn btn-ghost btn-sm" type="button">
          <RefreshIcon /> רענן
        </button>
        <button className="btn btn-ghost btn-sm" type="button">
          <ExportIcon /> ייצוא
        </button>
        <button className="btn btn-primary" type="button" onClick={onAdd}>
          <PlusIcon /> משימה חדשה
          <span className="kbd" style={{ marginRight: 4, opacity: 0.7 }}>
            N
          </span>
        </button>
      </div>
    </header>
  );
}
