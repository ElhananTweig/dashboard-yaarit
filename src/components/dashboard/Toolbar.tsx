"use client";

import { FilterIcon, SortIcon } from "./icons";

export type FilterValue = "all" | "yomi" | "kavua";

interface ToolbarProps {
  filter: FilterValue;
  onFilterChange: (next: FilterValue) => void;
  updatedAgo: string;
}

export default function Toolbar({ filter, onFilterChange, updatedAgo }: ToolbarProps) {
  const seg = (val: FilterValue, label: string) => (
    <button
      className={filter === val ? "on" : ""}
      onClick={() => onFilterChange(val)}
      type="button"
    >
      {label}
    </button>
  );

  return (
    <div className="toolbar">
      <div className="seg">
        {seg("all", "הכל")}
        {seg("yomi", "יומי")}
        {seg("kavua", "קבוע")}
      </div>
      <button className="filter-chip" type="button">
        <FilterIcon />
        מחלקה: הכל
      </button>
      <button className="filter-chip" type="button">
        <SortIcon />
        מיון: עדכון אחרון
      </button>
      <div className="spacer" />
      <span style={{ fontSize: "11.5px", color: "var(--fg-3)" }}>
        עודכן לפני <b>{updatedAgo}</b>
      </span>
    </div>
  );
}
