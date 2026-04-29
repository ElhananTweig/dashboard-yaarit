"use client";

import { FilterIcon, SortIcon } from "./icons";

export type FilterValue = "all" | "yomi" | "kavua";
export type AssigneeFilterValue = "all" | "יערית" | "רחמים";

interface ToolbarProps {
  filter: FilterValue;
  onFilterChange: (next: FilterValue) => void;
  assigneeFilter: AssigneeFilterValue;
  onAssigneeFilterChange: (next: AssigneeFilterValue) => void;
  updatedAgo: string;
}

export default function Toolbar({
  filter,
  onFilterChange,
  assigneeFilter,
  onAssigneeFilterChange,
  updatedAgo,
}: ToolbarProps) {
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
      <label className="filter-chip filter-chip-select">
        <FilterIcon />
        <span>שיוך:</span>
        <select
          value={assigneeFilter}
          onChange={(e) => onAssigneeFilterChange(e.target.value as AssigneeFilterValue)}
          aria-label="סינון לפי שיוך"
        >
          <option value="all">הכל</option>
          <option value="יערית">יערית</option>
          <option value="רחמים">רחמים</option>
        </select>
      </label>
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
