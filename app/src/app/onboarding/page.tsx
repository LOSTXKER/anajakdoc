"use client";

import { useState, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { createOrganization } from "@/server/actions/organization";
import { createAccountingFirm } from "@/server/actions/firm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Loader2, Building2, ArrowRight, Check, Calculator, ArrowLeft, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

type AccountType = "business" | "accounting" | null;

function SubmitButton({ type }: { type: AccountType }) {
  const { pending } = useFormStatus();
  const label = type === "accounting" ? "สร้างสำนักงานบัญชี" : "สร้างธุรกิจ";
  const loadingLabel = type === "accounting" ? "กำลังสร้างสำนักงาน..." : "กำลังสร้างธุรกิจ...";
  
  return (
    <Button type="submit" className="w-full h-12 text-base font-medium" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingLabel}
        </>
      ) : (
        <>
          {label}
          <ArrowRight className="ml-2 h-4 w-4" />
        </>
      )}
    </Button>
  );
}

const businessFeatures = [
  "อัปโหลดเอกสารได้ไม่จำกัด",
  "เชิญทีมงานมาใช้งานร่วมกัน",
  "Export ข้อมูลเข้าระบบบัญชี",
  "ค้นหาเอกสารย้อนหลังได้ง่าย",
];

const accountingFeatures = [
  "จัดการลูกค้าหลายบริษัทในที่เดียว",
  "Dashboard ภาพรวมทุก Client",
  "ติดตามสถานะ WHT/VAT แยกตาม Client",
  "เชิญทีมนักบัญชีมาช่วยงาน",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<AccountType>(null);
  
  // Organization form state
  const [orgState, orgFormAction] = useActionState(createOrganization, { error: null, success: false });
  
  // Firm form state
  const [firmState, firmFormAction] = useActionState(createAccountingFirm, { error: null, success: false });

  // Redirect on success
  useEffect(() => {
    if (orgState.success) {
      router.push("/dashboard");
    }
  }, [orgState.success, router]);

  useEffect(() => {
    if (firmState.success) {
      router.push("/firm/dashboard");
    }
  }, [firmState.success, router]);

  const features = accountType === "accounting" ? accountingFeatures : businessFeatures;
  const error = accountType === "accounting" ? firmState.error : orgState.error;

  // Step 1: Choose account type
  if (!accountType) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 animate-float mx-auto">
              <Package className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              ยินดีต้อนรับสู่{" "}
              <span className="text-primary">กล่องเอกสารดิจิทัล</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              เลือกประเภทบัญชีที่ตรงกับความต้องการของคุณ
            </p>
          </div>

          {/* Account Type Cards */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Business Option */}
            <button
              onClick={() => setAccountType("business")}
              className="group text-left"
            >
              <Card className="border-2 hover:border-primary/50 hover:shadow-lg transition-all duration-200 h-full">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Briefcase className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-lg">จัดการเอกสารธุรกิจ</CardTitle>
                  <CardDescription>
                    สำหรับเจ้าของกิจการที่ต้องการจัดการเอกสารบัญชีของบริษัทตัวเอง
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      อัปโหลดและจัดเก็บเอกสาร
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      เชิญพนักงานมาใช้งาน
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      ส่งเอกสารให้สำนักบัญชี
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </button>

            {/* Accounting Firm Option */}
            <button
              onClick={() => setAccountType("accounting")}
              className="group text-left"
            >
              <Card className="border-2 hover:border-primary/50 hover:shadow-lg transition-all duration-200 h-full">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Calculator className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle className="text-lg">เปิดสำนักงานบัญชี</CardTitle>
                  <CardDescription>
                    สำหรับสำนักงานบัญชีที่รับทำบัญชีให้หลายบริษัท
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      จัดการลูกค้าหลายบริษัท
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      Dashboard ภาพรวมทุก Client
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      เชิญทีมนักบัญชีมาช่วย
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </button>
          </div>

          {/* Footer note */}
          <p className="text-center text-sm text-muted-foreground">
            คุณสามารถสร้างทั้งธุรกิจและสำนักงานบัญชีภายหลังได้
          </p>
        </div>
      </div>
    );
  }

  // Step 2: Fill in details
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left side - Info */}
        <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
          <div className="space-y-4">
            <button
              onClick={() => setAccountType(null)}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              เปลี่ยนประเภทบัญชี
            </button>
            <div className={cn(
              "inline-flex items-center justify-center w-16 h-16 rounded-2xl animate-float",
              accountType === "accounting" 
                ? "bg-purple-100 dark:bg-purple-900/30" 
                : "bg-blue-100 dark:bg-blue-900/30"
            )}>
              {accountType === "accounting" ? (
                <Calculator className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              ) : (
                <Briefcase className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              {accountType === "accounting" ? (
                <>สร้าง<span className="text-primary">สำนักงานบัญชี</span></>
              ) : (
                <>สร้าง<span className="text-primary">ธุรกิจ</span>ของคุณ</>
              )}
            </h1>
            <p className="text-muted-foreground text-lg">
              {accountType === "accounting" 
                ? "กรอกข้อมูลสำนักงานบัญชีเพื่อเริ่มรับ Client" 
                : "กรอกข้อมูลบริษัทเพื่อเริ่มจัดการเอกสาร"}
            </p>
          </div>

          <div className="space-y-3">
            {features.map((feature, index) => (
              <div 
                key={feature}
                className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4"
                style={{ animationDelay: `${(index + 1) * 100}ms` }}
              >
                <div className={cn(
                  "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center",
                  accountType === "accounting" 
                    ? "bg-purple-100 dark:bg-purple-900/30" 
                    : "bg-blue-100 dark:bg-blue-900/30"
                )}>
                  <Check className={cn(
                    "w-3.5 h-3.5",
                    accountType === "accounting" 
                      ? "text-purple-600 dark:text-purple-400" 
                      : "text-blue-600 dark:text-blue-400"
                  )} />
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
              {accountType === "accounting" ? (
                <Calculator className="w-5 h-5" />
              ) : (
                <Building2 className="w-5 h-5" />
              )}
              {accountType === "accounting" ? "ข้อมูลสำนักงานบัญชี" : "ข้อมูลบริษัท"}
            </CardTitle>
            <CardDescription>
              {accountType === "accounting" 
                ? "กรอกข้อมูลสำนักงานของคุณ" 
                : "กรอกข้อมูลบริษัทของคุณ"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form 
              action={accountType === "accounting" ? firmFormAction : orgFormAction} 
              className="space-y-4"
            >
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm animate-in fade-in slide-in-from-top-2">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="name">
                  {accountType === "accounting" ? "ชื่อสำนักงานบัญชี *" : "ชื่อบริษัท/องค์กร *"}
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder={accountType === "accounting" 
                    ? "สำนักงานบัญชี ตัวอย่าง" 
                    : "บริษัท ตัวอย่าง จำกัด"}
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
                <Label htmlFor="email">อีเมล</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={accountType === "accounting" 
                    ? "contact@accounting.com" 
                    : "contact@company.com"}
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

              <SubmitButton type={accountType} />
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
