import { requireOrganization } from "@/server/auth";
import { AppHeader } from "@/components/layout/app-header";
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
        <div className="rounded-xl border bg-white p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">ข้อมูลองค์กร</h3>
              <p className="text-sm text-gray-500">แก้ไขข้อมูลพื้นฐานขององค์กร</p>
            </div>
          </div>

          <form className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700">ชื่อองค์กร</Label>
              <Input
                id="name"
                name="name"
                defaultValue={organization.name}
                className="bg-gray-50 border-gray-200 focus:bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxId" className="text-gray-700">เลขประจำตัวผู้เสียภาษี</Label>
              <Input
                id="taxId"
                name="taxId"
                defaultValue={organization.taxId || ""}
                className="bg-gray-50 border-gray-200 focus:bg-white"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-700">เบอร์โทรศัพท์</Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={organization.phone || ""}
                  className="bg-gray-50 border-gray-200 focus:bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">อีเมล</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={organization.email || ""}
                  className="bg-gray-50 border-gray-200 focus:bg-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-gray-700">ที่อยู่</Label>
              <Textarea
                id="address"
                name="address"
                rows={3}
                defaultValue={organization.address || ""}
                className="bg-gray-50 border-gray-200 focus:bg-white"
              />
            </div>

            <div className="pt-2">
              <Button type="submit">บันทึกการเปลี่ยนแปลง</Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
