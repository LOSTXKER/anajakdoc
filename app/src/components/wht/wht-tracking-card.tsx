"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { updateWHTStatus } from "@/server/actions/wht-tracking";
import type { SerializedWHTTracking } from "@/types";
import { WHTStatus, WHTTrackingType } from "@/types";
import Link from "next/link";

interface WHTTrackingCardProps {
  tracking: SerializedWHTTracking;
  showDocument?: boolean;
}

const statusConfig: Record<WHTStatus, { label: string; color: string; icon: typeof Clock }> = {
  PENDING: { label: "รอดำเนินการ", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  ISSUED: { label: "ออกเอกสารแล้ว", color: "bg-blue-100 text-blue-700", icon: FileText },
  SENT: { label: "ส่งแล้ว", color: "bg-indigo-100 text-indigo-700", icon: Send },
  CONFIRMED: { label: "ยืนยันรับแล้ว", color: "bg-green-100 text-green-700", icon: CheckCircle },
  RECEIVED: { label: "ได้รับแล้ว", color: "bg-green-100 text-green-700", icon: CheckCircle },
  CANCELLED: { label: "ยกเลิก", color: "bg-gray-100 text-gray-700", icon: AlertCircle },
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
  const isOutgoing = tracking.trackingType === "OUTGOING";

  const handleStatusChange = async (newStatus: WHTStatus) => {
    setIsUpdating(true);
    
    const additionalData: Record<string, Date> = {};
    if (newStatus === "ISSUED") additionalData.issuedDate = new Date();
    if (newStatus === "SENT") additionalData.sentDate = new Date();
    if (newStatus === "CONFIRMED") additionalData.confirmedDate = new Date();
    if (newStatus === "RECEIVED") additionalData.receivedDate = new Date();

    const result = await updateWHTStatus(tracking.id, newStatus, additionalData);
    setIsUpdating(false);

    if (result.success) {
      toast.success("อัปเดตสถานะเรียบร้อย");
    } else {
      toast.error(result.error || "เกิดข้อผิดพลาด");
    }
  };

  // Get available next statuses based on current status
  const getNextStatuses = (): WHTStatus[] => {
    if (isOutgoing) {
      switch (tracking.status) {
        case "PENDING": return ["ISSUED", "CANCELLED"];
        case "ISSUED": return ["SENT", "CANCELLED"];
        case "SENT": return ["CONFIRMED", "CANCELLED"];
        default: return [];
      }
    } else {
      switch (tracking.status) {
        case "PENDING": return ["RECEIVED", "CANCELLED"];
        default: return [];
      }
    }
  };

  const nextStatuses = getNextStatuses();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className={isOutgoing ? "text-orange-600" : "text-blue-600"}>
                {isOutgoing ? (
                  <>
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    ต้องส่งออก
                  </>
                ) : (
                  <>
                    <ArrowDownLeft className="h-3 w-3 mr-1" />
                    รอรับเข้า
                  </>
                )}
              </Badge>
              <Badge variant="secondary" className={statusInfo.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusInfo.label}
              </Badge>
            </div>

            {/* Contact */}
            <h4 className="font-medium">
              {tracking.contact?.name || tracking.counterpartyName || "ไม่ระบุคู่ค้า"}
            </h4>

            {/* Amount */}
            <div className="mt-1 text-sm">
              <span className="text-muted-foreground">หัก {tracking.whtRate}%:</span>
              <span className="font-medium ml-1">฿{tracking.whtAmount.toLocaleString()}</span>
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
              {tracking.confirmedDate && (
                <div>ยืนยันรับ: {new Date(tracking.confirmedDate).toLocaleDateString("th-TH")}</div>
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
      </CardContent>
    </Card>
  );
}
