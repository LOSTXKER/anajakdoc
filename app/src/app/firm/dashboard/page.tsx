import { requireFirmMember } from "@/server/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, FileText, Clock, AlertTriangle, Users, Settings, Shield } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { isFirmOwner, isFirmManager, getFirmRoleDisplayName, getFirmRoleBadgeColor } from "@/lib/firm-permissions";
import { getFirmDashboard } from "@/server/actions/firm";
import { prisma } from "@/lib/prisma";
import type { FirmRole } from ".prisma/client";

export default async function FirmDashboardPage() {
  const session = await requireFirmMember();
  
  const firmRole = session.firmMembership.role as FirmRole;
  const isOwner = isFirmOwner(session);
  const isManager = isFirmManager(session);

  // Fetch real data from database
  const dashboardResult = await getFirmDashboard();
  
  if (!dashboardResult.success || !dashboardResult.data) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            {"error" in dashboardResult ? dashboardResult.error : "ไม่สามารถโหลดข้อมูลได้"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { clients: allClients } = dashboardResult.data;

  // For ACCOUNTANT: Filter only assigned clients
  let clients = allClients;
  if (!isManager) {
    // Get firm member record
    const firmMember = await prisma.firmMember.findFirst({
      where: {
        firmId: session.firmMembership.firmId,
        userId: session.id,
        isActive: true,
      },
    });

    if (firmMember) {
      // Get only assigned clients for accountant
      const assignments = await prisma.firmClientAssignment.findMany({
        where: {
          firmMemberId: firmMember.id,
        },
        select: {
          organizationId: true,
        },
      });
      const assignedClientIds = new Set(assignments.map(a => a.organizationId));
      clients = allClients.filter(c => assignedClientIds.has(c.id));
    }
  }

  // Fetch team members count separately if needed
  const teamMembersCount = isManager 
    ? await prisma.firmMember.count({
        where: {
          firmId: session.firmMembership.firmId,
          isActive: true,
        },
      })
    : undefined;

  const stats = {
    totalClients: clients.length,
    pendingDocs: clients.reduce((sum, c) => sum + c.pendingBoxes, 0),
    nearDeadline: clients.filter(c => c.whtOverdueCount > 0).length,
    teamMembers: teamMembersCount,
  };

  // Get upcoming deadlines (clients with WHT outstanding)
  const deadlines = clients
    .filter(c => c.whtOutstanding > 0)
    .slice(0, 5)
    .map(c => ({
      id: c.id,
      title: "เอกสาร WHT",
      clients: [c.name],
      whtCount: c.whtOutstanding,
    }));

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
          {clients.map((client) => {
            const hasAlert = client.whtOverdueCount > 0 || client.pendingBoxes > 10;
            
            return (
              <Card key={client.id} className={hasAlert ? "border-error" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{client.name}</CardTitle>
                    {hasAlert && (
                      <AlertTriangle className="h-4 w-4 text-error" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {client.pendingBoxes} เอกสารรอดำเนินการ
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Health Score: {client.healthScore}/100
                  </p>
                  <Button asChild size="sm" className="w-full">
                    <Link href={`/switch-org/${client.slug}`}>
                      เข้าทำงาน
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Deadlines */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">เอกสารใกล้ Deadline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {deadlines.length > 0 ? (
              deadlines.map((deadline) => (
                <div key={deadline.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{deadline.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {deadline.clients.join(", ")} - {deadline.whtCount} รายการ
                    </p>
                  </div>
                  <Badge variant="destructive">
                    รอดำเนินการ
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                ไม่มีเอกสารใกล้ Deadline
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
