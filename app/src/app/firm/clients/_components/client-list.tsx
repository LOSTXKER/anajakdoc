"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Briefcase,
  Plus,
  Search,
  AlertCircle,
  Clock,
  ArrowRight,
  Building2,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";

interface Assignee {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface Client {
  id: string;
  name: string;
  slug: string;
  taxId: string | null;
  email: string | null;
  phone: string | null;
  createdAt: Date;
  totalDocs: number;
  pendingDocs: number;
  assignees: Assignee[];
}

interface ClientListProps {
  clients: Client[];
  isManager: boolean;
}

export function ClientList({ clients, isManager }: ClientListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.taxId?.includes(searchQuery) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (pendingDocs: number) => {
    if (pendingDocs >= 10) return "text-red-600 dark:text-red-400";
    if (pendingDocs >= 5) return "text-amber-600 dark:text-amber-400";
    return "text-emerald-600 dark:text-emerald-400";
  };

  const getStatusBadge = (pendingDocs: number) => {
    if (pendingDocs >= 10) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          เร่งด่วน
        </Badge>
      );
    }
    if (pendingDocs >= 5) {
      return (
        <Badge variant="outline" className="gap-1 border-amber-500 text-amber-600">
          <Clock className="h-3 w-3" />
          รอดำเนินการ
        </Badge>
      );
    }
    return null;
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clients</h1>
          <p className="text-muted-foreground">
            {isManager ? "จัดการลูกค้าของสำนักงาน" : "ลูกค้าที่คุณรับผิดชอบ"}
          </p>
        </div>
        {isManager && (
          <Button asChild className="bg-violet-600 hover:bg-violet-700">
            <Link href="/firm/clients/new">
              <Plus className="mr-2 h-4 w-4" />
              เพิ่ม Client
            </Link>
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
                <Building2 className="h-6 w-6 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{clients.length}</p>
                <p className="text-sm text-muted-foreground">Clients ทั้งหมด</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {clients.reduce((sum, c) => sum + c.pendingDocs, 0)}
                </p>
                <p className="text-sm text-muted-foreground">เอกสารรอดำเนินการ</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <Briefcase className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {clients.reduce((sum, c) => sum + c.totalDocs, 0)}
                </p>
                <p className="text-sm text-muted-foreground">เอกสารทั้งหมด</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหา client..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Clients List */}
      {filteredClients.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={clients.length === 0 ? "ยังไม่มี Client" : "ไม่พบ Client ที่ค้นหา"}
          description={
            clients.length === 0
              ? isManager
                ? "เพิ่ม Client แรกของคุณเพื่อเริ่มต้นใช้งาน"
                : "ยังไม่มี Client ที่ถูกมอบหมายให้คุณ"
              : "ลองค้นหาด้วยคำอื่น"
          }
          action={
            clients.length === 0 && isManager ? (
              <Button asChild className="bg-violet-600 hover:bg-violet-700">
                <Link href="/firm/clients/new">
                  <Plus className="mr-2 h-4 w-4" />
                  เพิ่ม Client
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>รายการ Clients ({filteredClients.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between py-4 gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30 flex-shrink-0">
                      <Briefcase className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{client.name}</p>
                        {getStatusBadge(client.pendingDocs)}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{client.totalDocs} เอกสารทั้งหมด</span>
                        {client.assignees.length > 0 && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <div className="flex -space-x-1">
                                {client.assignees.slice(0, 3).map((assignee) => (
                                  <Avatar
                                    key={assignee.id}
                                    className="h-5 w-5 border-2 border-background"
                                  >
                                    <AvatarFallback className="text-[8px] bg-violet-100 text-violet-700">
                                      {getInitials(assignee.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                ))}
                              </div>
                              {client.assignees.length > 3 && (
                                <span className="text-xs">
                                  +{client.assignees.length - 3}
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <p
                        className={cn(
                          "font-medium",
                          getStatusColor(client.pendingDocs)
                        )}
                      >
                        {client.pendingDocs} เอกสารค้าง
                      </p>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/switch-org/${client.slug}`}>
                        เข้าทำงาน
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
