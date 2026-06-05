"use client";

import { useState } from "react";

/**
 * Cosmetic "Family Picks" reaction — deliberately NOT a hotness-ranking input.
 * With ~10-50 known relatives, in-app voting is gameable and meaningless as a
 * ranking signal (DESIGN.md §5), so this is a local, feel-good tap. A real
 * implementation would persist a per-user, rate-limited count.
 */
export function VoteButton({ initial = 0 }: { initial?: number }) {
  const [count, setCount] = useState(initial);
  const [on, setOn] = useState(false);

  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => {
        setOn((v) => !v);
        setCount((c) => c + (on ? -1 : 1));
      }}
      className={`flex min-h-[38px] items-center gap-1.5 rounded-full border px-3 text-sm font-bold transition-colors ${
        on
          ? "border-accent bg-accent/20 text-accent-hover"
          : "border-edge bg-surface-alt text-muted hover:border-accent hover:text-accent-hover"
      }`}
    >
      <span className="text-sm leading-none">▲</span>
      <span className="font-mono">{count}</span>
    </button>
  );
}
