/** User-facing workflow labels (IDs come from TEE / verifier programs). */
export function workflowDisplayName(workflow?: string): string {
  if (!workflow?.trim()) return "Verification";
  const map: Record<string, string> = {
    host_verification: "Host verification",
    guest_verification: "Guest identity check",
    driver_background_check: "Driver background check",
    driver_onboarding: "Driver onboarding",
    vehicle_registration: "Vehicle registration",
    continuous_monitoring: "Continuous monitoring",
  };
  return map[workflow] ?? workflow.replace(/_/g, " ");
}
