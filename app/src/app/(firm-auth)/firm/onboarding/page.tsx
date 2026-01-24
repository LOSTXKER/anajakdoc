"use client";

import { useState, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { createAccountingFirm } from "@/server/actions/firm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Loader2, ArrowRight, ArrowLeft, CheckCircle2, MapPin, Phone, Mail, Users } from "lucide-react";
import { cn } from "@/lib/utils";

function SubmitButton({ step }: { step: number }) {
  const { pending } = useFormStatus();
  
  if (step < 3) {
    return (
      <Button type="button" className="bg-violet-600 hover:bg-violet-700">
        ถัดไป
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    );
  }
  
  return (
    <Button 
      type="submit" 
      className="bg-violet-600 hover:bg-violet-700" 
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          กำลังสร้าง...
        </>
      ) : (
        <>
          สร้างสำนักงาน
          <CheckCircle2 className="ml-2 h-4 w-4" />
        </>
      )}
    </Button>
  );
}

const steps = [
  { number: 1, title: "ข้อมูลสำนักงาน", icon: Building2 },
  { number: 2, title: "ที่อยู่และติดต่อ", icon: MapPin },
  { number: 3, title: "เชิญทีมงาน", icon: Users },
  { number: 4, title: "เสร็จสิ้น", icon: CheckCircle2 },
];

export default function FirmOnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    taxId: "",
    address: "",
    phone: "",
    email: "",
    teamEmails: [] as string[],
  });
  const [teamEmailInput, setTeamEmailInput] = useState("");
  const [state, formAction] = useActionState(createAccountingFirm, { error: null, success: false });

  useEffect(() => {
    if (state.success) {
      setCurrentStep(4);
    }
  }, [state.success]);

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const addTeamEmail = () => {
    if (teamEmailInput && !formData.teamEmails.includes(teamEmailInput)) {
      setFormData({
        ...formData,
        teamEmails: [...formData.teamEmails, teamEmailInput],
      });
      setTeamEmailInput("");
    }
  };

  const removeTeamEmail = (email: string) => {
    setFormData({
      ...formData,
      teamEmails: formData.teamEmails.filter((e) => e !== email),
    });
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    if (currentStep < 3) {
      e.preventDefault();
      handleNext();
      return;
    }
    // Let the form submit naturally to formAction
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-background dark:from-violet-950/20 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-900/30">
            <Building2 className="w-8 h-8 text-violet-600" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">สร้างสำนักงานบัญชี</h1>
            <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
              Firm Portal
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            กรอกข้อมูลเพื่อเริ่มจัดการลูกค้าของคุณ
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                  currentStep >= step.number
                    ? "bg-violet-600 border-violet-600 text-white"
                    : "border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {currentStep > step.number ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <step.icon className="h-5 w-5" />
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "w-12 h-0.5 mx-1",
                    currentStep > step.number
                      ? "bg-violet-600"
                      : "bg-muted-foreground/30"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <Card className="border-violet-200 dark:border-violet-800 shadow-xl shadow-violet-500/5">
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].title}</CardTitle>
            <CardDescription>
              {currentStep === 1 && "ข้อมูลพื้นฐานของสำนักงานบัญชี"}
              {currentStep === 2 && "ที่อยู่และช่องทางติดต่อ"}
              {currentStep === 3 && "เชิญทีมงานเข้าร่วม (สามารถข้ามได้)"}
              {currentStep === 4 && "สำนักงานของคุณพร้อมใช้งานแล้ว!"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentStep === 4 ? (
              // Success State
              <div className="text-center py-8 space-y-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">สร้างสำนักงานสำเร็จ!</h3>
                  <p className="text-muted-foreground">
                    "{formData.name}" พร้อมใช้งานแล้ว
                  </p>
                </div>
                <div className="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-4 text-sm text-left">
                  <p className="font-medium text-violet-700 dark:text-violet-300 mb-2">
                    ขั้นตอนถัดไป:
                  </p>
                  <ul className="list-disc list-inside text-violet-600 dark:text-violet-400 space-y-1">
                    <li>รอลูกค้าส่งคำเชิญมาให้คุณ</li>
                    <li>แนะนำลูกค้าให้สมัครใช้งานที่ anajakdoc.com</li>
                    <li>ตอบรับคำเชิญเพื่อเริ่มทำงาน</li>
                  </ul>
                </div>
                <Button 
                  className="bg-violet-600 hover:bg-violet-700"
                  onClick={() => router.push("/firm/dashboard")}
                >
                  เข้าสู่ Firm Portal
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : (
              <form action={formAction} onSubmit={handleFormSubmit} className="space-y-6">
                {state.error && (
                  <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    {state.error}
                  </div>
                )}

                {/* Step 1: Basic Info */}
                {currentStep === 1 && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="name">ชื่อสำนักงาน *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="สำนักงานบัญชี ABC"
                        className="h-12"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taxId">เลขประจำตัวผู้เสียภาษี</Label>
                      <Input
                        id="taxId"
                        name="taxId"
                        value={formData.taxId}
                        onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                        placeholder="0123456789012"
                        maxLength={13}
                        className="h-12"
                      />
                      <p className="text-xs text-muted-foreground">
                        เลข 13 หลัก (ไม่บังคับ)
                      </p>
                    </div>
                  </>
                )}

                {/* Step 2: Contact Info */}
                {currentStep === 2 && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="address">ที่อยู่</Label>
                      <Textarea
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="123/45 ถ.ตัวอย่าง แขวงตัวอย่าง เขตตัวอย่าง กรุงเทพฯ 10110"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="02-xxx-xxxx"
                            className="pl-10 h-12"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">อีเมลติดต่อ</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="contact@firm.com"
                            className="pl-10 h-12"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Step 3: Team Invite */}
                {currentStep === 3 && (
                  <>
                    <div className="space-y-2">
                      <Label>เชิญทีมงาน (ไม่บังคับ)</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="email"
                            value={teamEmailInput}
                            onChange={(e) => setTeamEmailInput(e.target.value)}
                            placeholder="email@example.com"
                            className="pl-10 h-12"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addTeamEmail();
                              }
                            }}
                          />
                        </div>
                        <Button type="button" variant="outline" onClick={addTeamEmail}>
                          เพิ่ม
                        </Button>
                      </div>
                    </div>

                    {formData.teamEmails.length > 0 && (
                      <div className="space-y-2">
                        <Label>รายชื่อที่จะเชิญ:</Label>
                        <div className="space-y-2">
                          {formData.teamEmails.map((email) => (
                            <div
                              key={email}
                              className="flex items-center justify-between p-3 rounded-lg border"
                            >
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{email}</span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTeamEmail(email)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                ลบ
                              </Button>
                            </div>
                          ))}
                        </div>
                        {/* Hidden inputs for form submission */}
                        {formData.teamEmails.map((email, index) => (
                          <input
                            key={email}
                            type="hidden"
                            name={`teamEmails[${index}]`}
                            value={email}
                          />
                        ))}
                      </div>
                    )}

                    <div className="bg-muted/50 rounded-lg p-4 text-sm">
                      <p className="text-muted-foreground">
                        คุณสามารถข้ามขั้นตอนนี้และเชิญทีมงานภายหลังได้
                      </p>
                    </div>
                  </>
                )}

                {/* Hidden fields for all steps */}
                <input type="hidden" name="name" value={formData.name} />
                <input type="hidden" name="taxId" value={formData.taxId} />
                <input type="hidden" name="address" value={formData.address} />
                <input type="hidden" name="phone" value={formData.phone} />
                <input type="hidden" name="email" value={formData.email} />

                {/* Navigation */}
                <div className="flex justify-between pt-4">
                  {currentStep > 1 ? (
                    <Button type="button" variant="outline" onClick={handleBack}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      ย้อนกลับ
                    </Button>
                  ) : (
                    <div />
                  )}
                  
                  {currentStep === 3 ? (
                    <div className="flex gap-2">
                      <Button 
                        type="submit" 
                        variant="outline"
                        formAction={formAction}
                      >
                        ข้ามขั้นตอนนี้
                      </Button>
                      <SubmitButton step={currentStep} />
                    </div>
                  ) : (
                    <Button 
                      type="button" 
                      className="bg-violet-600 hover:bg-violet-700"
                      onClick={handleNext}
                    >
                      ถัดไป
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
