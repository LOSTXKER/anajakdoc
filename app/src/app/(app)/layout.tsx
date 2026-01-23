import { redirect } from "next/navigation";
import { getSession } from "@/server/auth";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { BackToFirm } from "@/components/layout/back-to-firm";
import { AppShell } from "@/components/layout/app-shell";

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
    <AppShell userName={session.name || undefined}>
      <div className="min-h-screen">
        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden md:block" data-tour="sidebar">
          <AppSidebar user={session} />
        </div>
        
        {/* Mobile Header */}
        <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
          {/* Back to Firm button for Firm Members */}
          {session.firmMembership && (
            <BackToFirm user={session} />
          )}
          <MobileNav user={session} />
          <div className="flex-1">
            <h1 className="text-lg font-semibold">กล่องเอกสาร</h1>
          </div>
        </header>
        
        {/* Main Content - adjust padding for desktop sidebar and mobile bottom nav */}
        <main className="md:pl-60 pb-16 md:pb-0 bg-muted/30 min-h-screen" data-tour="documents-list">
          {children}
        </main>
        
        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
      </div>
    </AppShell>
  );
}
