import { redirect } from "next/navigation";
import { getSession } from "@/server/auth";
import { getInvitationByCode } from "@/server/actions/invite";
import { InviteAcceptCard } from "./invite-accept-card";

interface InvitePageProps {
  params: Promise<{ code: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { code } = await params;
  const session = await getSession();
  
  // Get invitation info
  const result = await getInvitationByCode(code);
  
  if (!result.success) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mx-auto">
            <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">คำเชิญไม่ถูกต้อง</h1>
          <p className="text-muted-foreground">{result.error}</p>
          <a 
            href="/login" 
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            ไปหน้าเข้าสู่ระบบ
          </a>
        </div>
      </div>
    );
  }

  const invitation = result.data;
  
  // Safety check
  if (!invitation) {
    return redirect("/login");
  }

  // If invitation is expired
  if (invitation.isExpired) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 mx-auto">
            <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">คำเชิญหมดอายุ</h1>
          <p className="text-muted-foreground">
            คำเชิญเข้าร่วม <span className="font-medium">{invitation.targetName}</span> หมดอายุแล้ว
            <br />
            กรุณาติดต่อผู้ดูแลเพื่อขอลิงก์ใหม่
          </p>
          <a 
            href="/login" 
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            ไปหน้าเข้าสู่ระบบ
          </a>
        </div>
      </div>
    );
  }

  // If already accepted
  if (invitation.isAccepted) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">คำเชิญถูกยอมรับแล้ว</h1>
          <p className="text-muted-foreground">
            คำเชิญเข้าร่วม <span className="font-medium">{invitation.targetName}</span> ถูกยอมรับไปแล้ว
          </p>
          <a 
            href={session ? "/dashboard" : "/login"}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {session ? "ไปหน้า Dashboard" : "เข้าสู่ระบบ"}
          </a>
        </div>
      </div>
    );
  }

  // Show invite accept card
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <InviteAcceptCard 
        code={code}
        invitation={invitation}
        isLoggedIn={!!session}
        currentEmail={session?.email}
      />
    </div>
  );
}
