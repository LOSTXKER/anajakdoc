"use client";

import { useState, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { register } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { UserTypeToggle, type UserType } from "@/components/ui/user-type-toggle";
import { Package, Loader2, Mail, Lock, User, Building2 } from "lucide-react";

function SubmitButton({ isFirm }: { isFirm: boolean }) {
  const { pending } = useFormStatus();
  
  return (
    <Button 
      type="submit" 
      className={`w-full h-12 text-base font-medium ${isFirm ? "bg-violet-600 hover:bg-violet-700" : ""}`}
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          กำลังสร้างบัญชี...
        </>
      ) : (
        "สมัครสมาชิก"
      )}
    </Button>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [userType, setUserType] = useState<UserType>("sme");
  const [state, formAction] = useActionState(register, { error: null, success: false });
  const isFirm = userType === "firm";

  useEffect(() => {
    if (state.success) {
      // Redirect based on user type
      if (isFirm) {
        router.push("/firm/onboarding");
      } else {
        router.push("/onboarding");
      }
    }
  }, [state.success, isFirm, router]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Logo & Brand */}
      <div className="text-center space-y-3">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl animate-float ${
          isFirm ? "bg-violet-600/10" : "bg-primary/10"
        }`}>
          {isFirm ? (
            <Building2 className="w-8 h-8 text-violet-600" />
          ) : (
            <Package className="w-8 h-8 text-primary" />
          )}
        </div>
        <h1 className="text-2xl font-bold tracking-tight">กล่องเอกสารดิจิทัล</h1>
        <p className="text-muted-foreground text-sm">
          {isFirm ? "สร้างบัญชีสำนักบัญชี" : "เริ่มต้นจัดการเอกสารบัญชีอย่างมืออาชีพ"}
        </p>
      </div>

      {/* User Type Toggle */}
      <div className="flex justify-center">
        <UserTypeToggle value={userType} onChange={setUserType} size="sm" />
      </div>

      {/* Register Card */}
      <Card className={`border-0 shadow-xl ${isFirm ? "shadow-violet-500/5" : "shadow-primary/5"}`}>
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-xl">สมัครสมาชิก</CardTitle>
          <CardDescription>
            {isFirm 
              ? "สร้างบัญชีสำนักบัญชีเพื่อเริ่มรับงาน"
              : "สร้างบัญชีใหม่เพื่อเริ่มใช้งาน"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            {/* Hidden field for user type */}
            <input type="hidden" name="userType" value={userType} />
            
            {state.error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm animate-in fade-in slide-in-from-top-2">
                {state.error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name">
                {isFirm ? "ชื่อผู้ติดต่อ" : "ชื่อ-นามสกุล"}
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder={isFirm ? "ชื่อผู้ติดต่อหลัก" : "สมชาย ใจดี"}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">อีเมล</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@company.com"
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">รหัสผ่าน</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  className="pl-10 h-12"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">ยืนยันรหัสผ่าน</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                  className="pl-10 h-12"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <SubmitButton isFirm={isFirm} />
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-0">
          <p className="text-xs text-center text-muted-foreground">
            การสมัครสมาชิกถือว่าคุณยอมรับ{" "}
            <Link href="/terms" className={`hover:underline ${isFirm ? "text-violet-600" : "text-primary"}`}>
              เงื่อนไขการใช้งาน
            </Link>{" "}
            และ{" "}
            <Link href="/privacy" className={`hover:underline ${isFirm ? "text-violet-600" : "text-primary"}`}>
              นโยบายความเป็นส่วนตัว
            </Link>
          </p>
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">หรือ</span>
            </div>
          </div>
          <p className="text-sm text-center text-muted-foreground">
            มีบัญชีอยู่แล้ว?{" "}
            <Link 
              href="/login" 
              className={`font-medium hover:underline ${isFirm ? "text-violet-600" : "text-primary"}`}
            >
              เข้าสู่ระบบ
            </Link>
          </p>
        </CardFooter>
      </Card>

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground">
        © 2026 Accounting Document Hub. All rights reserved.
      </p>
    </div>
  );
}
