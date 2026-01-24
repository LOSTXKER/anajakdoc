import { getSession } from "@/server/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Building2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NewClientForm } from "./_components/new-client-form";

export default async function NewClientPage() {
  const session = await getSession();
  
  if (!session?.firmMembership) {
    redirect("/dashboard");
  }

  // Only OWNER and ADMIN can create clients
  const role = session.firmMembership.role;
  if (role !== "OWNER" && role !== "ADMIN") {
    redirect("/firm/clients");
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Back Link */}
      <Link
        href="/firm/clients"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        กลับไปหน้า Clients
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
          <Building2 className="h-6 w-6 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">เพิ่ม Client ใหม่</h1>
          <p className="text-muted-foreground">
            สร้างธุรกิจลูกค้าใหม่ในระบบ
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลธุรกิจ</CardTitle>
          <CardDescription>
            กรอกข้อมูลธุรกิจของลูกค้า ข้อมูลเหล่านี้จะใช้ในการออกเอกสารและรายงาน
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewClientForm firmId={session.firmMembership.firmId} />
        </CardContent>
      </Card>
    </div>
  );
}
