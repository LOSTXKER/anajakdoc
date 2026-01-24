import { requireFirmMember } from "@/server/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, FileText, Clock, AlertTriangle, Users, Settings, Shield } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { isFirmOwner, isFirmManager, getFirmRoleDisplayName, getFirmRoleBadgeColor } from "@/lib/firm-permissions";
import type { FirmRole } from ".prisma/client";

export default async function FirmDashboardPage() {
  const session = await requireFirmMember();
  
  const firmRole = session.firmMembership.role as FirmRole;
  const isOwner = isFirmOwner(session);
  const isManager = isFirmManager(session);

  // TODO: Fetch real data from database
  // For OWNER/MANAGER: Show all clients
  // For ACCOUNTANT: Show only assigned clients
  const stats = isManager ? {
    totalClients: 12,
    pendingDocs: 45,
    nearDeadline: 8,
    teamMembers: 6,
  } : {
    totalClients: 3, // Only assigned clients
    pendingDocs: 15,
    nearDeadline: 3,
    teamMembers: undefined,
  };

  // TODO: Fetch clients from database based on assignments
  const clients = isManager ? [
    { id: "1", name: "บริษัท ก จำกัด", pendingDocs: 3, status: "normal", assignee: "นักบัญชี A" },
    { id: "2", name: "บริษัท ข จำกัด", pendingDocs: 7, status: "warning", assignee: "นักบัญชี A" },
    { id: "3", name: "บริษัท ค จำกัด", pendingDocs: 12, status: "alert", assignee: "นักบัญชี B" },
    { id: "4", name: "บริษัท ง จำกัด", pendingDocs: 5, status: "normal", assignee: "นักบัญชี B" },
  ] : [
    // Only assigned clients for accountant
    { id: "1", name: "บริษัท ก จำกัด", pendingDocs: 3, status: "normal", assignee: "ฉัน (PRIMARY)" },
    { id: "2", name: "บริษัท ข จำกัด", pendingDocs: 7, status: "warning", assignee: "ฉัน (SUPPORT)" },
  ];

  // TODO: Fetch deadlines from database
  const deadlines = [
    { id: "1", title: "เอกสาร VAT", clients: ["บริษัท ก", "บริษัท ข"], date: "25 ม.ค." },
    { id: "2", title: "เอกสาร WHT", clients: ["บริษัท ค"], date: "31 ม.ค." },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">
              {isManager ? "ภาพรวมสำนักบัญชี" : "งานของฉัน"}
            </h1>
            <Badge variant="secondary" className={getFirmRoleBadgeColor(firmRole)}>
              {getFirmRoleDisplayName(firmRole)}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {session.firmMembership.firmName}
          </p>
        </div>
        <div className="flex gap-2">
          {isManager && (
            <Button variant="outline" asChild>
              <Link href="/firm/team">
                <Users className="mr-2 h-4 w-4" />
                จัดการทีม
              </Link>
            </Button>
          )}
          {isOwner && (
            <Button variant="outline" asChild>
              <Link href="/firm/settings">
                <Settings className="mr-2 h-4 w-4" />
                ตั้งค่า
              </Link>
            </Button>
          )}
          <Button asChild>
            <Link href="/firm/clients">
              <Briefcase className="mr-2 h-4 w-4" />
              {isManager ? "+ Client" : "ดู Clients"}
            </Link>
          </Button>
        </div>
      </div>

      {/* Role Info Alert for non-managers */}
      {!isManager && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            คุณกำลังดูข้อมูลเฉพาะ Clients ที่ถูก assign ให้คุณ 
            หากต้องการดูข้อมูลทั้งหมด กรุณาติดต่อผู้ดูแลระบบ
          </AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className={`grid gap-4 ${isManager ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isManager ? "Clients ทั้งหมด" : "Clients ของฉัน"}
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">เอกสารค้าง</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.pendingDocs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ใกล้ Deadline</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-error">{stats.nearDeadline}</div>
          </CardContent>
        </Card>
        {isManager && stats.teamMembers && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">สมาชิกในทีม</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.teamMembers}</div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Clients Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {isManager ? "Clients ทั้งหมด" : "Clients ที่ฉันดูแล"}
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Grid</Button>
            <Button variant="ghost" size="sm">List</Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          {clients.map((client) => (
            <Card key={client.id} className={client.status === "alert" ? "border-error" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{client.name}</CardTitle>
                  {client.status === "alert" && (
                    <AlertTriangle className="h-4 w-4 text-error" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {client.pendingDocs} เอกสารรอดำเนินการ
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  {isManager ? `ดูแลโดย: ${client.assignee}` : client.assignee}
                </p>
                <Button asChild size="sm" className="w-full">
                  <Link href={`/switch-org/${client.id}`}>
                    เข้าทำงาน
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Deadlines */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">เอกสารใกล้ Deadline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {deadlines.map((deadline) => (
              <div key={deadline.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium">{deadline.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {deadline.clients.join(", ")}
                  </p>
                </div>
                <span className="text-sm text-warning font-medium">
                  ส่งภายใน {deadline.date}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
