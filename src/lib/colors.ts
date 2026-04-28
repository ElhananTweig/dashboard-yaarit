/** Convert a `#rrggbb` brand color to its 10%-alpha "soft" variant. */
export function hexToSoft(hex: string, alpha = 0.1): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
