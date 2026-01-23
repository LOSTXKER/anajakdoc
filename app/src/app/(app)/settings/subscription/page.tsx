import { getSession } from "@/server/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  ArrowRight, 
  Star, 
  FileText, 
  Users,
  HardDrive,
  Zap,
  Crown
} from "lucide-react";
import Link from "next/link";
import prisma from "@/lib/prisma";

const plans = [
  {
    id: "FREE",
    name: "Free",
    price: 0,
    description: "เริ่มต้นใช้งานฟรี",
    features: [
      "20 เอกสาร/เดือน",
      "1 ผู้ใช้งาน",
      "Export Excel",
      "ค้นหาเอกสาร",
      "พื้นที่เก็บข้อมูล 1GB",
    ],
    limits: {
      docs: 20,
      users: 1,
      storage: 1,
    },
  },
  {
    id: "STARTER",
    name: "Starter",
    price: 299,
    description: "สำหรับธุรกิจขนาดเล็ก",
    features: [
      "เอกสารไม่จำกัด",
      "3 ผู้ใช้งาน",
      "Export Excel, PDF",
      "ค้นหาเอกสาร",
      "พื้นที่เก็บข้อมูล 10GB",
      "OCR อ่านเอกสารอัตโนมัติ",
    ],
    limits: {
      docs: -1,
      users: 3,
      storage: 10,
    },
    popular: true,
  },
  {
    id: "BUSINESS",
    name: "Business",
    price: 599,
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
    limits: {
      docs: -1,
      users: 10,
      storage: 50,
    },
  },
];

export default async function SubscriptionPage() {
  const session = await getSession();
  
  if (!session?.currentOrganization) {
    redirect("/onboarding");
  }

  // Fetch organization with plan from database
  const org = await prisma.organization.findUnique({
    where: { id: session.currentOrganization.id },
    select: { plan: true },
  });

  // TODO: Fetch real usage data from database
  const currentPlan = org?.plan || "FREE";
  const usage = {
    docsUsed: 12,
    docsLimit: 20,
    membersUsed: 1,
    membersLimit: 1,
    storageUsed: 0.3,
    storageLimit: 1,
  };

  const currentPlanData = plans.find((p) => p.id === currentPlan) || plans[0];

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">แพ็คเกจการใช้งาน</h1>
        <p className="text-muted-foreground">
          จัดการแพ็คเกจและดูสถานะการใช้งานของคุณ
        </p>
      </div>

      {/* Current Plan & Usage */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              แพ็คเกจปัจจุบัน
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{currentPlanData.name}</p>
                <p className="text-sm text-muted-foreground">
                  {currentPlanData.description}
                </p>
              </div>
              <Badge variant={currentPlan === "FREE" ? "secondary" : "default"}>
                {currentPlan === "FREE" ? "ฟรี" : "Active"}
              </Badge>
            </div>
            <div className="pt-4 border-t">
              <p className="text-3xl font-bold">
                ฿{currentPlanData.price.toLocaleString()}
                <span className="text-base font-normal text-muted-foreground">/เดือน</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Usage Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              สถานะการใช้งาน
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Documents */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  เอกสารเดือนนี้
                </span>
                <span>
                  {usage.docsUsed}/{usage.docsLimit === -1 ? "∞" : usage.docsLimit}
                </span>
              </div>
              <Progress 
                value={usage.docsLimit === -1 ? 0 : (usage.docsUsed / usage.docsLimit) * 100} 
              />
            </div>

            {/* Members */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  สมาชิก
                </span>
                <span>
                  {usage.membersUsed}/{usage.membersLimit}
                </span>
              </div>
              <Progress value={(usage.membersUsed / usage.membersLimit) * 100} />
            </div>

            {/* Storage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  พื้นที่เก็บข้อมูล
                </span>
                <span>
                  {usage.storageUsed} GB / {usage.storageLimit} GB
                </span>
              </div>
              <Progress value={(usage.storageUsed / usage.storageLimit) * 100} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Comparison */}
      <div>
        <h2 className="text-xl font-semibold mb-6">เปรียบเทียบแพ็คเกจ</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            const isUpgrade = plans.findIndex((p) => p.id === plan.id) > plans.findIndex((p) => p.id === currentPlan);
            
            return (
              <Card
                key={plan.id}
                className={`relative ${
                  plan.popular
                    ? "border-2 border-primary shadow-lg"
                    : isCurrent
                    ? "border-2 border-muted-foreground/30"
                    : ""
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
                {isCurrent && !plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="secondary">แพ็คเกจปัจจุบัน</Badge>
                  </div>
                )}
                <CardContent className="p-6 pt-8">
                  <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {plan.description}
                  </p>
                  <p className="text-3xl font-bold mb-6">
                    ฿{plan.price.toLocaleString()}
                    <span className="text-sm font-normal text-muted-foreground">
                      /เดือน
                    </span>
                  </p>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <Button className="w-full" variant="outline" disabled>
                      แพ็คเกจปัจจุบัน
                    </Button>
                  ) : isUpgrade ? (
                    <Button className="w-full" asChild>
                      <Link href={`/checkout?plan=${plan.id}`}>
                        อัปเกรด
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button className="w-full" variant="outline" asChild>
                      <Link href={`/checkout?plan=${plan.id}`}>
                        เปลี่ยนแพ็คเกจ
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Billing History Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>ประวัติการชำระเงิน</CardTitle>
          <CardDescription>รายการชำระเงินที่ผ่านมา</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>ยังไม่มีประวัติการชำระเงิน</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
