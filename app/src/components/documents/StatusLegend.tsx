"use client";

import { FileEdit, Clock, AlertCircle, CheckCircle2, Receipt, FileText, Check, Circle, FileX } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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
 * Document Status Badges - Compact progress indicator with Popover preview
 * Shows document completion as "2/3" with clickable popover for details
 * Based on actual required documents from box configuration
 */
interface DocumentStatusBadgesProps {
  hasVat?: boolean;
  vatDocStatus?: string;
  hasWht?: boolean;
  whtDocStatus?: string;
  documentsCount?: number;
  naDocTypes?: string[];
  boxType?: "EXPENSE" | "INCOME";
  expenseType?: string | null;
  // Files with their doc types to check completion
  files?: Array<{ docType: string }>;
  className?: string;
}

type DocItem = {
  id: string;
  label: string;
  status: "complete" | "missing" | "waiting" | "na";
  statusText: string;
};

// Document type matching for checking if file satisfies requirement
const DOC_TYPE_MATCHES: Record<string, string[]> = {
  tax_invoice: ["TAX_INVOICE", "TAX_INVOICE_ABB"],
  payment_proof: ["SLIP_TRANSFER", "SLIP_CHEQUE", "BANK_STATEMENT", "CREDIT_CARD_STATEMENT", "RECEIPT"],
  cash_receipt: ["CASH_RECEIPT", "RECEIPT", "OTHER"],
  expense_doc: ["TAX_INVOICE", "TAX_INVOICE_ABB", "RECEIPT", "CASH_RECEIPT"],
  wht: ["WHT_SENT"],
  wht_incoming: ["WHT_INCOMING", "WHT_RECEIVED"],
};

export function DocumentStatusBadges({ 
  hasVat, 
  vatDocStatus, 
  hasWht, 
  whtDocStatus,
  documentsCount = 0,
  naDocTypes = [],
  boxType = "EXPENSE",
  expenseType = null,
  files = [],
  className = "" 
}: DocumentStatusBadgesProps) {
  // Build list of required documents based on box configuration
  const docItems: DocItem[] = [];
  const fileDocTypes = files.map(f => f.docType);
  
  // Helper to check if a requirement is satisfied by uploaded files
  const hasFile = (reqId: string): boolean => {
    const matchingTypes = DOC_TYPE_MATCHES[reqId] || [];
    return matchingTypes.some(type => fileDocTypes.includes(type));
  };
  
  if (boxType === "EXPENSE") {
    // VAT document (if hasVat or STANDARD expense type)
    if (hasVat || expenseType === "STANDARD") {
      const isNA = naDocTypes.includes("tax_invoice") || vatDocStatus === "NA";
      const isComplete = hasFile("tax_invoice") || vatDocStatus === "RECEIVED" || vatDocStatus === "VERIFIED";
      
      docItems.push({
        id: "tax_invoice",
        label: "ใบกำกับภาษี",
        status: isNA ? "na" : isComplete ? "complete" : "missing",
        statusText: isNA ? "ไม่มี" : isComplete ? "ครบ" : "ขาด",
      });
    } else if (expenseType === "NO_VAT") {
      // Cash receipt for NO_VAT expense
      const isNA = naDocTypes.includes("cash_receipt");
      const isComplete = hasFile("cash_receipt");
      
      docItems.push({
        id: "cash_receipt",
        label: "บิลเงินสด/ใบเสร็จ",
        status: isNA ? "na" : isComplete ? "complete" : "missing",
        statusText: isNA ? "ไม่มี" : isComplete ? "ครบ" : "ขาด",
      });
    }
    
    // Payment proof (always required for expense)
    {
      const isNA = naDocTypes.includes("payment_proof");
      const isComplete = hasFile("payment_proof");
      
      docItems.push({
        id: "payment_proof",
        label: "หลักฐานการชำระ",
        status: isNA ? "na" : isComplete ? "complete" : "missing",
        statusText: isNA ? "ไม่มี" : isComplete ? "ครบ" : "ขาด",
      });
    }
    
    // WHT document (if hasWht)
    if (hasWht) {
      const isNA = naDocTypes.includes("wht") || whtDocStatus === "NA";
      const isComplete = hasFile("wht") || whtDocStatus === "RECEIVED" || whtDocStatus === "VERIFIED";
      
      docItems.push({
        id: "wht",
        label: "หนังสือหัก ณ ที่จ่าย",
        status: isNA ? "na" : isComplete ? "complete" : "missing",
        statusText: isNA ? "ไม่มี" : isComplete ? "ครบ" : "ขาด",
      });
    }
  } else if (boxType === "INCOME") {
    // VAT document (if hasVat)
    if (hasVat) {
      const isNA = naDocTypes.includes("tax_invoice") || vatDocStatus === "NA";
      const isComplete = hasFile("tax_invoice") || vatDocStatus === "RECEIVED" || vatDocStatus === "VERIFIED";
      
      docItems.push({
        id: "tax_invoice",
        label: "ใบกำกับภาษี",
        status: isNA ? "na" : isComplete ? "complete" : "missing",
        statusText: isNA ? "ไม่มี" : isComplete ? "ครบ" : "ขาด",
      });
    }
    
    // Payment proof (always required for income)
    {
      const isNA = naDocTypes.includes("payment_proof");
      const isComplete = hasFile("payment_proof");
      
      docItems.push({
        id: "payment_proof",
        label: "หลักฐานการรับเงิน",
        status: isNA ? "na" : isComplete ? "complete" : "missing",
        statusText: isNA ? "ไม่มี" : isComplete ? "ครบ" : "ขาด",
      });
    }
    
    // WHT incoming document (if hasWht)
    if (hasWht) {
      const isNA = naDocTypes.includes("wht_incoming") || whtDocStatus === "NA";
      const isComplete = hasFile("wht_incoming") || whtDocStatus === "RECEIVED" || whtDocStatus === "VERIFIED";
      const isWaiting = whtDocStatus === "REQUEST_SENT";
      
      docItems.push({
        id: "wht_incoming",
        label: "หนังสือหัก ณ ที่จ่าย",
        status: isNA ? "na" : isComplete ? "complete" : isWaiting ? "waiting" : "missing",
        statusText: isNA ? "ไม่มี" : isComplete ? "ครบ" : isWaiting ? "รอ" : "ขาด",
      });
    }
  }
  
  // If no required documents
  if (docItems.length === 0) {
    return (
      <span className="text-xs text-muted-foreground">
        -
      </span>
    );
  }
  
  // Calculate progress
  const total = docItems.length;
  const completed = docItems.filter(d => d.status === "complete" || d.status === "na").length;
  const hasMissing = docItems.some(d => d.status === "missing");
  const hasWaiting = docItems.some(d => d.status === "waiting");
  
  // Determine badge color
  let badgeClass = "";
  if (completed === total) {
    badgeClass = "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800";
  } else if (hasMissing) {
    badgeClass = "bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-800";
  } else if (hasWaiting) {
    badgeClass = "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800";
  } else {
    badgeClass = "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700";
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border cursor-pointer hover:opacity-80 transition-opacity",
            badgeClass,
            className
          )}
        >
          <FileText className="h-3 w-3" />
          <span>{completed}/{total}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="start">
        <div className="space-y-2">
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-sm font-medium">เอกสาร</span>
            <span className={cn(
              "text-xs font-medium",
              completed === total ? "text-emerald-600" : "text-orange-600"
            )}>
              {completed}/{total}
            </span>
          </div>
          <div className="space-y-1.5">
            {docItems.map((item) => (
              <div key={item.id} className="flex items-center gap-2 text-sm">
                {item.status === "complete" ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                ) : item.status === "na" ? (
                  <FileX className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                ) : item.status === "waiting" ? (
                  <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                ) : (
                  <Circle className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                )}
                <span className={cn(
                  "flex-1",
                  item.status === "complete" && "text-emerald-700 dark:text-emerald-400",
                  item.status === "na" && "text-slate-500 line-through",
                  item.status === "waiting" && "text-amber-700 dark:text-amber-400",
                  item.status === "missing" && "text-orange-700 dark:text-orange-400"
                )}>
                  {item.label}
                </span>
                <span className={cn(
                  "text-xs",
                  item.status === "complete" && "text-emerald-600",
                  item.status === "na" && "text-slate-400",
                  item.status === "waiting" && "text-amber-600",
                  item.status === "missing" && "text-orange-600"
                )}>
                  {item.statusText}
                </span>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
