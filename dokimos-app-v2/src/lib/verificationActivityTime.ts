/**
 * Human-readable relative time for verification activity (consumer + verifier UIs).
 * Prefers granular phrases for very recent events, then calendar-relative labels.
 */
export function formatVerificationActivityRelativeTime(iso: string): string {
  const now = new Date();
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return "";

  const diffMs = now.getTime() - then.getTime();
  if (diffMs < 0) {
    return then.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const sec = Math.floor(diffMs / 1000);
  const min = Math.floor(sec / 60);
  const hrs = Math.floor(min / 60);

  if (sec < 60) return "Just now";
  if (min < 60) return `${min} min${min === 1 ? "" : "s"} ago`;
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfThen = new Date(then.getFullYear(), then.getMonth(), then.getDate());
  const calendarDiffDays = Math.round(
    (startOfToday.getTime() - startOfThen.getTime()) / 86400000
  );

  if (calendarDiffDays === 0) return "Today";
  if (calendarDiffDays === 1) return "Yesterday";
  if (calendarDiffDays < 7) return `${calendarDiffDays} days ago`;

  const sameYear = then.getFullYear() === now.getFullYear();
  return then.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" as const }),
  });
}
