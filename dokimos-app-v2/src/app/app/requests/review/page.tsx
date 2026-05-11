import { redirect } from "next/navigation";

/** Review UI moved to the in-app request modal (`RequestNotificationModal`). */
export default function RequestReviewPage() {
  redirect("/app/vault");
}
