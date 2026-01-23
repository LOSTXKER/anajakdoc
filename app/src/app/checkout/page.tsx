"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  CreditCard,
  Building2,
  QrCode,
  ArrowLeft,
  Package,
  Loader2,
  PartyPopper,
} from "lucide-react";

const plans: Record<string, {
  name: string;
  price: number;
  description: string;
  features: string[];
}> = {
  STARTER: {
    name: "Starter",
    price: 299,
    description: "สำหรับธุรกิจขนาดเล็ก",
    features: [
      "เอกสารไม่จำกัด",
      "3 ผู้ใช้งาน",
      "Export Excel, PDF",
      "OCR อ่านเอกสารอัตโนมัติ",
    ],
  },
  BUSINESS: {
    name: "Business",
    price: 599,
    description: "สำหรับธุรกิจที่ต้องการมากขึ้น",
    features: [
      "เอกสารไม่จำกัด",
      "10 ผู้ใช้งาน",
      "Export ทุกรูปแบบ + PEAK",
      "OCR + AI จัดหมวดหมู่",
      "API Access",
    ],
  },
  FIRM_STARTER: {
    name: "Firm Starter",
    price: 990,
    description: "สำหรับสำนักบัญชีขนาดเล็ก",
    features: [
      "Dashboard รวมทุก Clients",
      "10 สมาชิกในทีม",
      "Client Assignment",
      "ติดตาม Deadline",
    ],
  },
  FIRM_PRO: {
    name: "Firm Pro",
    price: 2500,
    description: "สำหรับสำนักบัญชีมืออาชีพ",
    features: [
      "ทุกฟีเจอร์ใน Starter",
      "สมาชิกไม่จำกัด",
      "White-label Branding",
      "Custom Domain",
    ],
  },
};

function CheckoutLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan") || "STARTER";
  const plan = plans[planId] || plans.STARTER;

  const [paymentMethod, setPaymentMethod] = useState("card");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setIsComplete(true);
  };

  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto">
              <PartyPopper className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">ระบบชำระเงินจะเปิดให้บริการเร็วๆ นี้</h2>
            <p className="text-muted-foreground">
              ขอบคุณที่สนใจอัปเกรดแพ็คเกจ เราจะแจ้งให้ทราบเมื่อระบบพร้อมใช้งาน
            </p>
            <div className="pt-4">
              <Button asChild>
                <Link href="/dashboard">
                  กลับหน้าหลัก
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/settings/subscription">
              <ArrowLeft className="mr-2 h-4 w-4" />
              กลับ
            </Link>
          </Button>
          <div className="ml-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <span className="font-semibold">อัปเกรดแพ็คเกจ</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Plan Summary */}
          <div className="order-2 lg:order-1">
            <Card>
              <CardHeader>
                <CardTitle>สรุปคำสั่งซื้อ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                  <Badge>รายเดือน</Badge>
                </div>

                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>แพ็คเกจ {plan.name}</span>
                    <span>฿{plan.price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>VAT 7%</span>
                    <span>฿{Math.round(plan.price * 0.07).toLocaleString()}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold text-lg">
                  <span>รวมทั้งหมด</span>
                  <span>฿{Math.round(plan.price * 1.07).toLocaleString()}/เดือน</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Form */}
          <div className="order-1 lg:order-2">
            <form onSubmit={handleSubmit}>
              <Card>
                <CardHeader>
                  <CardTitle>ข้อมูลการชำระเงิน</CardTitle>
                  <CardDescription>
                    เลือกวิธีการชำระเงินที่ต้องการ
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Payment Method Selection */}
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                    className="grid grid-cols-1 gap-3"
                  >
                    <div>
                      <RadioGroupItem
                        value="card"
                        id="card"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="card"
                        className="flex items-center gap-3 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                      >
                        <CreditCard className="h-5 w-5" />
                        <div className="flex-1">
                          <p className="font-medium">บัตรเครดิต/เดบิต</p>
                          <p className="text-sm text-muted-foreground">
                            Visa, Mastercard, JCB
                          </p>
                        </div>
                      </Label>
                    </div>

                    <div>
                      <RadioGroupItem
                        value="promptpay"
                        id="promptpay"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="promptpay"
                        className="flex items-center gap-3 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                      >
                        <QrCode className="h-5 w-5" />
                        <div className="flex-1">
                          <p className="font-medium">PromptPay</p>
                          <p className="text-sm text-muted-foreground">
                            สแกน QR Code ชำระผ่าน Mobile Banking
                          </p>
                        </div>
                      </Label>
                    </div>

                    <div>
                      <RadioGroupItem
                        value="transfer"
                        id="transfer"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="transfer"
                        className="flex items-center gap-3 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                      >
                        <Building2 className="h-5 w-5" />
                        <div className="flex-1">
                          <p className="font-medium">โอนเงินผ่านธนาคาร</p>
                          <p className="text-sm text-muted-foreground">
                            โอนเงินและแนบสลิป
                          </p>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>

                  {/* Card Details (show only if card selected) */}
                  {paymentMethod === "card" && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="space-y-2">
                        <Label htmlFor="cardNumber">หมายเลขบัตร</Label>
                        <Input
                          id="cardNumber"
                          placeholder="1234 5678 9012 3456"
                          disabled
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="expiry">วันหมดอายุ</Label>
                          <Input id="expiry" placeholder="MM/YY" disabled />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvc">CVC</Label>
                          <Input id="cvc" placeholder="123" disabled />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cardName">ชื่อบนบัตร</Label>
                        <Input id="cardName" placeholder="SOMCHAI JAIDEE" disabled />
                      </div>
                    </div>
                  )}

                  {/* Billing Info */}
                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-medium">ข้อมูลใบเสร็จ</h4>
                    <div className="space-y-2">
                      <Label htmlFor="companyName">ชื่อบริษัท/ชื่อ-นามสกุล</Label>
                      <Input id="companyName" placeholder="บริษัท ABC จำกัด" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taxId">เลขประจำตัวผู้เสียภาษี (ถ้ามี)</Label>
                      <Input id="taxId" placeholder="0123456789012" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">ที่อยู่</Label>
                      <Input id="address" placeholder="123 ถ.สุขุมวิท กรุงเทพฯ 10110" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">อีเมลสำหรับใบเสร็จ</Label>
                      <Input id="email" type="email" placeholder="billing@company.com" />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        กำลังดำเนินการ...
                      </>
                    ) : (
                      <>
                        ชำระเงิน ฿{Math.round(plan.price * 1.07).toLocaleString()}
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    การชำระเงินมีความปลอดภัย ข้อมูลของคุณถูกเข้ารหัสทุกขั้นตอน
                  </p>
                </CardContent>
              </Card>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutLoading />}>
      <CheckoutContent />
    </Suspense>
  );
}
