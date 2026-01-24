import { Suspense } from "react";
import { getSession } from "@/server/auth";
import { redirect } from "next/navigation";
import { getFirmPendingInvitations } from "@/server/actions/firm-relation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Mail, Clock, Info } from "lucide-react";
import { InvitationActions } from "./_components/invitation-actions";

async function InvitationsList() {
  const invitations = await getFirmPendingInvitations();

  if (invitations.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/30">
        <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">ไม่มีคำเชิญรอดำเนินการ</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          เมื่อธุรกิจส่งคำเชิญมาให้คุณ จะแสดงที่นี่
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {invitations.map((invitation) => (
        <Card key={invitation.id} className="border-violet-200 dark:border-violet-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  {invitation.organizationLogo ? (
                    <img
                      src={invitation.organizationLogo}
                      alt={invitation.organizationName}
                      className="h-8 w-8 rounded"
                    />
                  ) : (
                    <Package className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">{invitation.organizationName}</h3>
                  <p className="text-sm text-muted-foreground">
                    เชิญโดย {invitation.invitedByName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right text-sm text-muted-foreground hidden sm:block">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(invitation.invitedAt).toLocaleDateString("th-TH", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </div>
                <InvitationActions invitation={invitation} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default async function FirmInvitationsPage() {
  const session = await getSession();
  
  if (!session?.firmMembership) {
    redirect("/firm/login");
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">คำเชิญจากธุรกิจ</h1>
        <p className="text-muted-foreground">
          รายการคำเชิญจากธุรกิจที่ต้องการให้คุณดูแล
        </p>
      </div>

      {/* Info Box */}
      <div className="mb-6 p-4 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-violet-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-violet-800 dark:text-violet-200 mb-1">
              รูปแบบการเชื่อมต่อใหม่
            </p>
            <p className="text-violet-700 dark:text-violet-300">
              ธุรกิจเป็นเจ้าของข้อมูลของตัวเอง และเชิญสำนักบัญชีมาดูแล 
              คุณจะเข้าถึงข้อมูลได้เมื่อตอบรับคำเชิญ
            </p>
          </div>
        </div>
      </div>

      <Suspense fallback={<div className="animate-pulse h-32 bg-muted rounded-lg" />}>
        <InvitationsList />
      </Suspense>
    </div>
  );
}
