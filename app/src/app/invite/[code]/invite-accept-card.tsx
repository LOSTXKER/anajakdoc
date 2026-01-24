"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Calculator, UserPlus, Loader2, Check, Mail } from "lucide-react";
import { acceptInvitation, type InvitationInfo } from "@/server/actions/invite";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface InviteAcceptCardProps {
  code: string;
  invitation: InvitationInfo;
  isLoggedIn: boolean;
  currentEmail?: string;
}

const roleLabels: Record<string, string> = {
  OWNER: "เจ้าของ",
  ADMIN: "ผู้ดูแล",
  ACCOUNTING: "บัญชี",
  STAFF: "พนักงาน",
  ACCOUNTANT: "นักบัญชี",
};

export function InviteAcceptCard({ 
  code, 
  invitation, 
  isLoggedIn,
  currentEmail,
}: InviteAcceptCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [accepted, setAccepted] = useState(false);

  const isOrgInvite = invitation.type === "organization";
  const emailMatches = currentEmail?.toLowerCase() === invitation.email.toLowerCase();

  const handleAccept = () => {
    startTransition(async () => {
      const result = await acceptInvitation(code);
      
      if (result.success) {
        setAccepted(true);
        toast.success("ยอมรับคำเชิญเรียบร้อยแล้ว!");
        
        // Redirect after a short delay
        setTimeout(() => {
          if (isOrgInvite) {
            router.push("/dashboard");
          } else {
            router.push("/firm/dashboard");
          }
        }, 1500);
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  // Show success state
  if (accepted) {
    return (
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold">เข้าร่วมสำเร็จ!</h2>
          <p className="text-muted-foreground">
            คุณเข้าร่วม <span className="font-medium text-foreground">{invitation.targetName}</span> เรียบร้อยแล้ว
          </p>
          <div className="pt-2">
            <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-2">กำลังพาไปหน้า Dashboard...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border-0 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="text-center space-y-4">
        <div className={cn(
          "inline-flex items-center justify-center w-16 h-16 rounded-2xl mx-auto",
          isOrgInvite 
            ? "bg-blue-100 dark:bg-blue-900/30" 
            : "bg-purple-100 dark:bg-purple-900/30"
        )}>
          {isOrgInvite ? (
            <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          ) : (
            <Calculator className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          )}
        </div>
        <div>
          <CardTitle className="text-xl">คำเชิญเข้าร่วม</CardTitle>
          <CardDescription className="mt-1">
            {isOrgInvite ? "องค์กร" : "สำนักงานบัญชี"}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Invitation Details */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {isOrgInvite ? "องค์กร" : "สำนักงาน"}
            </span>
            <span className="font-medium">{invitation.targetName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">ตำแหน่ง</span>
            <span className="font-medium">{roleLabels[invitation.role] || invitation.role}</span>
          </div>
          {invitation.invitedByName && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">เชิญโดย</span>
              <span className="font-medium">{invitation.invitedByName}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">ส่งถึง</span>
            <span className="font-medium text-sm">{invitation.email}</span>
          </div>
        </div>

        {/* Not logged in */}
        {!isLoggedIn && (
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800 dark:text-amber-200">
                    กรุณาเข้าสู่ระบบก่อน
                  </p>
                  <p className="text-amber-700 dark:text-amber-300 mt-1">
                    เข้าสู่ระบบด้วยอีเมล <span className="font-medium">{invitation.email}</span> เพื่อยอมรับคำเชิญ
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" asChild className="w-full">
                <Link href={`/login?redirect=/invite/${code}`}>
                  เข้าสู่ระบบ
                </Link>
              </Button>
              <Button asChild className="w-full">
                <Link href={`/register?redirect=/invite/${code}&email=${encodeURIComponent(invitation.email)}`}>
                  สมัครสมาชิก
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Logged in but wrong email */}
        {isLoggedIn && !emailMatches && (
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800 dark:text-amber-200">
                    อีเมลไม่ตรงกัน
                  </p>
                  <p className="text-amber-700 dark:text-amber-300 mt-1">
                    คุณกำลังล็อกอินด้วย <span className="font-medium">{currentEmail}</span>
                    <br />
                    แต่คำเชิญส่งถึง <span className="font-medium">{invitation.email}</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <form action="/api/auth/signout" method="POST" className="w-full">
                <Button variant="outline" type="submit" className="w-full">
                  เปลี่ยนบัญชี
                </Button>
              </form>
              <Button onClick={handleAccept} disabled={isPending} className="w-full">
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                ยอมรับต่อไป
              </Button>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              หมายเหตุ: หากอีเมลไม่ตรง ระบบจะไม่อนุญาตให้ยอมรับ
            </p>
          </div>
        )}

        {/* Logged in with correct email */}
        {isLoggedIn && emailMatches && (
          <Button 
            onClick={handleAccept} 
            disabled={isPending}
            className="w-full h-12 text-base"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                กำลังดำเนินการ...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                ยอมรับคำเชิญ
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
