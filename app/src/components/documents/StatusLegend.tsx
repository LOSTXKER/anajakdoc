"use client";

import { FileEdit, Clock, AlertCircle, CheckCircle2, Receipt, FileText } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StatusLegendProps {
  showVatWht?: boolean;
}

const statusItems = [
  {
    icon: FileEdit,
    label: "ร่าง",
    description: "กำลังร่างเอกสาร ยังไม่ได้ส่ง",
    color: "text-slate-600",
    bgColor: "bg-slate-100",
  },
  {
    icon: Clock,
    label: "รอตรวจ",
    description: "ส่งแล้ว รอบัญชีตรวจสอบ",
    color: "text-sky-600",
    bgColor: "bg-sky-100",
  },
  {
    icon: AlertCircle,
    label: "ขาดเอกสาร",
    description: "ต้องเพิ่มเอกสารก่อนดำเนินการ",
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
  {
    icon: CheckCircle2,
    label: "เสร็จสิ้น",
    description: "ลงบัญชีเรียบร้อยแล้ว",
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
  },
];

const docStatusItems = [
  {
    icon: FileText,
    label: "VAT",
    items: [
      { status: "มี", description: "มีใบกำกับภาษี", color: "text-emerald-600" },
      { status: "ขาด", description: "ยังไม่ได้รับใบกำกับภาษี", color: "text-orange-600" },
    ],
  },
  {
    icon: Receipt,
    label: "WHT",
    items: [
      { status: "มี", description: "มีหนังสือรับรองหัก ณ ที่จ่าย", color: "text-emerald-600" },
      { status: "ขอแล้ว", description: "ส่งคำขอไปแล้ว รอรับ", color: "text-amber-600" },
      { status: "ขาด", description: "ยังไม่ได้ขอ/รับ", color: "text-orange-600" },
    ],
  },
];

export function StatusLegend({ showVatWht = true }: StatusLegendProps) {
  return (
    <TooltipProvider>
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="font-medium">สถานะ:</span>
        {statusItems.map((item) => (
          <Tooltip key={item.label}>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 cursor-help">
                <span className={`p-1 rounded ${item.bgColor}`}>
                  <item.icon className={`h-3 w-3 ${item.color}`} />
                </span>
                <span>{item.label}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{item.description}</p>
            </TooltipContent>
          </Tooltip>
        ))}

        {showVatWht && (
          <>
            <span className="mx-2 text-border">|</span>
            <span className="font-medium">เอกสารประกอบ:</span>
            {docStatusItems.map((doc) => (
              <Tooltip key={doc.label}>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 cursor-help">
                    <doc.icon className="h-3 w-3" />
                    <span>{doc.label}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    <p className="font-medium">{doc.label}</p>
                    {doc.items.map((item) => (
                      <p key={item.status} className={item.color}>
                        • {item.status}: {item.description}
                      </p>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </>
        )}
      </div>
    </TooltipProvider>
  );
}

/**
 * VAT/WHT Status Icons with Tooltips (legacy - compact version)
 */
interface DocStatusIconsProps {
  hasVat?: boolean;
  vatDocStatus?: string;
  hasWht?: boolean;
  whtDocStatus?: string;
  className?: string;
}

export function DocStatusIcons({ 
  hasVat, 
  vatDocStatus, 
  hasWht, 
  whtDocStatus,
  className = "" 
}: DocStatusIconsProps) {
  if (!hasVat && !hasWht) return null;

  const getVatTooltip = () => {
    if (!hasVat) return null;
    switch (vatDocStatus) {
      case "RECEIVED":
        return { text: "VAT: ได้รับแล้ว", color: "text-emerald-600" };
      case "MISSING":
        return { text: "VAT: ยังไม่ได้รับ", color: "text-orange-500" };
      default:
        return { text: "VAT", color: "text-muted-foreground" };
    }
  };

  const getWhtTooltip = () => {
    if (!hasWht) return null;
    switch (whtDocStatus) {
      case "RECEIVED":
        return { text: "WHT: ได้รับแล้ว", color: "text-emerald-600" };
      case "REQUEST_SENT":
        return { text: "WHT: ส่งคำขอแล้ว รอรับ", color: "text-amber-500" };
      case "MISSING":
        return { text: "WHT: ยังไม่ได้ขอ", color: "text-orange-500" };
      default:
        return { text: "WHT", color: "text-muted-foreground" };
    }
  };

  const vatInfo = getVatTooltip();
  const whtInfo = getWhtTooltip();

  return (
    <TooltipProvider>
      <div className={`flex items-center gap-1 ${className}`}>
        {vatInfo && (
          <Tooltip>
            <TooltipTrigger asChild>
              <FileText className={`h-4 w-4 cursor-help ${vatInfo.color}`} />
            </TooltipTrigger>
            <TooltipContent>
              <p>{vatInfo.text}</p>
            </TooltipContent>
          </Tooltip>
        )}
        {whtInfo && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Receipt className={`h-4 w-4 cursor-help ${whtInfo.color}`} />
            </TooltipTrigger>
            <TooltipContent>
              <p>{whtInfo.text}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}

/**
 * Document Status Badges - Clear Thai text with color coding
 * Shows VAT/WHT document status in readable format
 */
interface DocumentStatusBadgesProps {
  hasVat?: boolean;
  vatDocStatus?: string;
  hasWht?: boolean;
  whtDocStatus?: string;
  documentsCount?: number;
  className?: string;
}

export function DocumentStatusBadges({ 
  hasVat, 
  vatDocStatus, 
  hasWht, 
  whtDocStatus,
  documentsCount = 0,
  className = "" 
}: DocumentStatusBadgesProps) {
  // If no VAT/WHT required, show clear message
  if (!hasVat && !hasWht) {
    return (
      <span className="text-xs text-muted-foreground">
        ไม่มี VAT/WHT
      </span>
    );
  }

  const getVatBadge = () => {
    if (!hasVat) return null;
    switch (vatDocStatus) {
      case "RECEIVED":
      case "VERIFIED":
        return { 
          label: "ใบกำกับ", 
          status: "✓", 
          className: "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" 
        };
      case "MISSING":
        return { 
          label: "ใบกำกับ", 
          status: "ขาด", 
          className: "bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800" 
        };
      default:
        return { 
          label: "ใบกำกับ", 
          status: "รอ", 
          className: "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700" 
        };
    }
  };

  const getWhtBadge = () => {
    if (!hasWht) return null;
    switch (whtDocStatus) {
      case "RECEIVED":
      case "VERIFIED":
        return { 
          label: "หัก ณ ที่จ่าย", 
          status: "✓", 
          className: "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" 
        };
      case "REQUEST_SENT":
        return { 
          label: "หัก ณ ที่จ่าย", 
          status: "รอ", 
          className: "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800" 
        };
      case "MISSING":
        return { 
          label: "หัก ณ ที่จ่าย", 
          status: "ขาด", 
          className: "bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800" 
        };
      default:
        return { 
          label: "หัก ณ ที่จ่าย", 
          status: "รอ", 
          className: "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700" 
        };
    }
  };

  const vatBadge = getVatBadge();
  const whtBadge = getWhtBadge();

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {vatBadge && (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${vatBadge.className}`}>
          {vatBadge.label} {vatBadge.status}
        </span>
      )}
      {whtBadge && (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${whtBadge.className}`}>
          {whtBadge.label} {whtBadge.status}
        </span>
      )}
    </div>
  );
}
