export function Header() {
  return (
    <header className="px-5 pt-[calc(env(safe-area-inset-top)_+_1.4rem)] pb-3 sm:px-8">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="h-6 w-6 shrink-0 rounded-full bg-accent shadow-[0_0_24px_rgba(139,92,246,0.65)]" />
          <span className="flex flex-col leading-none">
            <span className="text-lg font-extrabold uppercase tracking-[0.14em]">
              Frog Blog
            </span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
              TCU Football
            </span>
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
          TCU football daily
        </span>
      </div>
      <div className="mx-auto mt-3 max-w-4xl">
        <div className="h-px bg-gradient-to-r from-transparent via-edge to-transparent" />
      </div>
    </header>
  );
}
