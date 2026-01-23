import { requireOrganization } from "@/server/auth";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Crown, ArrowRight } from "lucide-react";
import Link from "next/link";
import prisma from "@/lib/prisma";

async function getOrganization(orgId: string) {
  return prisma.organization.findUnique({
    where: { id: orgId },
  });
}

export default async function SettingsPage() {
  const session = await requireOrganization();
  const organization = await getOrganization(session.currentOrganization.id);

  if (!organization) {
    return <div>ไม่พบองค์กร</div>;
  }

  return (
    <>
      <AppHeader 
        title="ตั้งค่าองค์กร" 
        description="จัดการข้อมูลองค์กรของคุณ"
        showCreateButton={false}
      />
      
      <div className="p-6 max-w-2xl space-y-6">
        {/* Subscription Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    แพ็คเกจการใช้งาน
                    <Badge variant={organization.plan === "FREE" ? "secondary" : "default"}>
                      {organization.plan || "FREE"}
                    </Badge>
                  </CardTitle>
                  <CardDescription>จัดการแพ็คเกจและดูสถานะการใช้งาน</CardDescription>
                </div>
              </div>
              <Button asChild>
                <Link href="/settings/subscription">
                  จัดการแพ็คเกจ
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Organization Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>ข้อมูลองค์กร</CardTitle>
                <CardDescription>แก้ไขข้อมูลพื้นฐานขององค์กร</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">ชื่อองค์กร</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={organization.name}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxId">เลขประจำตัวผู้เสียภาษี</Label>
                <Input
                  id="taxId"
                  name="taxId"
                  defaultValue={organization.taxId || ""}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
                  <Input
                    id="phone"
                    name="phone"
                    defaultValue={organization.phone || ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">อีเมล</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={organization.email || ""}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">ที่อยู่</Label>
                <Textarea
                  id="address"
                  name="address"
                  rows={3}
                  defaultValue={organization.address || ""}
                />
              </div>

              <div className="pt-2">
                <Button type="submit">บันทึกการเปลี่ยนแปลง</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
