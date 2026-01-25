import { requireFirmOwner } from "@/server/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";

export default async function FirmSettingsPage() {
  // Only firm owners can access this page
  const session = await requireFirmOwner();

  // Fetch firm settings from database
  const firm = await prisma.accountingFirm.findUnique({
    where: { id: session.firmMembership.firmId },
    include: {
      members: {
        where: { isActive: true },
        select: { id: true },
      },
    },
  });

  if (!firm) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">ไม่พบข้อมูลสำนักงาน</p>
      </div>
    );
  }

  const firmSettings = {
    name: firm.name,
    taxId: firm.taxId || "",
    address: firm.address || "",
    phone: firm.phone || "",
    email: firm.email || "",
    plan: "STARTER",
    membersUsed: firm.members.length,
    membersLimit: 10, // Based on plan
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">ตั้งค่าสำนักงาน</h1>
        <p className="text-muted-foreground">
          จัดการข้อมูลและการตั้งค่าของสำนักงานบัญชี
        </p>
      </div>

      {/* General Info */}
      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลทั่วไป</CardTitle>
          <CardDescription>ข้อมูลพื้นฐานของสำนักงาน</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">ชื่อสำนักงาน</Label>
              <Input id="name" defaultValue={firmSettings.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxId">เลขประจำตัวผู้เสียภาษี</Label>
              <Input id="taxId" defaultValue={firmSettings.taxId} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">ที่อยู่</Label>
            <Input id="address" defaultValue={firmSettings.address} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">เบอร์โทร</Label>
              <Input id="phone" defaultValue={firmSettings.phone} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">อีเมล</Label>
              <Input id="email" type="email" defaultValue={firmSettings.email} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>โลโก้</Label>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
                <Settings className="h-6 w-6 text-muted-foreground" />
              </div>
              <Button variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                อัพโหลด
              </Button>
            </div>
          </div>
          <div className="flex justify-end">
            <Button>บันทึก</Button>
          </div>
        </CardContent>
      </Card>

      {/* Branding (Pro Only) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Branding</CardTitle>
              <CardDescription>ปรับแต่งแบรนด์ของสำนักงาน</CardDescription>
            </div>
            <Badge variant="secondary">Pro Plan Only</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">สีหลัก</Label>
              <Input id="primaryColor" type="color" defaultValue="#0F766E" disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="footer">Footer text</Label>
              <Input id="footer" placeholder="© 2026 สำนักงานบัญชี" disabled />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="domain">Custom domain</Label>
            <div className="flex items-center gap-2">
              <Input id="domain" placeholder="yourfirm" disabled className="flex-1" />
              <span className="text-muted-foreground">.anajakdoc.com</span>
            </div>
          </div>
          <Button variant="outline" disabled>อัพเกรดเป็น Pro</Button>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>แผนการใช้งานปัจจุบัน</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <p className="font-medium">Firm Starter</p>
              <p className="text-sm text-muted-foreground">฿990/เดือน</p>
            </div>
            <Badge>Active</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">สมาชิก</p>
              <p className="text-sm text-muted-foreground">
                {firmSettings.membersUsed}/{firmSettings.membersLimit} คน
              </p>
            </div>
            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full" 
                style={{ width: `${(firmSettings.membersUsed / firmSettings.membersLimit) * 100}%` }}
              />
            </div>
          </div>
          <Button variant="outline">Upgrade to Pro</Button>
        </CardContent>
      </Card>
    </div>
  );
}
