import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import type { BriefDoc, NextGame } from "@/lib/types";
import { briefToMarkdown } from "@/lib/brief/build";

function formatDate(date: string): string {
  const d = new Date(`${date}T12:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export function BriefHero({ brief, game }: { brief: BriefDoc; game?: NextGame }) {
  return (
    <section className="mx-auto max-w-4xl px-5 sm:px-8">
      <div className="relative overflow-hidden rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/15 to-accent/[0.04] px-5 pb-5 pt-5 shadow-[0_8px_40px_-10px_rgba(139,92,246,0.35)]">
        <span
          aria-hidden
          className="pointer-events-none absolute -left-10 -top-8 h-52 w-52 rounded-full bg-accent/20 blur-[46px]"
        />
        <div className="relative">
          <div className="mb-3 flex flex-wrap items-center gap-2.5">
            <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-bg">
              Today&apos;s Brief
            </span>
            <span className="rounded-full border border-edge px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
              {formatDate(brief.date)} · 4:00 AM CT
            </span>
            {game ? (
              <span className="font-mono text-xs text-muted">
                {game.daysUntil} days to {game.opponent}
              </span>
            ) : null}
          </div>

          <h1 className="text-balance text-[1.4rem] font-extrabold leading-tight tracking-tight sm:text-2xl">
            {brief.oneLiner}
          </h1>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
            <span>
              <b className="text-ink">{brief.counts.total}</b> stories in the window
            </span>
            {brief.counts.brad > 0 ? (
              <span>
                <b className="text-gold">{brief.counts.brad}</b> Brad mention
                {brief.counts.brad === 1 ? "" : "s"}
              </span>
            ) : null}
            <span className="uppercase tracking-wide">
              {brief.source === "tailored" ? "AI brief" : "auto brief"}
            </span>
          </div>

          <div className="brief-body relative mt-4 border-t border-edge/70 pt-3">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
              {briefToMarkdown(brief)}
            </ReactMarkdown>
          </div>
        </div>
      </div>

      {game ? (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-edge bg-surface px-4 py-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
              Next Game
            </div>
            <div className="mt-1 text-lg font-extrabold leading-tight">
              {game.home ? "vs" : "at"} {game.opponent}
            </div>
            <div className="mt-0.5 text-xs text-muted">{game.venue}</div>
          </div>
          <div className="rounded-xl border border-edge bg-surface px-4 py-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
              Countdown
            </div>
            <div className="mt-1 font-mono text-lg font-extrabold">
              {game.daysUntil} days
            </div>
            {game.note ? (
              <div className="mt-0.5 truncate text-xs text-muted" title={game.note}>
                {game.note}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
