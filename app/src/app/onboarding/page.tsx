"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { createOrganization } from "@/server/actions/organization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Loader2, Building2, ArrowRight, Check } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <Button type="submit" className="w-full h-12 text-base font-medium" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          กำลังสร้างองค์กร...
        </>
      ) : (
        <>
          สร้างองค์กร
          <ArrowRight className="ml-2 h-4 w-4" />
        </>
      )}
    </Button>
  );
}

const features = [
  "อัปโหลดเอกสารได้ไม่จำกัด",
  "เชิญทีมงานมาใช้งานร่วมกัน",
  "Export ข้อมูลเข้าระบบบัญชี",
  "ค้นหาเอกสารย้อนหลังได้ง่าย",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [state, formAction] = useActionState(createOrganization, { error: null, success: false });

  useEffect(() => {
    if (state.success) {
      router.push("/dashboard");
    }
  }, [state.success, router]);

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left side - Info */}
        <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 animate-float">
              <Package className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              ยินดีต้อนรับสู่<br />
              <span className="text-primary">กล่องเอกสารดิจิทัล</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              เริ่มต้นด้วยการสร้างองค์กรของคุณ เพื่อเริ่มจัดการเอกสารบัญชีอย่างมืออาชีพ
            </p>
          </div>

          <div className="space-y-3">
            {features.map((feature, index) => (
              <div 
                key={feature}
                className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4"
                style={{ animationDelay: `${(index + 1) * 100}ms` }}
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right side - Form */}
        <Card className="border-0 shadow-xl shadow-primary/5 animate-in fade-in slide-in-from-right-4 duration-500">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              สร้างองค์กรใหม่
            </CardTitle>
            <CardDescription>
              กรอกข้อมูลองค์กรของคุณเพื่อเริ่มต้นใช้งาน
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              {state.error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm animate-in fade-in slide-in-from-top-2">
                  {state.error}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="name">ชื่อบริษัท/องค์กร *</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="บริษัท ตัวอย่าง จำกัด"
                  className="h-12"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxId">เลขประจำตัวผู้เสียภาษี</Label>
                <Input
                  id="taxId"
                  name="taxId"
                  type="text"
                  placeholder="0123456789012"
                  className="h-12"
                  maxLength={13}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="02-xxx-xxxx"
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">อีเมลองค์กร</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="contact@company.com"
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">ที่อยู่</Label>
                <Textarea
                  id="address"
                  name="address"
                  placeholder="123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110"
                  rows={3}
                />
              </div>

              <SubmitButton />
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
