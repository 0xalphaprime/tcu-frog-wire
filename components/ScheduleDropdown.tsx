"use client";

import { useState } from "react";
import type { NextGame } from "@/lib/types";

/**
 * "Next Game" card that reveals a floating dropdown of the full season on hover
 * (desktop) or tap (mobile). Past games are dimmed, the next game is highlighted.
 */
export function ScheduleDropdown({ schedule }: { schedule: NextGame[] }) {
  const [open, setOpen] = useState(false);
  const next = schedule.find((g) => g.isNext) ?? schedule[schedule.length - 1];
  if (!next) return null;

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full rounded-xl border border-edge bg-surface px-4 py-3 text-left transition-colors hover:border-accent/40"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
            Next Game
          </span>
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-accent-hover">
            {open ? "▾" : "▸"} Schedule
          </span>
        </div>
        <div className="mt-1 text-lg font-extrabold leading-tight">
          {next.home ? "vs" : "at"} {next.opponent}
        </div>
        <div className="mt-0.5 truncate text-xs text-muted">{next.venue}</div>
        <div className="mt-1 font-mono text-[11px] text-accent-hover">
          {next.dateLabel} · {next.kickoffLabel}
        </div>
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-30 mt-2 w-[min(88vw,440px)] max-h-[62vh] overflow-auto rounded-xl border border-edge bg-surface-alt p-1.5 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.85)]">
          <div className="flex items-center justify-between px-2.5 py-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
              2026 Schedule
            </span>
            <span className="text-[10px] text-muted">all times CT · kickoffs TBD set by TV</span>
          </div>
          <ul>
            {schedule.map((g, i) => (
              <li key={i}>
                <div
                  className={`flex items-center gap-3 rounded-lg px-2.5 py-2 ${
                    g.isNext ? "bg-accent/15 ring-1 ring-accent/30" : ""
                  } ${g.isPast ? "opacity-45" : ""}`}
                >
                  <span className="w-[4.2rem] shrink-0 font-mono text-[11px] text-muted">
                    {g.dateLabel}
                  </span>
                  <span className="flex-1 truncate text-[13px] font-semibold text-ink">
                    <span className="text-muted">{g.home ? "vs" : "at"}</span> {g.opponent}
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-muted">
                    {g.kickoff ?? "TBD"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
