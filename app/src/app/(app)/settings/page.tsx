import { requireOrganization } from "@/server/auth";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2 } from "lucide-react";
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
      
      <div className="p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              ข้อมูลองค์กร
            </CardTitle>
            <CardDescription>
              แก้ไขข้อมูลพื้นฐานขององค์กร
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
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

              <div className="space-y-2">
                <Label htmlFor="address">ที่อยู่</Label>
                <Textarea
                  id="address"
                  name="address"
                  rows={3}
                  defaultValue={organization.address || ""}
                />
              </div>

              <Button type="submit">บันทึกการเปลี่ยนแปลง</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
