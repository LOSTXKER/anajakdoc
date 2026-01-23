import { redirect } from "next/navigation";
import { getSession } from "@/server/auth";
import { FirmSidebar } from "@/components/firm/firm-sidebar";

export default async function FirmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Only firm members can access /firm
  if (!session.firmMembership) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <FirmSidebar user={session} />
      </div>
      
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
        <div className="flex-1">
          <h1 className="text-lg font-semibold">Firm Portal</h1>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="md:pl-60 bg-background min-h-screen">
        {children}
      </main>
    </div>
  );
}
