import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  FileText,
  Users,
  CheckCircle2,
  ArrowRight,
  Zap,
  Shield,
  Upload,
  Search,
  Download,
  Building2,
  Briefcase,
  Star,
} from "lucide-react";

const features = [
  {
    icon: Package,
    title: "กล่องเอกสารดิจิทัล",
    description: "จัดเก็บเอกสารในรูปแบบ 'กล่อง' ที่เข้าใจง่าย ใส่ได้หลายไฟล์ในกล่องเดียว",
  },
  {
    icon: Upload,
    title: "อัปโหลดง่าย",
    description: "ถ่ายรูปหรือเลือกไฟล์ได้ทันที รองรับ PDF, รูปภาพ และหลายไฟล์พร้อมกัน",
  },
  {
    icon: Search,
    title: "ค้นหาเร็ว",
    description: "หาเอกสารย้อนหลังได้ภายใน 30 วินาที ด้วยระบบค้นหาอัจฉริยะ",
  },
  {
    icon: Shield,
    title: "ปลอดภัย",
    description: "ข้อมูลเข้ารหัสทุกขั้นตอน แยกข้อมูลตามองค์กรอย่างชัดเจน",
  },
  {
    icon: Users,
    title: "ทำงานเป็นทีม",
    description: "เชิญทีมงานมาใช้งานร่วมกัน กำหนดสิทธิ์ได้ตามบทบาท",
  },
  {
    icon: Download,
    title: "Export ง่าย",
    description: "ส่งออกข้อมูลเข้าระบบบัญชี PEAK, Excel หรือ ZIP ได้ทันที",
  },
];

const steps = [
  {
    number: "1",
    title: "สร้างกล่อง",
    description: "เลือกประเภทเอกสาร หมวดหมู่ และศูนย์ต้นทุน",
  },
  {
    number: "2",
    title: "ใส่เอกสาร",
    description: "อัปโหลดไฟล์ใบเสร็จ ใบกำกับภาษี หรือสลิปโอนเงิน",
  },
  {
    number: "3",
    title: "ส่งให้บัญชี",
    description: "บัญชีตรวจสอบและอนุมัติ พร้อม Export เข้าระบบ",
  },
];

const testimonials = [
  {
    quote: "ลดเวลาจัดการเอกสารไปได้ 70% ทีมบัญชีชอบมาก",
    author: "คุณสมชาย",
    role: "CEO, บริษัท ABC จำกัด",
  },
  {
    quote: "ไม่ต้องถามซ้ำว่าใบไหนหัก VAT ได้ ระบบบอกให้เลย",
    author: "คุณสมหญิง",
    role: "ฝ่ายบัญชี, บริษัท XYZ จำกัด",
  },
];

const smePlans = [
  {
    name: "Free",
    price: "0",
    description: "เริ่มต้นใช้งานฟรี",
    features: [
      "20 เอกสาร/เดือน",
      "1 ผู้ใช้งาน",
      "Export Excel",
      "ค้นหาเอกสาร",
      "พื้นที่เก็บข้อมูล 1GB",
    ],
    cta: "เริ่มต้นฟรี",
    popular: false,
  },
  {
    name: "Starter",
    price: "299",
    description: "สำหรับธุรกิจขนาดเล็ก",
    features: [
      "เอกสารไม่จำกัด",
      "3 ผู้ใช้งาน",
      "Export Excel, PDF",
      "ค้นหาเอกสาร",
      "พื้นที่เก็บข้อมูล 10GB",
      "OCR อ่านเอกสารอัตโนมัติ",
    ],
    cta: "เลือกแพ็คเกจนี้",
    popular: true,
  },
  {
    name: "Business",
    price: "599",
    description: "สำหรับธุรกิจที่ต้องการมากขึ้น",
    features: [
      "เอกสารไม่จำกัด",
      "10 ผู้ใช้งาน",
      "Export ทุกรูปแบบ + PEAK",
      "รายงานและ Analytics",
      "พื้นที่เก็บข้อมูล 50GB",
      "OCR + AI จัดหมวดหมู่",
      "API Access",
    ],
    cta: "เลือกแพ็คเกจนี้",
    popular: false,
  },
];

const firmPlans = [
  {
    name: "Firm Starter",
    price: "990",
    description: "สำหรับสำนักบัญชีขนาดเล็ก",
    features: [
      "Dashboard รวมทุก Clients",
      "10 สมาชิกในทีม",
      "Client Assignment",
      "ติดตาม Deadline",
      "Reports สรุปงาน",
      "Email แจ้งเตือน",
    ],
    cta: "เริ่มต้นใช้งาน",
    popular: false,
  },
  {
    name: "Firm Pro",
    price: "2,500",
    description: "สำหรับสำนักบัญชีมืออาชีพ",
    features: [
      "ทุกฟีเจอร์ใน Starter",
      "สมาชิกไม่จำกัด",
      "White-label Branding",
      "Custom Domain",
      "Priority Support",
      "API Integration",
      "Audit Log",
    ],
    cta: "เลือกแพ็คเกจนี้",
    popular: true,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Package className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold">กล่องเอกสาร</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">เข้าสู่ระบบ</Link>
            </Button>
            <Button asChild>
              <Link href="/register">
                เริ่มต้นใช้งานฟรี
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-bg">
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Zap className="h-4 w-4" />
              ใช้งานฟรี ไม่มีค่าใช้จ่าย
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
              จัดการเอกสารบัญชี
              <br />
              <span className="text-primary">ง่ายเหมือนใส่กล่อง</span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              ระบบจัดการเอกสารบัญชีที่ทำให้ "คนส่งเอกสาร" ส่งได้ถูกตั้งแต่ต้น
              <br />
              และทำให้ "บัญชี" บันทึกได้เร็วขึ้น ผิดพลาดน้อยลง
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="h-12 px-8 text-base" asChild>
                <Link href="/register">
                  เริ่มต้นใช้งานฟรี
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
                <Link href="#features">ดูฟีเจอร์ทั้งหมด</Link>
              </Button>
            </div>
          </div>

          {/* Hero Image/Illustration */}
          <div className="mt-16 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10" />
              <Card className="w-full max-w-4xl shadow-2xl">
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">EXP2601-0001</h3>
                      <p className="text-sm text-muted-foreground">ค่าใช้จ่ายสำนักงาน</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-2xl font-bold">฿12,500.00</p>
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        รอตรวจ
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="aspect-[4/3] rounded-lg bg-muted flex items-center justify-center">
                        <FileText className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y bg-muted/30 py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">ใช้งานง่าย 3 ขั้นตอน</h2>
            <p className="text-muted-foreground">
              สร้างกล่อง → ใส่เอกสาร → ส่งให้บัญชี
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <div key={step.number} className="relative text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                  {step.number}
                </div>
                {index < steps.length - 1 && (
                  <div className="absolute top-8 left-[60%] hidden w-[80%] border-t-2 border-dashed border-primary/30 md:block" />
                )}
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">ฟีเจอร์ที่ช่วยให้ทำงานง่ายขึ้น</h2>
            <p className="text-muted-foreground">
              ออกแบบมาเพื่อแก้ปัญหาที่ SME ไทยเจอจริงๆ
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature) => (
              <Card key={feature.title} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-y bg-muted/30 py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">ลูกค้าพูดถึงเรา</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.author} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <p className="text-lg mb-4">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{testimonial.author}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">แผนราคาที่เหมาะกับคุณ</h2>
            <p className="text-muted-foreground">
              เริ่มต้นฟรี อัปเกรดเมื่อพร้อม ไม่มีข้อผูกมัด
            </p>
          </div>

          <Tabs defaultValue="sme" className="max-w-5xl mx-auto">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-12">
              <TabsTrigger value="sme" className="gap-2">
                <Building2 className="h-4 w-4" />
                สำหรับธุรกิจ
              </TabsTrigger>
              <TabsTrigger value="firm" className="gap-2">
                <Briefcase className="h-4 w-4" />
                สำหรับสำนักบัญชี
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sme">
              <div className="grid md:grid-cols-3 gap-6">
                {smePlans.map((plan) => (
                  <Card
                    key={plan.name}
                    className={`relative ${
                      plan.popular
                        ? "border-2 border-primary shadow-xl scale-105"
                        : "border shadow-lg"
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="gap-1">
                          <Star className="h-3 w-3" />
                          แนะนำ
                        </Badge>
                      </div>
                    )}
                    <CardContent className="p-6 pt-8">
                      <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {plan.description}
                      </p>
                      <p className="text-4xl font-bold mb-6">
                        ฿{plan.price}
                        <span className="text-base font-normal text-muted-foreground">
                          /เดือน
                        </span>
                      </p>
                      <ul className="space-y-3 mb-6">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="w-full"
                        variant={plan.popular ? "default" : "outline"}
                        asChild
                      >
                        <Link href="/register">
                          {plan.cta}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <p className="text-center text-sm text-muted-foreground mt-8">
                * SME เป็นเจ้าของ account เสมอ ไม่ถูก lock กับสำนักบัญชี
              </p>
            </TabsContent>

            <TabsContent value="firm">
              <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {firmPlans.map((plan) => (
                  <Card
                    key={plan.name}
                    className={`relative ${
                      plan.popular
                        ? "border-2 border-primary shadow-xl"
                        : "border shadow-lg"
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="gap-1">
                          <Star className="h-3 w-3" />
                          แนะนำ
                        </Badge>
                      </div>
                    )}
                    <CardContent className="p-6 pt-8">
                      <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {plan.description}
                      </p>
                      <p className="text-4xl font-bold mb-6">
                        ฿{plan.price}
                        <span className="text-base font-normal text-muted-foreground">
                          /เดือน
                        </span>
                      </p>
                      <ul className="space-y-3 mb-6">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="w-full"
                        variant={plan.popular ? "default" : "outline"}
                        asChild
                      >
                        <Link href="/register">
                          {plan.cta}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <p className="text-center text-sm text-muted-foreground mt-8">
                * Firm Plans เป็น Add-on แยกจาก SME Plans - Clients ยังต้องมี SME Plan ของตัวเอง
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-primary text-primary-foreground py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">พร้อมเริ่มต้นแล้วหรือยัง?</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            สมัครใช้งานฟรีวันนี้ ไม่ต้องใช้บัตรเครดิต ไม่มีข้อผูกมัด
          </p>
          <Button size="lg" variant="secondary" className="h-12 px-8 text-base" asChild>
            <Link href="/register">
              สร้างบัญชีฟรี
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Package className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">กล่องเอกสารดิจิทัล</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 Accounting Document Hub. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
