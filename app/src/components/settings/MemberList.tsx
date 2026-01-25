"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Plus, Loader2, Users, Trash2, Pencil, Building2 } from "lucide-react";
import { toast } from "sonner";
import { inviteMember, removeMember, updateMemberBankInfo } from "@/server/actions/organization";
import { cn } from "@/lib/utils";
import type { MemberRole } from ".prisma/client";

interface Member {
  id: string;
  role: MemberRole;
  joinedAt: Date | null;
  visibleName: string | null;
  bankName: string | null;
  bankAccount: string | null;
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
  OWNER: "bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  ADMIN: "bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800",
  ACCOUNTING: "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  STAFF: "bg-muted text-muted-foreground",
};

export function MemberList({ members, currentUserId, currentUserRole, organizationId }: MemberListProps) {
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

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

  const handleEditBank = (member: Member) => {
    setEditingMember(member);
    setEditDialogOpen(true);
  };

  const handleUpdateBank = async (formData: FormData) => {
    if (!editingMember) return;
    
    startTransition(async () => {
      const result = await updateMemberBankInfo(editingMember.id, formData);
      if (result.success) {
        toast.success("บันทึกข้อมูลธนาคารเรียบร้อย");
        setEditDialogOpen(false);
        setEditingMember(null);
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">สมาชิกทั้งหมด</h3>
            <p className="text-sm text-muted-foreground">{members.length} คน</p>
          </div>
        </div>
        
        {canManageMembers && (
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
                    className="bg-card focus:bg-card"
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
        )}
      </div>

      {/* Edit Bank Info Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แก้ไขข้อมูลธนาคาร</DialogTitle>
            <DialogDescription>
              ข้อมูลนี้ใช้สำหรับการคืนเงินพนักงานที่สำรองจ่าย
            </DialogDescription>
          </DialogHeader>
          {editingMember && (
            <form action={handleUpdateBank} className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={editingMember.user.avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(editingMember.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{editingMember.user.name || "ไม่ระบุชื่อ"}</p>
                  <p className="text-sm text-muted-foreground">{editingMember.user.email}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="visibleName">ชื่อที่แสดง (ถ้าต่างจากชื่อบัญชี)</Label>
                <Input
                  id="visibleName"
                  name="visibleName"
                  placeholder="ชื่อเล่น หรือชื่อที่ต้องการแสดง"
                  defaultValue={editingMember.visibleName || ""}
                  className="bg-card focus:bg-card"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankName">ธนาคาร</Label>
                <Select name="bankName" defaultValue={editingMember.bankName || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกธนาคาร" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="กรุงเทพ">ธนาคารกรุงเทพ</SelectItem>
                    <SelectItem value="กสิกรไทย">ธนาคารกสิกรไทย</SelectItem>
                    <SelectItem value="กรุงไทย">ธนาคารกรุงไทย</SelectItem>
                    <SelectItem value="ไทยพาณิชย์">ธนาคารไทยพาณิชย์</SelectItem>
                    <SelectItem value="กรุงศรี">ธนาคารกรุงศรีอยุธยา</SelectItem>
                    <SelectItem value="ทหารไทยธนชาต">ธนาคารทหารไทยธนชาต</SelectItem>
                    <SelectItem value="ออมสิน">ธนาคารออมสิน</SelectItem>
                    <SelectItem value="ธกส">ธนาคาร ธ.ก.ส.</SelectItem>
                    <SelectItem value="อื่นๆ">อื่นๆ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankAccount">เลขบัญชี</Label>
                <Input
                  id="bankAccount"
                  name="bankAccount"
                  placeholder="xxx-x-xxxxx-x"
                  defaultValue={editingMember.bankAccount || ""}
                  className="bg-card focus:bg-card"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  บันทึก
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Member Table */}
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>สมาชิก</TableHead>
              <TableHead>อีเมล</TableHead>
              <TableHead>บทบาท</TableHead>
              <TableHead>ธนาคาร</TableHead>
              <TableHead>เข้าร่วมเมื่อ</TableHead>
              {canManageMembers && <TableHead className="w-[80px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id} className="group">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={member.user.avatarUrl || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {getInitials(member.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">
                      {member.user.name || "ไม่ระบุชื่อ"}
                      {member.user.id === currentUserId && (
                        <span className="text-muted-foreground ml-1.5 text-sm font-normal">(คุณ)</span>
                      )}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {member.user.email}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("text-xs", roleColors[member.role])}>
                    {roleLabels[member.role]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {member.bankName ? (
                    <div className="flex items-center gap-1.5 text-sm">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{member.bankName}</span>
                      {member.bankAccount && (
                        <span className="text-muted-foreground">({member.bankAccount})</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(member.joinedAt)}
                </TableCell>
                {canManageMembers && (
                  <TableCell>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditBank(member)}
                        disabled={isPending}
                        title="แก้ไขข้อมูลธนาคาร"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {member.role !== "OWNER" && member.user.id !== currentUserId && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          onClick={() => handleRemove(member.id, member.user.name)}
                          disabled={isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
