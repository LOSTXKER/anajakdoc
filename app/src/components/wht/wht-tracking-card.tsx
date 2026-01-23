"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  Send,
  CheckCircle,
  Clock,
  MoreVertical,
  ArrowUpRight,
  ArrowDownLeft,
  Mail,
  Truck,
  Hand,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { updateWhtStatus } from "@/server/actions/wht-tracking";
import type { SerializedWhtTracking } from "@/types";
import { WhtStatus } from "@prisma/client";
import Link from "next/link";

interface WHTTrackingCardProps {
  tracking: SerializedWhtTracking;
  showDocument?: boolean;
}

const statusConfig: Record<WhtStatus, { label: string; color: string; icon: typeof Clock }> = {
  PENDING: { label: "รอดำเนินการ", color: "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300", icon: Clock },
  ISSUED: { label: "ออกเอกสารแล้ว", color: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300", icon: FileText },
  SENT: { label: "ส่งแล้ว", color: "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300", icon: Send },
  CONFIRMED: { label: "ยืนยันรับแล้ว", color: "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300", icon: CheckCircle },
  RECEIVED: { label: "ได้รับแล้ว", color: "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300", icon: CheckCircle },
};

const sentMethodLabels: Record<string, { label: string; icon: typeof Mail }> = {
  EMAIL: { label: "อีเมล", icon: Mail },
  MAIL: { label: "ไปรษณีย์", icon: Truck },
  HAND_DELIVERY: { label: "ส่งมอบด้วยตนเอง", icon: Hand },
  OTHER: { label: "อื่นๆ", icon: Send },
};

export function WHTTrackingCard({ tracking, showDocument = false }: WHTTrackingCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const statusInfo = statusConfig[tracking.status];
  const StatusIcon = statusInfo.icon;
  const isOutgoing = tracking.type === "OUTGOING";

  const handleStatusChange = async (newStatus: WhtStatus) => {
    setIsUpdating(true);
    
    const additionalData: Record<string, Date> = {};
    if (newStatus === "ISSUED") additionalData.issuedDate = new Date();
    if (newStatus === "SENT") additionalData.sentDate = new Date();
    if (newStatus === "CONFIRMED") additionalData.confirmedDate = new Date();
    if (newStatus === "RECEIVED") additionalData.receivedDate = new Date();

    const result = await updateWhtStatus(tracking.id, newStatus, additionalData);
    setIsUpdating(false);

    if (result.success) {
      toast.success("อัปเดตสถานะเรียบร้อย");
    } else {
      toast.error(result.error || "เกิดข้อผิดพลาด");
    }
  };

  const getNextStatuses = (): WhtStatus[] => {
    if (isOutgoing) {
      switch (tracking.status) {
        case "PENDING": return ["ISSUED"];
        case "ISSUED": return ["SENT"];
        case "SENT": return ["CONFIRMED"];
        default: return [];
      }
    } else {
      switch (tracking.status) {
        case "PENDING": return ["RECEIVED"];
        default: return [];
      }
    }
  };

  const nextStatuses = getNextStatuses();

  return (
    <div className="rounded-lg border bg-card p-4 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 border ${
              isOutgoing ? "border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950" : "border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950"
            }`}>
              {isOutgoing ? (
                <>
                  <ArrowUpRight className="h-3 w-3" />
                  ต้องส่งออก
                </>
              ) : (
                <>
                  <ArrowDownLeft className="h-3 w-3" />
                  รอรับเข้า
                </>
              )}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${statusInfo.color}`}>
              <StatusIcon className="h-3 w-3" />
              {statusInfo.label}
            </span>
          </div>

          {/* Contact */}
          <h4 className="font-medium text-foreground">
            {tracking.contact?.name || "ไม่ระบุคู่ค้า"}
          </h4>

          {/* Amount */}
          <div className="mt-1 text-sm">
            <span className="text-muted-foreground">หัก {tracking.rate}%:</span>
            <span className="font-semibold text-foreground ml-1">฿{tracking.amount.toLocaleString()}</span>
          </div>

          {/* Dates */}
          <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
            {tracking.issuedDate && (
              <div>ออกเอกสาร: {new Date(tracking.issuedDate).toLocaleDateString("th-TH")}</div>
            )}
            {tracking.sentDate && (
              <div className="flex items-center gap-1">
                ส่ง: {new Date(tracking.sentDate).toLocaleDateString("th-TH")}
                {tracking.sentMethod && (
                  <span>({sentMethodLabels[tracking.sentMethod]?.label || tracking.sentMethod})</span>
                )}
              </div>
            )}
            {tracking.receivedDate && (
              <div>ได้รับ: {new Date(tracking.receivedDate).toLocaleDateString("th-TH")}</div>
            )}
          </div>

          {/* Notes */}
          {tracking.notes && (
            <p className="mt-2 text-sm text-muted-foreground">{tracking.notes}</p>
          )}
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isUpdating}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {showDocument && (
              <>
                <DropdownMenuItem asChild>
                  <Link href={`/documents/${tracking.documentId}`}>
                    <FileText className="h-4 w-4 mr-2" />
                    ดูเอกสาร
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            
            {nextStatuses.map((status) => {
              const StatusIconComponent = statusConfig[status].icon;
              return (
                <DropdownMenuItem
                  key={status}
                  onClick={() => handleStatusChange(status)}
                >
                  {StatusIconComponent && (
                    <StatusIconComponent className="h-4 w-4 mr-2" />
                  )}
                  เปลี่ยนเป็น: {statusConfig[status].label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
