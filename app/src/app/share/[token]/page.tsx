"use client";

import { useEffect, useState, use } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  FileText, 
  Lock, 
  Loader2, 
  Download,
  Calendar,
  Package,
  Eye,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { checkShareLinkPassword, getShareLinkPublic } from "@/server/actions/share";
import { formatAmount, formatDate } from "@/lib/format";

interface SharePageProps {
  params: Promise<{ token: string }>;
}

type SharedBox = {
  id: string;
  boxNumber: string;
  boxType: string;
  boxDate: string;
  title: string | null;
  totalAmount: number | null;
  vatAmount: number | null;
  whtAmount: number | null;
  status: string;
  docStatus: string;
  contact: { name: string } | null;
  category: { name: string } | null;
  documents: Array<{
    docType: string;
    files: Array<{
      fileName: string;
      fileUrl: string;
      mimeType: string;
    }>;
  }>;
};

export default function SharePage({ params }: SharePageProps) {
  const { token } = use(params);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [linkName, setLinkName] = useState<string | null>(null);
  const [data, setData] = useState<{
    organizationName: string;
    showAmounts: boolean;
    showContacts: boolean;
    allowDownload: boolean;
    boxes: SharedBox[];
  } | null>(null);

  useEffect(() => {
    async function checkLink() {
      try {
        const result = await checkShareLinkPassword(token);
        if (result.success) {
          setRequiresPassword(result.data.requiresPassword);
          setLinkName(result.data.name);
          
          if (!result.data.requiresPassword) {
            // Load data directly
            loadData();
          } else {
            setLoading(false);
          }
        } else {
          setError(result.error);
          setLoading(false);
        }
      } catch {
        setError("เกิดข้อผิดพลาด");
        setLoading(false);
      }
    }

    checkLink();
  }, [token]);

  const loadData = async (pwd?: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await getShareLinkPublic(token, pwd);
      if (result.success) {
        setData(result.data);
        setRequiresPassword(false);
      } else {
        setError(result.error);
      }
    } catch {
      setError("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData(password);
  };

  // Using new 4-status system
  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300";
      case "PENDING": return "bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300";
      case "NEED_DOCS": return "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300";
      case "DRAFT": return "bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300";
      default: return "bg-muted text-foreground";
    }
  };

  const getDocTypeLabel = (docType: string) => {
    const labels: Record<string, string> = {
      RECEIPT: "ใบเสร็จ",
      TAX_INVOICE: "ใบกำกับภาษี",
      INVOICE: "ใบแจ้งหนี้",
      WHT_CERT: "หนังสือรับรองหัก ณ ที่จ่าย",
      SLIP_TRANSFER: "สลิปโอนเงิน",
      SLIP_CHEQUE: "สำเนาเช็ค",
      OTHER: "อื่นๆ",
    };
    return labels[docType] || docType;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !requiresPassword) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">ไม่สามารถเข้าถึงได้</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (requiresPassword) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mx-auto mb-4">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>ลิงก์ต้องใช้รหัสผ่าน</CardTitle>
            {linkName && (
              <CardDescription>{linkName}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                type="password"
                placeholder="กรอกรหัสผ่าน"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={!password}>
                เข้าถึง
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground">{data.organizationName}</h1>
              <p className="text-sm text-muted-foreground">
                กล่องเอกสารที่แชร์ • {data.boxes.length} รายการ
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="space-y-4">
          {data.boxes.map((box) => (
            <Card key={box.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{box.boxNumber}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {formatDate(box.boxDate)}
                        {box.category && (
                          <>
                            <span>•</span>
                            {box.category.name}
                          </>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={getStatusColor(box.status)}>
                    {box.status === "COMPLETED" ? "เสร็จสิ้น" :
                     box.status === "PENDING" ? "รอตรวจ" :
                     box.status === "NEED_DOCS" ? "ขาดเอกสาร" :
                     box.status === "DRAFT" ? "แบบร่าง" :
                     box.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Title */}
                {box.title && (
                  <p className="text-sm text-foreground mb-3">{box.title}</p>
                )}

                {/* Amounts */}
                {data.showAmounts && (
                  <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground">ยอดรวม</p>
                      <p className="font-semibold">฿{formatAmount(box.totalAmount || 0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">VAT</p>
                      <p className="font-medium text-foreground">฿{formatAmount(box.vatAmount || 0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">หัก ณ ที่จ่าย</p>
                      <p className="font-medium text-foreground">฿{formatAmount(box.whtAmount || 0)}</p>
                    </div>
                  </div>
                )}

                {/* Contact */}
                {data.showContacts && box.contact && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Building2 className="h-4 w-4" />
                    {box.contact.name}
                  </div>
                )}

                {/* Documents */}
                {box.documents.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">เอกสาร</p>
                    <div className="grid gap-2">
                      {box.documents.map((doc, docIndex) => (
                        <div key={docIndex}>
                          <p className="text-xs text-muted-foreground mb-1">
                            {getDocTypeLabel(doc.docType)}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {doc.files.map((file, fileIndex) => (
                              <div
                                key={fileIndex}
                                className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg text-sm"
                              >
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="truncate max-w-[200px]">{file.fileName}</span>
                                {data.allowDownload && (
                                  <a
                                    href={file.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:text-primary/80"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {data.boxes.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">ไม่มีกล่องเอกสารในลิงก์นี้</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card py-6 mt-12">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>แชร์ผ่านระบบกล่องเอกสารดิจิตอล</p>
        </div>
      </footer>
    </div>
  );
}
