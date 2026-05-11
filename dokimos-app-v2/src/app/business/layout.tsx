import { AppShellLayout } from "@/components/dokimos/AppShellLayout";

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShellLayout>{children}</AppShellLayout>;
}
