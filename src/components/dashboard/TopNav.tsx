"use client";

import { useEffect, useState } from "react";
import { BellIcon, MoonIcon, SearchIcon, SunIcon } from "./icons";

export default function TopNav() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const t = (document.documentElement.getAttribute("data-theme") as "dark" | "light") || "dark";
    setTheme(t);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* no-op */
    }
  };

  return (
    <nav className="topnav">
      <div className="logo">
        <div className="logo-mark">י</div>
        <div className="logo-text">
          <span className="t">יערית</span>
          <span className="s">/ Operations</span>
        </div>
      </div>

      <div className="search">
        <SearchIcon />
        <input placeholder="חיפוש משימות, משרדים, מחלקות..." />
        <span className="kbd">⌘K</span>
      </div>

      <div className="nav-actions">
        <button
          className="icon-btn"
          onClick={toggle}
          title="החלף ערכת צבעים"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <MoonIcon /> : <SunIcon />}
        </button>
        <button className="icon-btn" title="התראות" aria-label="Notifications">
          <BellIcon />
        </button>
        <div className="avatar">י</div>
      </div>
    </nav>
  );
}
