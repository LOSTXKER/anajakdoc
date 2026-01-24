"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserTypeToggle, type UserType } from "@/components/ui/user-type-toggle";
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
  Calendar,
  BarChart3,
  Clock,
  X,
  Phone,
  Mail,
  MapPin,
  Menu,
} from "lucide-react";

// SME Features
const smeFeatures = [
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

// Firm Features
const firmFeatures = [
  {
    icon: Briefcase,
    title: "Dashboard รวม Clients",
    description: "ดูภาพรวมงานทุก Client ในหน้าเดียว ติดตาม Deadline ได้ง่าย",
  },
  {
    icon: Users,
    title: "จัดการทีมงาน",
    description: "กำหนดนักบัญชีดูแล Client แต่ละราย แบ่งงานได้ชัดเจน",
  },
  {
    icon: Calendar,
    title: "ปฏิทินงาน",
    description: "ดู Deadline ทุก Client ในปฏิทิน ไม่พลาดงานสำคัญ",
  },
  {
    icon: BarChart3,
    title: "รายงานสรุป",
    description: "รายงานสถานะงานรายวัน รายสัปดาห์ รายเดือน",
  },
  {
    icon: Shield,
    title: "White-label",
    description: "ใส่ Branding สำนักบัญชีของคุณ ดูเป็นมืออาชีพ",
  },
  {
    icon: Clock,
    title: "ติดตามเอกสาร",
    description: "รู้ว่า Client ไหนยังส่งเอกสารไม่ครบ แจ้งเตือนอัตโนมัติ",
  },
];

const smeSteps = [
  { number: "1", title: "สร้างกล่อง", description: "เลือกประเภทเอกสาร หมวดหมู่ และศูนย์ต้นทุน" },
  { number: "2", title: "ใส่เอกสาร", description: "อัปโหลดไฟล์ใบเสร็จ ใบกำกับภาษี หรือสลิปโอนเงิน" },
  { number: "3", title: "ส่งให้บัญชี", description: "บัญชีตรวจสอบและอนุมัติ พร้อม Export เข้าระบบ" },
];

const firmSteps = [
  { number: "1", title: "สร้างสำนักงาน", description: "ลงทะเบียนสำนักบัญชี กรอกข้อมูลพื้นฐาน" },
  { number: "2", title: "รอ Client เชิญ", description: "ลูกค้าของคุณส่งคำเชิญให้มาดูแลบัญชี" },
  { number: "3", title: "เริ่มทำงาน", description: "ตอบรับคำเชิญ เข้าถึงเอกสารของ Client ได้ทันที" },
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
    features: ["20 เอกสาร/เดือน", "1 ผู้ใช้งาน", "Export Excel", "ค้นหาเอกสาร", "พื้นที่ 1GB"],
    cta: "เริ่มต้นฟรี",
    popular: false,
  },
  {
    name: "Starter",
    price: "299",
    description: "สำหรับธุรกิจขนาดเล็ก",
    features: ["เอกสารไม่จำกัด", "3 ผู้ใช้งาน", "Export Excel, PDF", "OCR อัตโนมัติ", "พื้นที่ 10GB"],
    cta: "เลือกแพ็คเกจนี้",
    popular: true,
  },
  {
    name: "Business",
    price: "599",
    description: "สำหรับธุรกิจที่ต้องการมากขึ้น",
    features: ["เอกสารไม่จำกัด", "10 ผู้ใช้งาน", "Export + PEAK", "รายงาน Analytics", "พื้นที่ 50GB", "API Access"],
    cta: "เลือกแพ็คเกจนี้",
    popular: false,
  },
];

const firmPlans = [
  {
    name: "Starter",
    price: "990",
    description: "สำหรับสำนักบัญชีขนาดเล็ก",
    features: ["10 Clients", "5 สมาชิก", "Dashboard รวม", "Client Assignment", "พื้นที่ 20GB"],
    cta: "เริ่มต้นใช้งาน",
    popular: false,
  },
  {
    name: "Pro",
    price: "2,500",
    description: "สำหรับสำนักบัญชีมืออาชีพ",
    features: ["50 Clients", "20 สมาชิก", "White-label", "Team Calendar", "พื้นที่ 100GB", "API Access"],
    cta: "เลือกแพ็คเกจนี้",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Contact",
    description: "สำหรับสำนักบัญชีขนาดใหญ่",
    features: ["Clients ไม่จำกัด", "สมาชิกไม่จำกัด", "Custom Domain", "Dedicated Support", "SLA 99.9%"],
    cta: "ติดต่อเรา",
    popular: false,
  },
];

// Trust badges / stats
const smeStats = [
  { value: "1,200+", label: "ธุรกิจที่ไว้วางใจ", icon: Building2 },
  { value: "50,000+", label: "เอกสารที่จัดเก็บ", icon: FileText },
  { value: "4.9/5", label: "คะแนนความพึงพอใจ", icon: Star },
];

const firmStats = [
  { value: "200+", label: "สำนักบัญชีที่ใช้งาน", icon: Briefcase },
  { value: "3,000+", label: "ลูกค้าที่ดูแล", icon: Users },
  { value: "99.9%", label: "Uptime", icon: Shield },
];

export default function LandingPage() {
  const [userType, setUserType] = useState<UserType>("sme");
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isFirm = userType === "firm";

  const features = isFirm ? firmFeatures : smeFeatures;
  const steps = isFirm ? firmSteps : smeSteps;
  const plans = isFirm ? firmPlans : smePlans;
  const stats = isFirm ? firmStats : smeStats;

  // Check localStorage for announcement dismissal
  useEffect(() => {
    const dismissed = localStorage.getItem("announcement-dismissed");
    if (dismissed === "true") {
      setShowAnnouncement(false);
    }
  }, []);

  const dismissAnnouncement = () => {
    setShowAnnouncement(false);
    localStorage.setItem("announcement-dismissed", "true");
  };

  const bgGradient = isFirm
    ? "bg-gradient-to-b from-violet-50 to-background dark:from-violet-950/20"
    : "gradient-bg";

  return (
    <div className="min-h-screen">
      {/* Announcement Bar */}
      {showAnnouncement && (
        <div className={`relative py-2.5 px-4 text-center text-sm text-white ${isFirm ? "bg-violet-600" : "bg-primary"}`}>
          <div className="container mx-auto flex items-center justify-center gap-2">
            <Zap className="h-4 w-4" />
            <span>
              <strong>ใหม่!</strong> รองรับการ Export เข้า PEAK อัตโนมัติแล้ว
            </span>
            <Link href="/register" className="ml-2 underline hover:no-underline font-medium">
              ลองเลย
            </Link>
          </div>
          <button
            onClick={dismissAnnouncement}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded"
            aria-label="ปิดประกาศ"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${isFirm ? "bg-violet-600" : "bg-primary"}`}>
              {isFirm ? (
                <Building2 className="h-5 w-5 text-white" />
              ) : (
                <Package className="h-5 w-5 text-primary-foreground" />
              )}
            </div>
            <span className="font-bold hidden sm:inline">กล่องเอกสาร</span>
            {isFirm && (
              <Badge variant="secondary" className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                Firm
              </Badge>
            )}
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ฟีเจอร์
            </Link>
            <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ราคา
            </Link>
            <Link href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              เกี่ยวกับเรา
            </Link>
            <Link href="#contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ติดต่อ
            </Link>
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <Link href="/login">เข้าสู่ระบบ</Link>
            </Button>
            <Button size="sm" className={isFirm ? "bg-violet-600 hover:bg-violet-700" : ""} asChild>
              <Link href="/register">
                <span className="hidden sm:inline">เริ่มต้นใช้งาน</span>
                <span className="sm:hidden">สมัคร</span>
              </Link>
            </Button>
            
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background p-4 space-y-4">
            <nav className="flex flex-col gap-2">
              <Link href="#features" className="px-4 py-2 text-sm hover:bg-muted rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                ฟีเจอร์
              </Link>
              <Link href="#pricing" className="px-4 py-2 text-sm hover:bg-muted rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                ราคา
              </Link>
              <Link href="#about" className="px-4 py-2 text-sm hover:bg-muted rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                เกี่ยวกับเรา
              </Link>
              <Link href="#contact" className="px-4 py-2 text-sm hover:bg-muted rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                ติดต่อ
              </Link>
              <Link href="/login" className="px-4 py-2 text-sm hover:bg-muted rounded-lg sm:hidden" onClick={() => setMobileMenuOpen(false)}>
                เข้าสู่ระบบ
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className={`relative overflow-hidden ${bgGradient}`}>
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            {/* User Type Toggle */}
            <div className="mb-8 flex justify-center">
              <UserTypeToggle value={userType} onChange={setUserType} />
            </div>

            <div className={`mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
              isFirm 
                ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300" 
                : "bg-primary/10 text-primary"
            }`}>
              <Zap className="h-4 w-4" />
              {isFirm ? "โซลูชันสำหรับสำนักงานบัญชี" : "ใช้งานฟรี ไม่มีค่าใช้จ่าย"}
            </div>

            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
              {isFirm ? (
                <>
                  จัดการลูกค้า
                  <br />
                  <span className="text-violet-600">หลายรายในที่เดียว</span>
                </>
              ) : (
                <>
                  จัดการเอกสารบัญชี
                  <br />
                  <span className="text-primary">ง่ายเหมือนใส่กล่อง</span>
                </>
              )}
            </h1>

            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              {isFirm ? (
                <>
                  Dashboard รวมทุก Client ติดตาม Deadline ได้ง่าย
                  <br className="hidden sm:block" />
                  กำหนดทีมงานดูแลแต่ละราย ทำงานเป็นระบบมากขึ้น
                </>
              ) : (
                <>
                  ระบบจัดการเอกสารบัญชีที่ทำให้ &quot;คนส่งเอกสาร&quot; ส่งได้ถูกตั้งแต่ต้น
                  <br className="hidden sm:block" />
                  และทำให้ &quot;บัญชี&quot; บันทึกได้เร็วขึ้น ผิดพลาดน้อยลง
                </>
              )}
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button 
                size="lg" 
                className={`h-12 px-8 text-base ${isFirm ? "bg-violet-600 hover:bg-violet-700" : ""}`} 
                asChild
              >
                <Link href="/register">
                  {isFirm ? "เริ่มต้นทดลองใช้ฟรี" : "เริ่มต้นใช้งานฟรี"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
                <Link href="#features">ดูฟีเจอร์ทั้งหมด</Link>
              </Button>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="mt-16 flex justify-center">
            {isFirm ? (
              <Card className="w-full max-w-4xl shadow-2xl border-violet-200 dark:border-violet-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
                        <Building2 className="h-5 w-5 text-violet-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Firm Dashboard</h3>
                        <p className="text-sm text-muted-foreground">สำนักงานบัญชี ABC</p>
                      </div>
                    </div>
                    <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100 dark:bg-violet-900/30 dark:text-violet-300">
                      12 Clients
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {["บริษัท A จำกัด", "บริษัท B จำกัด", "บริษัท C จำกัด"].map((name, i) => (
                      <div key={name} className="rounded-lg border p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium truncate">{name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{3 + i} เอกสารรอ</span>
                          <Badge variant={i === 0 ? "destructive" : i === 1 ? "outline" : "secondary"} className="text-xs">
                            {i === 0 ? "เร่งด่วน" : i === 1 ? "รอดำเนินการ" : "ปกติ"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10" />
                <Card className="w-full max-w-4xl shadow-2xl">
                  <CardContent className="p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <Package className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">EXP2601-0001</h3>
                        <p className="text-sm text-muted-foreground">ค่าใช้จ่ายสำนักงาน</p>
                      </div>
                      <div className="text-left sm:text-right">
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
            )}
          </div>
        </div>
      </section>

      {/* Trust Badges / Stats */}
      <section className="py-12 border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ${
                  isFirm ? "bg-violet-100 dark:bg-violet-900/30" : "bg-primary/10"
                }`}>
                  <stat.icon className={`h-6 w-6 ${isFirm ? "text-violet-600" : "text-primary"}`} />
                </div>
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              {isFirm ? "เริ่มต้นใช้งานง่ายๆ" : "ใช้งานง่าย 3 ขั้นตอน"}
            </h2>
            <p className="text-muted-foreground">
              {isFirm 
                ? "ลูกค้าเป็นเจ้าของข้อมูล → เชิญสำนักบัญชีมาดูแล → เริ่มทำงานได้เลย"
                : "สร้างกล่อง → ใส่เอกสาร → ส่งให้บัญชี"
              }
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <div key={step.number} className="relative text-center">
                <div className={`mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white ${
                  isFirm ? "bg-violet-600" : "bg-primary"
                }`}>
                  {step.number}
                </div>
                {index < steps.length - 1 && (
                  <div className={`absolute top-8 left-[60%] hidden w-[80%] border-t-2 border-dashed md:block ${
                    isFirm ? "border-violet-300" : "border-primary/30"
                  }`} />
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
            <h2 className="text-3xl font-bold mb-4">
              {isFirm ? "ฟีเจอร์สำหรับสำนักบัญชี" : "ฟีเจอร์ที่ช่วยให้ทำงานง่ายขึ้น"}
            </h2>
            <p className="text-muted-foreground">
              {isFirm 
                ? "ออกแบบมาเพื่อให้การทำงานกับลูกค้าหลายรายเป็นเรื่องง่าย"
                : "ออกแบบมาเพื่อแก้ปัญหาที่ SME ไทยเจอจริงๆ"
              }
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature) => (
              <Card key={feature.title} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${
                    isFirm ? "bg-violet-100 dark:bg-violet-900/30" : "bg-primary/10"
                  }`}>
                    <feature.icon className={`h-6 w-6 ${isFirm ? "text-violet-600" : "text-primary"}`} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - SME only */}
      {!isFirm && (
        <section className="border-y bg-muted/30 py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">ลูกค้าพูดถึงเรา</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {testimonials.map((testimonial) => (
                <Card key={testimonial.author} className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <p className="text-lg mb-4">&quot;{testimonial.quote}&quot;</p>
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
      )}

      {/* Client Invitation Model - Firm only */}
      {isFirm && (
        <section className="border-y bg-violet-50 dark:bg-violet-950/20 py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <Badge className="mb-4 bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">รูปแบบใหม่</Badge>
                  <h2 className="text-3xl font-bold mb-4">ลูกค้าเป็นเจ้าของข้อมูล</h2>
                  <p className="text-muted-foreground mb-6">
                    ต่างจากระบบอื่นที่สำนักบัญชีสร้างบัญชีให้ลูกค้า ระบบของเราให้ลูกค้าสร้างบัญชีเอง 
                    แล้วเชิญสำนักบัญชีมาดูแล ทำให้:
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-violet-600 mt-0.5 flex-shrink-0" />
                      <span>ลูกค้าควบคุมข้อมูลของตัวเองได้ 100%</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-violet-600 mt-0.5 flex-shrink-0" />
                      <span>เปลี่ยนสำนักบัญชีได้ง่าย ไม่ถูก lock</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-violet-600 mt-0.5 flex-shrink-0" />
                      <span>สร้างความไว้วางใจกับลูกค้า</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-white dark:bg-card rounded-2xl shadow-xl p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
                      <Package className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-medium">บริษัท ตัวอย่าง จำกัด</p>
                        <p className="text-sm text-muted-foreground">ส่งคำเชิญให้คุณ</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1">ปฏิเสธ</Button>
                      <Button className="flex-1 bg-violet-600 hover:bg-violet-700">ตอบรับ</Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* About Section */}
      <section id="about" className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className={`mb-4 ${isFirm ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300" : ""}`}>
                  เกี่ยวกับเรา
                </Badge>
                <h2 className="text-3xl font-bold mb-4">
                  สร้างขึ้นโดยคนที่เข้าใจปัญหา
                </h2>
                <p className="text-muted-foreground mb-6">
                  กล่องเอกสารดิจิทัล พัฒนาขึ้นจากประสบการณ์จริงในการทำบัญชีให้ SME ไทย 
                  เราเข้าใจว่าการจัดการเอกสารบัญชีมีความยุ่งยากอย่างไร 
                  จึงออกแบบระบบที่ใช้งานง่าย ตรงจุด และแก้ปัญหาได้จริง
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className={`h-5 w-5 mt-0.5 flex-shrink-0 ${isFirm ? "text-violet-600" : "text-primary"}`} />
                    <span>ทีมงานมีประสบการณ์ด้านบัญชีและเทคโนโลยี</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className={`h-5 w-5 mt-0.5 flex-shrink-0 ${isFirm ? "text-violet-600" : "text-primary"}`} />
                    <span>พัฒนาจาก feedback ของผู้ใช้จริง</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className={`h-5 w-5 mt-0.5 flex-shrink-0 ${isFirm ? "text-violet-600" : "text-primary"}`} />
                    <span>อัปเดตฟีเจอร์ใหม่อย่างต่อเนื่อง</span>
                  </li>
                </ul>
              </div>
              <div className={`rounded-2xl p-8 ${isFirm ? "bg-violet-50 dark:bg-violet-950/20" : "bg-primary/5"}`}>
                <div className="text-center">
                  <div className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full ${
                    isFirm ? "bg-violet-100 dark:bg-violet-900/30" : "bg-primary/10"
                  }`}>
                    <Package className={`h-10 w-10 ${isFirm ? "text-violet-600" : "text-primary"}`} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Our Mission</h3>
                  <p className="text-muted-foreground">
                    &quot;ทำให้การจัดการเอกสารบัญชีเป็นเรื่องง่าย
                    <br />
                    สำหรับทุกธุรกิจในประเทศไทย&quot;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              {isFirm ? "แพ็คเกจสำหรับสำนักบัญชี" : "แผนราคาที่เหมาะกับคุณ"}
            </h2>
            <p className="text-muted-foreground">
              {isFirm 
                ? "เลือกแพ็คเกจที่เหมาะกับขนาดสำนักบัญชีของคุณ"
                : "เริ่มต้นฟรี อัปเกรดเมื่อพร้อม ไม่มีข้อผูกมัด"
              }
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative ${
                  plan.popular
                    ? `border-2 shadow-xl scale-105 ${isFirm ? "border-violet-500" : "border-primary"}`
                    : "border shadow-lg"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className={`gap-1 ${isFirm ? "bg-violet-600" : ""}`}>
                      <Star className="h-3 w-3" />
                      แนะนำ
                    </Badge>
                  </div>
                )}
                <CardContent className="p-6 pt-8">
                  <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                  <p className="text-4xl font-bold mb-6">
                    {plan.price === "Contact" ? (
                      <span className="text-2xl">ติดต่อเรา</span>
                    ) : (
                      <>
                        ฿{plan.price}
                        <span className="text-base font-normal text-muted-foreground">/เดือน</span>
                      </>
                    )}
                  </p>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className={`h-4 w-4 flex-shrink-0 ${isFirm ? "text-violet-600" : "text-primary"}`} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${plan.popular && isFirm ? "bg-violet-600 hover:bg-violet-700" : ""}`}
                    variant={plan.popular ? "default" : "outline"}
                    asChild
                  >
                    <Link href={plan.price === "Contact" ? "#contact" : "/register"}>
                      {plan.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {!isFirm && (
            <p className="text-center text-sm text-muted-foreground mt-8">
              * SME เป็นเจ้าของ account เสมอ ไม่ถูก lock กับสำนักบัญชี
            </p>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">ติดต่อเรา</h2>
              <p className="text-muted-foreground">
                มีคำถามหรือต้องการข้อมูลเพิ่มเติม? ทีมงานพร้อมช่วยเหลือ
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              {/* Contact Info */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold mb-4">ช่องทางติดต่อ</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      isFirm ? "bg-violet-100 dark:bg-violet-900/30" : "bg-primary/10"
                    }`}>
                      <Mail className={`h-5 w-5 ${isFirm ? "text-violet-600" : "text-primary"}`} />
                    </div>
                    <div>
                      <p className="font-medium">อีเมล</p>
                      <a href="mailto:support@anajakdoc.com" className="text-muted-foreground hover:text-foreground">
                        support@anajakdoc.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      isFirm ? "bg-violet-100 dark:bg-violet-900/30" : "bg-primary/10"
                    }`}>
                      <Phone className={`h-5 w-5 ${isFirm ? "text-violet-600" : "text-primary"}`} />
                    </div>
                    <div>
                      <p className="font-medium">โทรศัพท์</p>
                      <a href="tel:021234567" className="text-muted-foreground hover:text-foreground">
                        02-123-4567
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      isFirm ? "bg-violet-100 dark:bg-violet-900/30" : "bg-primary/10"
                    }`}>
                      <MapPin className={`h-5 w-5 ${isFirm ? "text-violet-600" : "text-primary"}`} />
                    </div>
                    <div>
                      <p className="font-medium">ที่อยู่</p>
                      <p className="text-muted-foreground">
                        กรุงเทพมหานคร, ประเทศไทย
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-lg ${isFirm ? "bg-violet-50 dark:bg-violet-950/20" : "bg-primary/5"}`}>
                  <p className="text-sm">
                    <strong>เวลาทำการ:</strong> จันทร์ - ศุกร์ 9:00 - 18:00 น.
                  </p>
                </div>
              </div>

              {/* Contact Form */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4">ส่งข้อความถึงเรา</h3>
                  <form className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact-name">ชื่อ</Label>
                      <Input id="contact-name" placeholder="ชื่อของคุณ" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-email">อีเมล</Label>
                      <Input id="contact-email" type="email" placeholder="email@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-message">ข้อความ</Label>
                      <textarea
                        id="contact-message"
                        className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="รายละเอียดที่ต้องการสอบถาม..."
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className={`w-full ${isFirm ? "bg-violet-600 hover:bg-violet-700" : ""}`}
                    >
                      ส่งข้อความ
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={`border-t py-24 text-white ${isFirm ? "bg-violet-600" : "bg-primary"}`}>
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            {isFirm ? "พร้อมยกระดับสำนักบัญชีของคุณ?" : "พร้อมเริ่มต้นแล้วหรือยัง?"}
          </h2>
          <p className={`mb-8 max-w-xl mx-auto ${isFirm ? "text-violet-100" : "text-primary-foreground/80"}`}>
            {isFirm 
              ? "ทดลองใช้งานฟรี 14 วัน ไม่ต้องใช้บัตรเครดิต"
              : "สมัครใช้งานฟรีวันนี้ ไม่ต้องใช้บัตรเครดิต ไม่มีข้อผูกมัด"
            }
          </p>
          <Button size="lg" variant="secondary" className="h-12 px-8 text-base" asChild>
            <Link href="/register">
              {isFirm ? "เริ่มทดลองใช้ฟรี" : "สร้างบัญชีฟรี"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isFirm ? "bg-violet-600" : "bg-primary"}`}>
                  {isFirm ? (
                    <Building2 className="h-4 w-4 text-white" />
                  ) : (
                    <Package className="h-4 w-4 text-primary-foreground" />
                  )}
                </div>
                <span className="font-semibold">กล่องเอกสาร</span>
              </div>
              <p className="text-sm text-muted-foreground">
                ระบบจัดการเอกสารบัญชีที่ใช้งานง่าย
                <br />
                สำหรับธุรกิจและสำนักบัญชี
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">ผลิตภัณฑ์</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground">ฟีเจอร์</Link></li>
                <li><Link href="#pricing" className="hover:text-foreground">ราคา</Link></li>
                <li><Link href="/register" className="hover:text-foreground">สมัครใช้งาน</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">บริษัท</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#about" className="hover:text-foreground">เกี่ยวกับเรา</Link></li>
                <li><Link href="#contact" className="hover:text-foreground">ติดต่อ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">กฎหมาย</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/terms" className="hover:text-foreground">เงื่อนไขการใช้งาน</Link></li>
                <li><Link href="/privacy" className="hover:text-foreground">นโยบายความเป็นส่วนตัว</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2026 Accounting Document Hub. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
