/**
 * Full-bleed dark navy + teal glow + bottom wave — same language as onboarding’s left rail.
 * Place inside a `relative` container; uses `absolute inset-0` (add `min-h-*` on parent as needed).
 */
export function DokimosBrandBackdrop({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <div className="absolute inset-0 bg-[#0F172A] bg-gradient-to-b from-[#0F172A] via-[#0c1929] to-[#0f172a]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_0%,rgba(13,148,136,0.15),transparent_55%),radial-gradient(ellipse_90%_70%_at_100%_100%,rgba(13,148,136,0.35),transparent_60%)]" />
      <div className="absolute bottom-0 left-0 right-0 h-28 overflow-hidden">
        <svg
          className="absolute bottom-0 w-[200%] max-w-none text-teal-500/25 sm:w-full"
          viewBox="0 0 440 80"
          preserveAspectRatio="none"
        >
          <path fill="currentColor" d="M0 40 Q110 0 220 40 T440 40 L440 80 L0 80 Z" />
        </svg>
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-teal-600/20 to-transparent" />
      </div>
    </div>
  );
}
