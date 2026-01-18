"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Upload,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  Download,
  BookOpen,
  FileCheck,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  action: string;
  details?: Record<string, unknown>;
  createdAt: string;
  user: {
    name: string | null;
    avatarUrl: string | null;
  };
}

interface DocumentTimelineProps {
  documentId: string;
  activities: ActivityItem[];
}

const actionConfig: Record<string, { icon: typeof FileText; color: string; label: string }> = {
  CREATED: { icon: FileText, color: "text-blue-500", label: "สร้างกล่อง" },
  UPDATED: { icon: FileText, color: "text-gray-500", label: "แก้ไขข้อมูล" },
  SUBMITTED: { icon: Send, color: "text-indigo-500", label: "ส่งให้บัญชี" },
  REVIEWED_APPROVE: { icon: CheckCircle, color: "text-green-500", label: "อนุมัติ" },
  REVIEWED_REJECT: { icon: XCircle, color: "text-red-500", label: "ปฏิเสธ" },
  REVIEWED_NEED_INFO: { icon: AlertCircle, color: "text-orange-500", label: "ขอข้อมูลเพิ่ม" },
  EXPORTED: { icon: Download, color: "text-purple-500", label: "Export" },
  BOOKED: { icon: BookOpen, color: "text-emerald-500", label: "บันทึกบัญชี" },
  COMMENT_ADDED: { icon: MessageSquare, color: "text-cyan-500", label: "เพิ่มความคิดเห็น" },
  subdocument_added: { icon: Upload, color: "text-blue-400", label: "เพิ่มเอกสาร" },
  subdocument_updated: { icon: FileCheck, color: "text-gray-500", label: "แก้ไขเอกสาร" },
  subdocument_deleted: { icon: XCircle, color: "text-red-400", label: "ลบเอกสาร" },
  file_uploaded: { icon: Upload, color: "text-blue-400", label: "อัปโหลดไฟล์" },
  file_deleted: { icon: XCircle, color: "text-red-400", label: "ลบไฟล์" },
  wht_tracking_created: { icon: FileText, color: "text-orange-500", label: "สร้างติดตาม WHT" },
  wht_tracking_updated: { icon: FileCheck, color: "text-orange-400", label: "อัปเดต WHT" },
  wht_status_changed: { icon: CheckCircle, color: "text-orange-500", label: "เปลี่ยนสถานะ WHT" },
};

function getActionConfig(action: string) {
  return actionConfig[action] || { icon: Clock, color: "text-gray-400", label: action };
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return "เมื่อสักครู่";
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
  if (days < 7) return `${days} วันที่แล้ว`;
  
  return date.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: days > 365 ? "numeric" : undefined,
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getActionDescription(action: string, details?: Record<string, unknown>) {
  const config = getActionConfig(action);
  let description = config.label;
  
  if (details) {
    if (action === "subdocument_added" && details.docType) {
      description = `เพิ่ม${getDocTypeLabel(details.docType as string)}`;
    }
    if (action === "file_uploaded" && details.fileName) {
      description = `อัปโหลด ${details.fileName}`;
    }
    if (action === "wht_status_changed" && details.newStatus) {
      description = `เปลี่ยนสถานะ WHT เป็น ${getWhtStatusLabel(details.newStatus as string)}`;
    }
  }
  
  return description;
}

function getDocTypeLabel(docType: string): string {
  const labels: Record<string, string> = {
    SLIP: "สลิปโอนเงิน",
    TAX_INVOICE: "ใบกำกับภาษี",
    INVOICE: "ใบแจ้งหนี้",
    RECEIPT: "ใบเสร็จรับเงิน",
    WHT_CERT_SENT: "หนังสือหัก ณ ที่จ่าย",
    WHT_CERT_RECEIVED: "หนังสือหัก ณ ที่จ่าย",
    QUOTATION: "ใบเสนอราคา",
    CONTRACT: "สัญญา",
    OTHER: "เอกสารอื่น",
  };
  return labels[docType] || docType;
}

function getWhtStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: "รอดำเนินการ",
    ISSUED: "ออกเอกสารแล้ว",
    SENT: "ส่งแล้ว",
    CONFIRMED: "ยืนยันรับแล้ว",
    RECEIVED: "ได้รับแล้ว",
    CANCELLED: "ยกเลิก",
  };
  return labels[status] || status;
}

export function DocumentTimeline({ documentId, activities }: DocumentTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>ยังไม่มีประวัติ</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {activities.map((activity, index) => {
        const config = getActionConfig(activity.action);
        const Icon = config.icon;
        const isLast = index === activities.length - 1;
        
        return (
          <div key={activity.id} className="flex gap-3">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center bg-muted",
                config.color
              )}>
                <Icon className="h-4 w-4" />
              </div>
              {!isLast && (
                <div className="w-px h-full bg-border min-h-[24px]" />
              )}
            </div>
            
            {/* Content */}
            <div className="pb-4 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-sm">
                  {getActionDescription(activity.action, activity.details as Record<string, unknown>)}
                </p>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(activity.createdAt)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                โดย {activity.user.name || "ไม่ระบุชื่อ"}
              </p>
              
              {/* Additional details */}
              {activity.details && typeof activity.details === "object" && "comment" in activity.details && (
                <p className="mt-1 text-sm bg-muted p-2 rounded">
                  &ldquo;{String(activity.details.comment)}&rdquo;
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
