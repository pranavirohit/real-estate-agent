/**
 * Single place for EigenCloud verification dashboard URLs and default app id.
 * Import from here (or re-exports in eigenUrls / eigenConstants) instead of hardcoding.
 */

export const DEFAULT_EIGEN_APP_ID =
  "0x00658e70d8880910277592b3b41f9dd3fe4ce5fd";

export const EIGEN_VERIFY_DASHBOARD_BASE =
  "https://verify-sepolia.eigencloud.xyz/app";

/** EigenCompute “verify app” dashboard (Sepolia). Override full URL via env for a different deployment. */
export function getEigenVerificationDashboardUrl(appId?: string): string {
  const fromEnv =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_EIGEN_VERIFICATION_URL
      : undefined;
  if (fromEnv?.startsWith("http")) return fromEnv;
  const id = appId ?? DEFAULT_EIGEN_APP_ID;
  return `${EIGEN_VERIFY_DASHBOARD_BASE}/${id}`;
}
