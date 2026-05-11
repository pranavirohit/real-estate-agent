/** Log server-side errors without echoing sensitive upstream payloads. */
export function logApiError(context: string, error: unknown): void {
  const msg = error instanceof Error ? error.message : "unknown error";
  console.error(`${context}:`, msg);
}
