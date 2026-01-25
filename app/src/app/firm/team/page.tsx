import { requireFirmManager } from "@/server/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Plus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getFirmRoleDisplayName, getFirmRoleBadgeColor } from "@/lib/firm-permissions";
import { prisma } from "@/lib/prisma";
import type { FirmRole } from ".prisma/client";

export default async function FirmTeamPage() {
  // Only firm managers and owners can access this page
  const session = await requireFirmManager();

  // Fetch team members from database
  const members = await prisma.firmMember.findMany({
    where: {
      firmId: session.firmMembership.firmId,
      isActive: true,
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      clientAssignments: {
        include: {
          organization: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: [
      { role: "asc" },
      { createdAt: "asc" },
    ],
  });

  const teamMembers = members.map((member) => {
    const assignments = member.clientAssignments.map((a) => 
      `${a.organization.name} (${a.role})`
    );
    
    const clientsText = ["OWNER", "MANAGER"].includes(member.role)
      ? "ทุก Clients (auto)"
      : assignments.length > 0
        ? assignments.join(", ")
        : "ยังไม่ได้ assign";

    return {
      id: member.id,
      name: member.user.name || member.user.email,
      email: member.user.email,
      role: member.role,
      clients: clientsText,
      avatarUrl: member.user.avatarUrl,
    };
  });

  const getRoleBadge = (role: string) => {
    const firmRole = role as FirmRole;
    return (
      <Badge variant="secondary" className={getFirmRoleBadgeColor(firmRole)}>
        {getFirmRoleDisplayName(firmRole)}
      </Badge>
    );
  };

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">จัดการทีม</h1>
          <p className="text-muted-foreground">
            จัดการสมาชิกและ assign clients
          </p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          เชิญสมาชิก
        </Button>
      </div>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            สมาชิก ({teamMembers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {teamMembers.map((member) => (
              <div key={member.id} className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(member.name || member.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{member.name}</p>
                        {getRoleBadge(member.role)}
                      </div>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Clients: {member.clients}
                      </p>
                    </div>
                  </div>
                  {member.role !== "OWNER" && member.role !== "ADMIN" && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Plus className="mr-1 h-3 w-3" />
                        Assign Client
                      </Button>
                      <Button variant="ghost" size="sm">
                        แก้ไข
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
