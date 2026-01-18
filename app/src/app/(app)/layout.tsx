import { redirect } from "next/navigation";
import { getSession } from "@/server/auth";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

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
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <AppSidebar user={session} />
      </div>
      
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
        <MobileNav user={session} />
        <div className="flex-1">
          <h1 className="text-lg font-semibold">กล่องเอกสาร</h1>
        </div>
      </header>
      
      {/* Main Content - adjust padding for desktop sidebar */}
      <main className="md:pl-64">
        {children}
      </main>
    </div>
  );
}
