"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  Send,
  CheckCircle2,
  HelpCircle,
  XCircle,
  Loader2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getBoxStatusConfig, getDocStatusConfig } from "@/lib/document-config";
import type { BoxStatus, DocStatus } from "@/types";

interface BoxHeaderProps {
  boxNumber: string;
  status: BoxStatus;
  docStatus: DocStatus;
  isEditing: boolean;
  isPending: boolean;
  canEdit: boolean;
  canSend: boolean;
  canReview: boolean;
  canDelete: boolean;
  onToggleEdit?: () => void;
  onSave?: () => void;
  onSendToAccounting?: () => void;
  onReview?: (action: "approve" | "reject" | "need_info") => void;
  onDelete?: () => void;
}

export function BoxHeader({
  boxNumber,
  status,
  docStatus,
  isEditing,
  isPending,
  canEdit,
  canSend,
  canReview,
  canDelete,
  onToggleEdit,
  onSave,
  onSendToAccounting,
  onReview,
  onDelete,
}: BoxHeaderProps) {
  const statusConfig = getBoxStatusConfig(status);
  const docStatusConfig = getDocStatusConfig(docStatus);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link
          href="/documents"
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">{boxNumber}</h1>
            <Badge variant="secondary" className={statusConfig.className}>
              {statusConfig.label}
            </Badge>
            <Badge variant="outline" className={docStatusConfig.className}>
              {docStatusConfig.label}
            </Badge>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {isEditing ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleEdit}
              disabled={isPending}
            >
              <X className="mr-1 h-4 w-4" />
              ยกเลิก
            </Button>
            <Button
              size="sm"
              onClick={onSave}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-1 h-4 w-4" />
              )}
              บันทึก
            </Button>
          </>
        ) : (
          <>
            {canDelete && onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDelete}
                disabled={isPending}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <Trash2 className="mr-1 h-4 w-4" />
                ลบ
              </Button>
            )}
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleEdit}
              >
                <Edit className="mr-1 h-4 w-4" />
                แก้ไข
              </Button>
            )}
            {canSend && (
              <Button
                size="sm"
                onClick={onSendToAccounting}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-1 h-4 w-4" />
                )}
                ส่งบัญชี
              </Button>
            )}
            {canReview && onReview && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReview("need_info")}
                  disabled={isPending}
                  className="text-amber-600 border-amber-300 hover:bg-amber-50"
                >
                  <HelpCircle className="mr-1 h-4 w-4" />
                  ขอข้อมูล
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReview("reject")}
                  disabled={isPending}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <XCircle className="mr-1 h-4 w-4" />
                  ปฏิเสธ
                </Button>
                <Button
                  size="sm"
                  onClick={() => onReview("approve")}
                  disabled={isPending}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isPending ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-1 h-4 w-4" />
                  )}
                  อนุมัติ
                </Button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
