"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2, Users, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { inviteMember, removeMember } from "@/server/actions/organization";
import type { MemberRole } from ".prisma/client";

interface Member {
  id: string;
  role: MemberRole;
  joinedAt: Date | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
}

interface MemberListProps {
  members: Member[];
  currentUserId: string;
  currentUserRole: MemberRole;
  organizationId: string;
}

const roleLabels: Record<MemberRole, string> = {
  OWNER: "เจ้าของ",
  ADMIN: "ผู้ดูแล",
  ACCOUNTING: "บัญชี",
  STAFF: "พนักงาน",
};

const roleColors: Record<MemberRole, string> = {
  OWNER: "bg-purple-100 text-purple-700",
  ADMIN: "bg-blue-100 text-blue-700",
  ACCOUNTING: "bg-green-100 text-green-700",
  STAFF: "bg-gray-100 text-gray-700",
};

export function MemberList({ members, currentUserId, currentUserRole, organizationId }: MemberListProps) {
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);

  const canManageMembers = ["OWNER", "ADMIN"].includes(currentUserRole);

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleInvite = async (formData: FormData) => {
    startTransition(async () => {
      const result = await inviteMember(organizationId, formData);
      if (result.success) {
        toast.success("เพิ่มสมาชิกเรียบร้อย");
        setDialogOpen(false);
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  const handleRemove = async (memberId: string, memberName: string | null) => {
    if (!confirm(`ต้องการลบ ${memberName || "สมาชิก"} ออกจากองค์กร?`)) return;

    startTransition(async () => {
      const result = await removeMember(organizationId, memberId);
      if (result.success) {
        toast.success("ลบสมาชิกเรียบร้อย");
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {canManageMembers && (
        <div className="flex justify-end">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                เพิ่มสมาชิก
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>เพิ่มสมาชิกใหม่</DialogTitle>
                <DialogDescription>
                  เชิญสมาชิกด้วยอีเมลที่ลงทะเบียนแล้วในระบบ
                </DialogDescription>
              </DialogHeader>
              <form action={handleInvite} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">อีเมล</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="email@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">บทบาท</Label>
                  <Select name="role" defaultValue="STAFF">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STAFF">พนักงาน</SelectItem>
                      <SelectItem value="ACCOUNTING">บัญชี</SelectItem>
                      <SelectItem value="ADMIN">ผู้ดูแล</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    ยกเลิก
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    เพิ่มสมาชิก
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            สมาชิกทั้งหมด
          </CardTitle>
          <CardDescription>{members.length} คน</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={member.user.avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(member.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {member.user.name || "ไม่ระบุชื่อ"}
                      {member.user.id === currentUserId && (
                        <span className="text-muted-foreground ml-2">(คุณ)</span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">{member.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={roleColors[member.role]}>
                    {roleLabels[member.role]}
                  </Badge>
                  {canManageMembers && 
                   member.role !== "OWNER" && 
                   member.user.id !== currentUserId && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleRemove(member.id, member.user.name)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
