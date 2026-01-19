"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { submitDocument, reviewDocument } from "@/server/actions/document";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Edit,
  Send,
  CheckCircle2,
  XCircle,
  MessageSquare,
  FileText,
  Calendar,
  Building2,
  FolderOpen,
  Users,
  DollarSign,
  Loader2,
  Clock,
  AlertCircle,
  Download,
  Image as ImageIcon,
  File,
  Package,
  History,
} from "lucide-react";
import { toast } from "sonner";
import type { SerializedDocument, MemberRole } from "@/types";
import { SubDocumentList } from "./subdocument-list";
import { WHTTrackingList } from "@/components/wht/wht-tracking-list";

interface DocumentDetailProps {
  document: SerializedDocument;
  userRole: MemberRole;
}

// Get status display based on completion percent
function getStatusDisplay(doc: SerializedDocument) {
  const percent = doc.completionPercent || 0;
  const isExported = doc.status === "EXPORTED";
  const isBooked = doc.status === "BOOKED";
  const isVoid = doc.status === "VOID" || doc.status === "REJECTED";

  if (isVoid) {
    return { label: "ยกเลิก", color: "bg-gray-100 text-gray-500", icon: XCircle };
  }
  if (isBooked) {
    return { label: "บันทึกแล้ว", color: "bg-primary/10 text-primary", icon: CheckCircle2 };
  }
  if (isExported) {
    return { label: "Export แล้ว", color: "bg-purple-100 text-purple-700", icon: CheckCircle2 };
  }
  if (percent === 100 || doc.isComplete) {
    return { label: "เอกสารครบ", color: "bg-green-100 text-green-700", icon: CheckCircle2 };
  }
  if (percent >= 50) {
    return { label: `${percent}%`, color: "bg-yellow-100 text-yellow-700", icon: Clock };
  }
  return { label: `${percent}%`, color: "bg-orange-100 text-orange-700", icon: AlertCircle };
}

const docTypeLabels: Record<string, string> = {
  SLIP: "สลิปโอนเงิน",
  RECEIPT: "ใบเสร็จ",
  TAX_INVOICE: "ใบกำกับภาษี",
  INVOICE: "ใบแจ้งหนี้",
  QUOTATION: "ใบเสนอราคา",
  PURCHASE_ORDER: "ใบสั่งซื้อ",
  DELIVERY_NOTE: "ใบส่งของ",
  OTHER: "อื่นๆ",
};

interface FilePreviewCardProps {
  file: {
    id: string;
    fileName: string;
    fileUrl: string;
    mimeType: string;
    fileSize: number;
  };
  onClick: () => void;
}

function FilePreviewCard({ file, onClick }: FilePreviewCardProps) {
  const isImage = file.mimeType.startsWith("image/");
  const isPdf = file.mimeType === "application/pdf";
  
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <button
      onClick={onClick}
      className="group aspect-[4/3] rounded-lg border bg-muted relative overflow-hidden hover:border-primary transition-colors text-left"
    >
      {isImage ? (
        <img 
          src={file.fileUrl} 
          alt={file.fileName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2">
          {isPdf ? (
            <FileText className="h-8 w-8 text-red-500" />
          ) : (
            <File className="h-8 w-8 text-muted-foreground" />
          )}
          <span className="text-xs text-muted-foreground px-2 text-center truncate max-w-full">
            {file.fileName}
          </span>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-xs text-white truncate">{file.fileName}</p>
        <p className="text-xs text-white/70">{formatSize(file.fileSize)}</p>
      </div>
    </button>
  );
}

export function DocumentDetail({ document, userRole }: DocumentDetailProps) {
  const [isPending, startTransition] = useTransition();
  const [reviewComment, setReviewComment] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | "need_info" | null>(null);
  const [selectedFile, setSelectedFile] = useState<SerializedDocument["files"][0] | null>(null);

  const canEdit = document.status === "DRAFT" || document.status === "NEED_INFO";
  const canSubmit = document.status === "DRAFT";
  const canReview = ["ACCOUNTING", "ADMIN", "OWNER"].includes(userRole) && 
                   ["PENDING_REVIEW", "NEED_INFO"].includes(document.status);

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await submitDocument(document.id);
      if (result.success) {
        toast.success("ส่งเอกสารเรียบร้อยแล้ว");
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  const handleReview = (action: "approve" | "reject" | "need_info") => {
    setReviewAction(action);
    setDialogOpen(true);
  };

  const confirmReview = () => {
    if (!reviewAction) return;
    
    startTransition(async () => {
      const result = await reviewDocument(document.id, reviewAction, reviewComment);
      if (result.success) {
        toast.success(result.message);
        setDialogOpen(false);
        setReviewComment("");
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  const statusDisplay = getStatusDisplay(document);
  const StatusIcon = statusDisplay.icon;

  return (
    <div className="max-w-5xl space-y-6">
      {/* Back & Actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/documents">
            <ArrowLeft className="mr-2 h-4 w-4" />
            กลับ
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button variant="outline" asChild>
              <Link href={`/documents/${document.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                แก้ไข
              </Link>
            </Button>
          )}
          {canSubmit && (
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              ส่งตรวจ
            </Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                    <FileText className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{document.docNumber}</h2>
                    <p className="text-muted-foreground">
                      {docTypeLabels[document.docType] || document.docType}
                    </p>
                  </div>
                </div>
                <Badge className={statusDisplay.color}>
                  <StatusIcon className="mr-1 h-3 w-3" />
                  {statusDisplay.label}
                </Badge>
              </div>

              {/* Amount */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-muted-foreground mb-1">ยอดรวมสุทธิ</p>
                <p className="text-3xl font-bold text-primary">
                  ฿{document.totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </p>
                {document.vatAmount > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    รวม VAT ฿{document.vatAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">รายละเอียด</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">วันที่เอกสาร</p>
                    <p className="font-medium">
                      {new Date(document.docDate).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {document.category && (
                  <div className="flex items-center gap-3">
                    <FolderOpen className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">หมวดหมู่</p>
                      <p className="font-medium">{document.category.name}</p>
                    </div>
                  </div>
                )}

                {document.costCenter && (
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">ศูนย์ต้นทุน</p>
                      <p className="font-medium">{document.costCenter.name}</p>
                    </div>
                  </div>
                )}

                {document.contact && (
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {document.transactionType === "EXPENSE" ? "ผู้ขาย" : "ลูกค้า"}
                      </p>
                      <p className="font-medium">{document.contact.name}</p>
                    </div>
                  </div>
                )}
              </div>

              {document.description && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">รายละเอียด</p>
                    <p>{document.description}</p>
                  </div>
                </>
              )}

              {document.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">หมายเหตุ</p>
                  <p className="text-muted-foreground">{document.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SubDocuments & Files */}
          <Card>
            <Tabs defaultValue="subdocs">
              <CardHeader className="pb-0">
                <TabsList>
                  <TabsTrigger value="subdocs" className="gap-2">
                    <Package className="h-4 w-4" />
                    เอกสารในกล่อง ({document.subDocuments?.length || 0})
                  </TabsTrigger>
                  {document.files.length > 0 && (
                    <TabsTrigger value="legacy" className="gap-2">
                      <FileText className="h-4 w-4" />
                      ไฟล์เดิม ({document.files.length})
                    </TabsTrigger>
                  )}
                </TabsList>
              </CardHeader>
              <CardContent className="pt-4">
                <TabsContent value="subdocs" className="mt-0">
                  <SubDocumentList
                    documentId={document.id}
                    transactionType={document.transactionType}
                    subDocuments={document.subDocuments || []}
                    canEdit={canEdit}
                  />
                </TabsContent>
                
                {document.files.length > 0 && (
                  <TabsContent value="legacy" className="mt-0">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {document.files.map((file) => (
                        <FilePreviewCard 
                          key={file.id}
                          file={file}
                          onClick={() => setSelectedFile(file)}
                        />
                      ))}
                    </div>
                  </TabsContent>
                )}
              </CardContent>
            </Tabs>
          </Card>

          {/* WHT Tracking Card */}
          {(document.hasWht || (document.whtTrackings && document.whtTrackings.length > 0)) && (
            <Card>
              <CardContent className="pt-6">
                <WHTTrackingList
                  documentId={document.id}
                  whtTrackings={document.whtTrackings || []}
                  contacts={document.contact ? [{ id: document.contact.id, name: document.contact.name }] : []}
                  defaultContactId={document.contact?.id}
                  canEdit={canEdit}
                />
              </CardContent>
            </Card>
          )}
          
          {/* File Preview Dialog */}
          <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>{selectedFile?.fileName}</DialogTitle>
              </DialogHeader>
              {selectedFile && (
                <div className="mt-4">
                  {selectedFile.mimeType.startsWith("image/") ? (
                    <img 
                      src={selectedFile.fileUrl} 
                      alt={selectedFile.fileName}
                      className="w-full h-auto rounded-lg"
                    />
                  ) : selectedFile.mimeType === "application/pdf" ? (
                    <iframe 
                      src={selectedFile.fileUrl}
                      className="w-full h-[70vh] rounded-lg border"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                      <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">ไม่สามารถ preview ไฟล์นี้ได้</p>
                      <Button asChild>
                        <a href={selectedFile.fileUrl} download target="_blank" rel="noopener noreferrer">
                          <Download className="mr-2 h-4 w-4" />
                          ดาวน์โหลด
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" asChild>
                  <a href={selectedFile?.fileUrl} download target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-4 w-4" />
                    ดาวน์โหลด
                  </a>
                </Button>
                <Button onClick={() => setSelectedFile(null)}>ปิด</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Review Actions */}
          {canReview && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg">ตรวจสอบเอกสาร</CardTitle>
                <CardDescription>เลือกการดำเนินการสำหรับเอกสารนี้</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-3">
                <Button onClick={() => handleReview("approve")} className="flex-1">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  อนุมัติ
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleReview("need_info")}
                  className="flex-1"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  ขอข้อมูลเพิ่ม
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => handleReview("reject")}
                  className="flex-1"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  ปฏิเสธ
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Submitted By */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">ส่งโดย</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={document.submittedBy.avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(document.submittedBy.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{document.submittedBy.name || "ไม่ระบุชื่อ"}</p>
                  <p className="text-sm text-muted-foreground">{document.submittedBy.email}</p>
                </div>
              </div>
              {document.submittedAt && (
                <p className="text-xs text-muted-foreground mt-3">
                  ส่งเมื่อ {new Date(document.submittedAt).toLocaleString("th-TH")}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                ความคิดเห็น ({document.comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {document.comments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  ยังไม่มีความคิดเห็น
                </p>
              ) : (
                <div className="space-y-4">
                  {document.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.user.avatarUrl || undefined} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {getInitials(comment.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{comment.user.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleDateString("th-TH")}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Review Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approve" && "อนุมัติเอกสาร"}
              {reviewAction === "reject" && "ปฏิเสธเอกสาร"}
              {reviewAction === "need_info" && "ขอข้อมูลเพิ่มเติม"}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === "approve" && "ยืนยันการอนุมัติเอกสารนี้"}
              {reviewAction === "reject" && "กรุณาระบุเหตุผลในการปฏิเสธ"}
              {reviewAction === "need_info" && "กรุณาระบุข้อมูลที่ต้องการเพิ่มเติม"}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="ความคิดเห็น (ถ้ามี)..."
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button 
              onClick={confirmReview} 
              disabled={isPending}
              variant={reviewAction === "reject" ? "destructive" : "default"}
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              ยืนยัน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
