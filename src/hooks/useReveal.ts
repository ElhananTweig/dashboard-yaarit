"use client";

import { useEffect } from "react";

/**
 * Adds the `animate-reveal` class to all `.reveal` elements, then uses an
 * IntersectionObserver to add `.in` when they enter the viewport. Honors
 * prefers-reduced-motion. Includes a 1.5s safety net so nothing is left
 * stuck invisible.
 */
export function useReveal(deps: ReadonlyArray<unknown> = []) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !("IntersectionObserver" in window)) return;

    const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    els.forEach((el) => el.classList.add("animate-reveal"));

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 },
    );
    els.forEach((el) => io.observe(el));

    const safety = window.setTimeout(() => {
      document.querySelectorAll<HTMLElement>(".reveal").forEach((el) => el.classList.add("in"));
    }, 1500);

    return () => {
      io.disconnect();
      window.clearTimeout(safety);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
