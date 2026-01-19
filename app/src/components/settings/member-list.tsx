"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  ADMIN: "bg-sky-100 text-sky-700",
  ACCOUNTING: "bg-emerald-100 text-emerald-700",
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
    <div className="space-y-4 max-w-2xl">
      {canManageMembers && (
        <div className="flex justify-end">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1.5 h-4 w-4" />
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
                    className="bg-gray-50 focus:bg-white"
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

      <div className="rounded-xl border bg-white p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">สมาชิกทั้งหมด</h3>
            <p className="text-sm text-gray-500">{members.length} คน</p>
          </div>
        </div>

        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="group flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={member.user.avatarUrl || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {getInitials(member.user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">
                  {member.user.name || "ไม่ระบุชื่อ"}
                  {member.user.id === currentUserId && (
                    <span className="text-gray-400 ml-2">(คุณ)</span>
                  )}
                </p>
                <p className="text-sm text-gray-500 truncate">{member.user.email}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${roleColors[member.role]}`}>
                {roleLabels[member.role]}
              </span>
              {canManageMembers && 
               member.role !== "OWNER" && 
               member.user.id !== currentUserId && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemove(member.id, member.user.name)}
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
