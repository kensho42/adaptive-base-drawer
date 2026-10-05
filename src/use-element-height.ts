"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
export { useIsomorphicLayoutEffect };

export interface ElementHeight {
  height: number | null;
  previousHeight: number | null;
}

/** Read layout size, independent of Base UI's ancestor swipe/stack transforms. */
export function readElementHeight(element: HTMLElement): number {
  const style = getComputedStyle(element);
  const height = Number.parseFloat(style.height);
  if (!Number.isFinite(height)) return element.offsetHeight;
  if (style.boxSizing === 'border-box') return height;
  const px = (value: string) => Number.parseFloat(value) || 0;
  return height + px(style.paddingTop) + px(style.paddingBottom)
    + px(style.borderTopWidth) + px(style.borderBottomWidth);
}

/** Observe an intrinsic block, never the wrapper whose height we animate. */
export function useElementHeight<T extends HTMLElement>(
  layoutKey?: unknown,
  enabled = true,
) {
  const [element, ref] = useState<T | null>(null);
  const [measurement, setMeasurement] = useState<ElementHeight>({ height: null, previousHeight: null });
  const accepted = useRef<number | null>(null);

  const commit = useCallback((raw: number) => {
    if (!Number.isFinite(raw) || raw < 0) return;
    // Hysteresis ignores ResizeObserver jitter without losing fractional pixels.
    if (accepted.current !== null && Math.abs(raw - accepted.current) < 0.5) return;
    const next = Math.round(raw * 64) / 64;
    const previousHeight = accepted.current;
    accepted.current = next;
    setMeasurement({ height: next, previousHeight });
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (!element || !enabled) return;
    let alive = true;
    let frame: number | null = null;
    commit(readElementHeight(element));
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => {
      if (!alive) return;
      if (frame !== null) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = null;
        if (alive) commit(readElementHeight(element));
      });
    });
    observer?.observe(element, { box: 'border-box' });
    return () => {
      alive = false;
      observer?.disconnect();
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [element, enabled, commit]);

  // Key changes are measured before paint, after popLayout removed the old panel.
  useIsomorphicLayoutEffect(() => {
    if (element && enabled) commit(readElementHeight(element));
  }, [element, enabled, layoutKey, commit]);

  return { ref, ...measurement };
}

export function heightDuration(previous: number | null, next: number | null) {
  if (previous === null || next === null) return 0;
  return Math.min(0.28, Math.max(0.15, Math.abs(next - previous) / 500));
}
