import { redirect } from "next/navigation";

/** Activity hub removed — send users to the vault home. */
export default function RequestsPage() {
  redirect("/app/vault");
}
