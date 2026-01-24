"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Bug,
  X,
  Users,
  Database,
  Trash2,
  RefreshCw,
  Building2,
  Calculator,
  User,
  ChevronDown,
  ChevronUp,
  Loader2,
  Check,
  Copy,
  FileText,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Only show in development
const isDev = process.env.NODE_ENV === "development";

interface TestAccount {
  id: string;
  email: string;
  name: string;
  role: string;
  type: "owner" | "admin" | "accounting" | "staff" | "firm_owner" | "firm_staff";
  organization?: string;
  firm?: string;
}

interface DevToolsState {
  isOpen: boolean;
  isMinimized: boolean;
  activeTab: "accounts" | "seed" | "database";
}

const TEST_ACCOUNTS: TestAccount[] = [
  // Business Owners
  { id: "owner1", email: "owner@business.com", name: "สมชาย เจ้าของธุรกิจ", role: "OWNER", type: "owner", organization: "บริษัท ABC จำกัด" },
  { id: "owner2", email: "owner2@company.com", name: "สมหญิง เจ้าของบริษัท", role: "OWNER", type: "owner", organization: "ร้านกาแฟ XYZ" },
  
  // Admins
  { id: "admin1", email: "admin@business.com", name: "อดิศร ผู้ดูแล", role: "ADMIN", type: "admin", organization: "บริษัท ABC จำกัด" },
  
  // Accounting Staff
  { id: "acc1", email: "accounting@business.com", name: "บัญชา นักบัญชี", role: "ACCOUNTING", type: "accounting", organization: "บริษัท ABC จำกัด" },
  
  // Regular Staff  
  { id: "staff1", email: "staff@business.com", name: "พนักงาน ทั่วไป", role: "STAFF", type: "staff", organization: "บริษัท ABC จำกัด" },
  
  // Firm Owner
  { id: "firm1", email: "firm@accounting.com", name: "วิชัย สำนักบัญชี", role: "OWNER", type: "firm_owner", firm: "สำนักงานบัญชี วิชัย" },
  
  // Firm Staff
  { id: "firm2", email: "staff@accounting.com", name: "นักบัญชี สำนักงาน", role: "ACCOUNTANT", type: "firm_staff", firm: "สำนักงานบัญชี วิชัย" },
];

const roleColors: Record<string, string> = {
  owner: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  admin: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  accounting: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  staff: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  firm_owner: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  firm_staff: "bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400",
};

const roleLabels: Record<string, string> = {
  owner: "เจ้าของธุรกิจ",
  admin: "ผู้ดูแล",
  accounting: "บัญชี",
  staff: "พนักงาน",
  firm_owner: "เจ้าของสำนักบัญชี",
  firm_staff: "นักบัญชี (Firm)",
};

const userTypeLabels: Record<string, string> = {
  owner: "SME",
  admin: "SME",
  accounting: "SME",
  staff: "SME",
  firm_owner: "Firm",
  firm_staff: "Firm",
};

export function DevTools() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<DevToolsState>({
    isOpen: false,
    isMinimized: true,
    activeTab: "accounts",
  });
  const [seedingProgress, setSeedingProgress] = useState<string | null>(null);
  const [currentAccount, setCurrentAccount] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string } | null>(null);

  // Fetch current user on mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          console.log("[DevTools] Current user:", data);
          if (data?.user) {
            setCurrentUser({ email: data.user.email, name: data.user.name });
            // Set current account based on email
            const account = TEST_ACCOUNTS.find((a) => a.email === data.user.email);
            if (account) {
              console.log("[DevTools] Setting current account:", account.id);
              setCurrentAccount(account.id);
            }
          } else {
            setCurrentUser(null);
            setCurrentAccount(null);
          }
        }
      } catch (error) {
        console.log("[DevTools] Failed to fetch current user:", error);
      }
    };
    
    // Fetch immediately and when panel opens
    fetchCurrentUser();
  }, []);
  
  // Also refresh when panel opens
  useEffect(() => {
    if (state.isOpen) {
      fetch("/api/auth/me")
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (data?.user) {
            setCurrentUser({ email: data.user.email, name: data.user.name });
            const account = TEST_ACCOUNTS.find((a) => a.email === data.user.email);
            if (account) setCurrentAccount(account.id);
          }
        })
        .catch(() => {});
    }
  }, [state.isOpen]);

  // Don't render in production
  if (!isDev) return null;

  const handleSwitchAccount = async (account: TestAccount) => {
    console.log("[DevTools] Switching to account:", account.email);
    
    try {
      const res = await fetch("/api/dev/switch-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: account.email }),
      });

      console.log("[DevTools] Switch response status:", res.status);
      const data = await res.json();
      console.log("[DevTools] Switch response data:", data);

      if (data.success) {
        setCurrentAccount(account.id);
        setCurrentUser({ email: account.email, name: account.name });
        toast.success(`เปลี่ยนเป็น ${account.name}`);
        
        // Redirect to appropriate dashboard based on user type
        if (data.user?.isFirmUser) {
          router.push("/firm/dashboard");
        } else {
          router.push("/dashboard");
        }
      } else {
        // Show helpful message for common errors
        if (data.error?.includes("not found")) {
          toast.error("ยังไม่มีข้อมูล! กด Seed → ทั้งหมด ก่อน", {
            action: {
              label: "Seed เลย",
              onClick: () => {
                setState((s) => ({ ...s, activeTab: "seed" }));
                handleSeedData("all");
              },
            },
          });
        } else {
          toast.error(data.error || "ไม่สามารถเปลี่ยนบัญชีได้");
        }
        console.error("[DevTools] Switch error:", data.error);
      }
    } catch (error) {
      console.error("[DevTools] Switch exception:", error);
      toast.error("เกิดข้อผิดพลาด: " + String(error));
    }
  };

  const handleSeedData = async (type: "all" | "boxes" | "contacts" | "categories") => {
    setSeedingProgress(`กำลังสร้าง ${type}...`);
    console.log("[DevTools] Seeding:", type);
    
    try {
      const res = await fetch("/api/dev/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      console.log("[DevTools] Seed response status:", res.status);
      const data = await res.json();
      console.log("[DevTools] Seed response data:", data);

      if (data.success) {
        toast.success(data.message || "สร้างข้อมูลสำเร็จ");
        if (data.details?.length > 0) {
          console.log("[DevTools] Seeded items:", data.details);
        }
        router.refresh();
      } else {
        toast.error(data.error || "ไม่สามารถสร้างข้อมูลได้");
        console.error("[DevTools] Seed error:", data.error);
      }
    } catch (error) {
      console.error("[DevTools] Seed exception:", error);
      toast.error("เกิดข้อผิดพลาด: " + String(error));
    } finally {
      setSeedingProgress(null);
    }
  };

  const handleResetDatabase = async () => {
    if (!confirm("ต้องการรีเซ็ตข้อมูลทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้")) return;

    startTransition(async () => {
      setSeedingProgress("กำลังรีเซ็ต...");
      try {
        const res = await fetch("/api/dev/reset", {
          method: "POST",
        });

        const data = await res.json();

        if (data.success) {
          toast.success("รีเซ็ตข้อมูลสำเร็จ");
          router.push("/login");
        } else {
          toast.error(data.error || "ไม่สามารถรีเซ็ตได้");
        }
      } catch (error) {
        toast.error("เกิดข้อผิดพลาด");
      } finally {
        setSeedingProgress(null);
      }
    });
  };

  const copyTestPassword = () => {
    navigator.clipboard.writeText("password123");
    toast.success("คัดลอกรหัสผ่านแล้ว: password123");
  };

  if (!state.isOpen) {
    return (
      <button
        onClick={() => setState((s) => ({ ...s, isOpen: true }))}
        className="fixed bottom-4 right-4 z-[9999] flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg hover:bg-amber-600 transition-colors"
        title="DevTools"
      >
        <Bug className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-[9999] w-80 rounded-xl border bg-card shadow-2xl transition-all duration-200",
        state.isMinimized ? "h-12" : "max-h-[80vh]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-amber-500 text-white rounded-t-xl">
        <div className="flex items-center gap-2">
          <Bug className="h-4 w-4" />
          <span className="font-semibold text-sm">DevTools</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-amber-600 text-white border-0">
            DEV
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setState((s) => ({ ...s, isMinimized: !s.isMinimized }))}
            className="p-1 hover:bg-amber-600 rounded"
          >
            {state.isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setState((s) => ({ ...s, isOpen: false }))}
            className="p-1 hover:bg-amber-600 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {!state.isMinimized && (
        <div className="p-3 space-y-3 max-h-[calc(80vh-48px)] overflow-y-auto">
          {/* Current User Info */}
          {currentAccount && (
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">ผู้ใช้ปัจจุบัน:</p>
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                {TEST_ACCOUNTS.find(a => a.id === currentAccount)?.name || "ไม่ทราบ"}
              </p>
              <p className="text-[10px] text-blue-600 dark:text-blue-400">
                {TEST_ACCOUNTS.find(a => a.id === currentAccount)?.email}
              </p>
            </div>
          )}
          {!currentAccount && (
            <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-muted-foreground">ยังไม่ได้เลือกบัญชี</p>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {[
              { id: "accounts", icon: Users, label: "บัญชี" },
              { id: "seed", icon: Database, label: "Seed" },
              { id: "database", icon: Trash2, label: "DB" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setState((s) => ({ ...s, activeTab: tab.id as DevToolsState["activeTab"] }))}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors",
                  state.activeTab === tab.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Accounts Tab */}
          {state.activeTab === "accounts" && (
            <div className="space-y-3">
              {/* Warning if not logged in */}
              {!currentAccount && (
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    ⚠️ ยังไม่มีข้อมูลทดสอบ กรุณา <button onClick={() => setState((s) => ({ ...s, activeTab: "seed" }))} className="underline font-medium">Seed ข้อมูล</button> ก่อน
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">สลับบัญชีทดสอบ</p>
                <button
                  onClick={copyTestPassword}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Copy className="h-3 w-3" />
                  รหัสผ่าน
                </button>
              </div>

              {/* SME Accounts */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-medium text-primary flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  ธุรกิจ SME
                </p>
                {TEST_ACCOUNTS.filter(a => !a.type.startsWith("firm")).map((account) => (
                  <button
                    key={account.id}
                    onClick={() => handleSwitchAccount(account)}
                    disabled={isPending}
                    className={cn(
                      "w-full flex items-center gap-2 p-2 rounded-lg border text-left transition-colors",
                      currentAccount === account.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    )}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full shrink-0 bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{account.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {account.organization}
                      </p>
                    </div>
                    <Badge variant="secondary" className={cn("text-[10px] shrink-0", roleColors[account.type])}>
                      {roleLabels[account.type]}
                    </Badge>
                    {currentAccount === account.id && (
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              {/* Firm Accounts */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-medium text-violet-600 flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  สำนักบัญชี (Firm)
                </p>
                {TEST_ACCOUNTS.filter(a => a.type.startsWith("firm")).map((account) => (
                  <button
                    key={account.id}
                    onClick={() => handleSwitchAccount(account)}
                    disabled={isPending}
                    className={cn(
                      "w-full flex items-center gap-2 p-2 rounded-lg border text-left transition-colors",
                      currentAccount === account.id
                        ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30"
                        : "border-border hover:border-violet-300 hover:bg-violet-50/50 dark:hover:bg-violet-950/20"
                    )}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full shrink-0 bg-violet-100 dark:bg-violet-900/30">
                      <Calculator className="h-4 w-4 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{account.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {account.firm}
                      </p>
                    </div>
                    <Badge variant="secondary" className={cn("text-[10px] shrink-0", roleColors[account.type])}>
                      {roleLabels[account.type]}
                    </Badge>
                    {currentAccount === account.id && (
                      <Check className="h-4 w-4 text-violet-600 shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              {/* Info about new invitation model */}
              <div className="pt-2 border-t">
                <p className="text-[10px] text-muted-foreground">
                  💡 ระบบใหม่: SME เป็นคนเชิญ Firm มาดูแล
                </p>
              </div>
            </div>
          )}

          {/* Seed Tab */}
          {state.activeTab === "seed" && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">สร้างข้อมูลทดสอบ</p>
              
              {seedingProgress && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-xs">{seedingProgress}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSeedData("all")}
                  disabled={isPending}
                  className="h-auto py-3 flex-col gap-1"
                >
                  <Database className="h-4 w-4" />
                  <span className="text-xs">ทั้งหมด</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSeedData("boxes")}
                  disabled={isPending}
                  className="h-auto py-3 flex-col gap-1"
                >
                  <Package className="h-4 w-4" />
                  <span className="text-xs">กล่องเอกสาร</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSeedData("contacts")}
                  disabled={isPending}
                  className="h-auto py-3 flex-col gap-1"
                >
                  <Users className="h-4 w-4" />
                  <span className="text-xs">ผู้ติดต่อ</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSeedData("categories")}
                  disabled={isPending}
                  className="h-auto py-3 flex-col gap-1"
                >
                  <FileText className="h-4 w-4" />
                  <span className="text-xs">หมวดหมู่</span>
                </Button>
              </div>

              <div className="pt-2 border-t">
                <p className="text-[10px] text-muted-foreground mb-2">
                  Seed จะสร้างข้อมูลใหม่ใน Organization ปัจจุบัน
                </p>
              </div>
            </div>
          )}

          {/* Database Tab */}
          {state.activeTab === "database" && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">จัดการฐานข้อมูล</p>

              <Button
                variant="outline"
                size="sm"
                onClick={() => router.refresh()}
                disabled={isPending}
                className="w-full justify-start"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>

              <div className="pt-2 border-t">
                <p className="text-[10px] text-destructive mb-2">Danger Zone</p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleResetDatabase}
                  disabled={isPending}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  รีเซ็ตข้อมูลทั้งหมด
                </Button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-2 border-t">
            <p className="text-[10px] text-center text-muted-foreground">
              DevTools - Development Only
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
