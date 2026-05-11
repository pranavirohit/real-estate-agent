/**
 * Page hero title + subtitle — same typography as DokimosFlow (Instrument Serif + Sans).
 */
export function DokimosPageTitle({
  title,
  subtitle,
  titleClassName,
  subtitleClassName,
  /** When false, title uses the app sans (e.g. Geist) — for business dashboards. */
  useSerifTitle = true,
}: {
  title: string;
  subtitle?: string;
  /** Override title size/weight (e.g. verifier business density). */
  titleClassName?: string;
  /** Override subtitle spacing/size (e.g. workflows uses mt-2 text-sm). */
  subtitleClassName?: string;
  useSerifTitle?: boolean;
}) {
  return (
    <div>
      <h1
        className={
          titleClassName ??
          "mb-2 text-3xl font-bold tracking-tight text-gray-900"
        }
        style={
          useSerifTitle
            ? { fontFamily: "var(--font-instrument-serif), Georgia, serif" }
            : undefined
        }
      >
        {title}
      </h1>
      {subtitle ? (
        <p
          className={
            subtitleClassName ??
            "text-[15px] leading-relaxed tracking-[-0.011em] text-gray-500"
          }
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
