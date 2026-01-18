import { redirect } from "next/navigation";
import { getSession } from "@/server/auth";
import { AppSidebar } from "@/components/layout/app-sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (!session.currentOrganization) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen">
      <AppSidebar user={session} />
      <main className="pl-64">
        {children}
      </main>
    </div>
  );
}
