import { getSession } from "@/server/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Plus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default async function FirmTeamPage() {
  const session = await getSession();
  
  if (!session?.firmMembership) {
    redirect("/dashboard");
  }

  // TODO: Fetch team members from database
  const teamMembers = [
    { 
      id: "1", 
      name: "สมชาย ใจดี", 
      email: "somchai@example.com",
      role: "OWNER", 
      clients: "ทุก Clients (auto)" 
    },
    { 
      id: "2", 
      name: "สมหญิง รักดี", 
      email: "somying@example.com",
      role: "ADMIN", 
      clients: "ทุก Clients (auto)" 
    },
    { 
      id: "3", 
      name: "นักบัญชี A", 
      email: "accountant.a@example.com",
      role: "ACCOUNTANT", 
      clients: "บริษัท ก (PRIMARY), บริษัท ข (SUPPORT)" 
    },
    { 
      id: "4", 
      name: "นักบัญชี B", 
      email: "accountant.b@example.com",
      role: "ACCOUNTANT", 
      clients: "บริษัท ค (PRIMARY), บริษัท ง (PRIMARY)" 
    },
  ];

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "OWNER":
        return <Badge variant="default">เจ้าของ</Badge>;
      case "ADMIN":
        return <Badge variant="secondary">ผู้ดูแล</Badge>;
      case "ACCOUNTANT":
        return <Badge variant="outline">นักบัญชี</Badge>;
      default:
        return <Badge variant="outline">พนักงาน</Badge>;
    }
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
                        {getInitials(member.name)}
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
