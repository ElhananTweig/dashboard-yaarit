import type { SVGProps } from "react";

const stroke = (props: SVGProps<SVGSVGElement>) => ({
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 2,
  ...props,
});

export const SearchIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg width={14} height={14} viewBox="0 0 24 24" {...stroke(p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export const MoonIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg width={14} height={14} viewBox="0 0 24 24" {...stroke(p)}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export const SunIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg width={14} height={14} viewBox="0 0 24 24" {...stroke(p)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);

export const BellIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg width={14} height={14} viewBox="0 0 24 24" {...stroke(p)}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

export const RefreshIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg width={13} height={13} viewBox="0 0 24 24" {...stroke(p)}>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
  </svg>
);

export const ExportIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg width={13} height={13} viewBox="0 0 24 24" {...stroke(p)}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export const PlusIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg width={13} height={13} viewBox="0 0 24 24" {...stroke({ ...p, strokeWidth: 2.5 })}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const PlusSmallIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg width={11} height={11} viewBox="0 0 24 24" {...stroke({ ...p, strokeWidth: 2.5 })}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const FilterIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg width={11} height={11} viewBox="0 0 24 24" {...stroke(p)}>
    <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
  </svg>
);

export const SortIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg width={11} height={11} viewBox="0 0 24 24" {...stroke(p)}>
    <path d="M3 6h18M6 12h12M10 18h4" />
  </svg>
);

export const FilterSmallIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg width={13} height={13} viewBox="0 0 24 24" {...stroke(p)}>
    <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
  </svg>
);

export const MoreIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg width={13} height={13} viewBox="0 0 24 24" {...stroke(p)}>
    <circle cx="12" cy="5" r="1.5" />
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="12" cy="19" r="1.5" />
  </svg>
);

export const TrashIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg width={12} height={12} viewBox="0 0 24 24" {...stroke(p)}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);

export const CheckIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg width={10} height={10} viewBox="0 0 24 24" {...stroke({ ...p, strokeWidth: 3 })}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const StarIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg
    width={18}
    height={18}
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth={2.2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...p}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
