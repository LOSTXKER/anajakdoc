import {
  Clock,
  Plus,
  Edit,
  Send,
  CheckCircle,
  XCircle,
  FileUp,
  Trash2,
  MessageCircle,
  ClipboardList,
  CreditCard,
  Archive,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { th } from "date-fns/locale";
import type { AuditLogEntry } from "@/server/actions/audit";

// Action configuration
const ACTION_CONFIG: Record<string, {
  icon: React.ElementType;
  label: string;
  color: string;
  bgColor: string;
}> = {
  // Box actions
  CREATED: { icon: Plus, label: "สร้างกล่อง", color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  UPDATED: { icon: Edit, label: "แก้ไขข้อมูล", color: "text-gray-600", bgColor: "bg-gray-100 dark:bg-gray-800" },
  STATUS_CHANGED: { icon: Edit, label: "เปลี่ยนสถานะ", color: "text-purple-600", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
  PENDING: { icon: Send, label: "ส่งตรวจ", color: "text-orange-600", bgColor: "bg-orange-100 dark:bg-orange-900/30" },
  APPROVED: { icon: CheckCircle, label: "อนุมัติ", color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30" },
  REJECTED: { icon: XCircle, label: "ปฏิเสธ", color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/30" },
  NEED_DOCS: { icon: AlertCircle, label: "ขอเอกสารเพิ่ม", color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-900/30" },
  COMPLETED: { icon: CheckCircle, label: "เสร็จสิ้น", color: "text-teal-600", bgColor: "bg-teal-100 dark:bg-teal-900/30" },
  
  // File actions
  FILE_ADDED: { icon: FileUp, label: "เพิ่มไฟล์", color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  FILE_UPLOADED: { icon: FileUp, label: "อัปโหลดไฟล์", color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  FILE_DELETED: { icon: Trash2, label: "ลบไฟล์", color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/30" },
  FILE_TYPE_CHANGED: { icon: Edit, label: "เปลี่ยนประเภทเอกสาร", color: "text-purple-600", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
  
  // Comment & Task actions
  COMMENT_ADDED: { icon: MessageCircle, label: "เพิ่มความคิดเห็น", color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  TASK_CREATED: { icon: ClipboardList, label: "สร้างงาน", color: "text-purple-600", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
  TASK_COMPLETED: { icon: CheckCircle, label: "งานเสร็จสิ้น", color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30" },
  
  // Payment actions
  PAYMENT_ADDED: { icon: CreditCard, label: "บันทึกการชำระ", color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30" },
  MARK_PAID: { icon: CheckCircle, label: "ยืนยันชำระเงิน", color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30" },
  MARK_UNPAID: { icon: XCircle, label: "ยกเลิกยืนยันชำระ", color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-900/30" },
  REIMBURSEMENT_STATUS_UPDATED: { icon: CreditCard, label: "อัปเดตสถานะคืนเงิน", color: "text-purple-600", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
  
  // Bulk actions
  BULK_APPROVED: { icon: CheckCircle, label: "อนุมัติหลายรายการ", color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30" },
  BULK_REJECTED: { icon: XCircle, label: "ปฏิเสธหลายรายการ", color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/30" },
  BULK_REQUESTED_DOCS: { icon: AlertCircle, label: "ขอเอกสารหลายรายการ", color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-900/30" },
  BULK_MARKED_READY: { icon: CheckCircle, label: "พร้อมหลายรายการ", color: "text-teal-600", bgColor: "bg-teal-100 dark:bg-teal-900/30" },
  BULK_COMPLETED: { icon: CheckCircle, label: "เสร็จสิ้นหลายรายการ", color: "text-teal-600", bgColor: "bg-teal-100 dark:bg-teal-900/30" },
};

// Get action config with fallback
function getActionConfig(action: string) {
  return ACTION_CONFIG[action] || {
    icon: Clock,
    label: action,
    color: "text-gray-600",
    bgColor: "bg-gray-100 dark:bg-gray-800",
  };
}


// Get summary from details (only key info)
function getDetailsSummary(action: string, details: Record<string, unknown>): string | null {
  if (!details) return null;
  
  // Status change - show old -> new
  if (action === "STATUS_CHANGED" && details.oldStatus && details.newStatus) {
    return `${details.oldStatus} → ${details.newStatus}`;
  }
  
  // File actions - show filename
  if (details.fileName) {
    return String(details.fileName);
  }
  
  // Amount changes
  if (details.amount) {
    const num = typeof details.amount === "number" ? details.amount : parseFloat(String(details.amount));
    if (!isNaN(num)) {
      return `฿${num.toLocaleString("th-TH")}`;
    }
  }
  
  // Reason (for rejections, etc.)
  if (details.reason) {
    return String(details.reason);
  }
  
  return null;
}

interface ActivityTimelineProps {
  activities: AuditLogEntry[];
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  // Group by date
  const groupedActivities = activities.reduce((acc, activity) => {
    const date = format(new Date(activity.timestamp), "yyyy-MM-dd");
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(activity);
    return acc;
  }, {} as Record<string, AuditLogEntry[]>);

  if (activities.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Clock className="h-6 w-6 mx-auto mb-2 opacity-50" />
        <p className="text-sm">ยังไม่มีประวัติ</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(groupedActivities).map(([date, dayActivities]) => (
        <div key={date}>
          {/* Date Header */}
          <div className="text-xs text-muted-foreground mb-2">
            {format(new Date(date), "d MMM yyyy", { locale: th })}
          </div>

          {/* Activities - Compact */}
          <div className="space-y-2">
            {dayActivities.map((activity) => {
              const config = getActionConfig(activity.action);
              const Icon = config.icon;
              const summary = activity.details 
                ? getDetailsSummary(activity.action, activity.details as Record<string, unknown>)
                : null;

              return (
                <div key={activity.id} className="flex items-start gap-2">
                  {/* Icon - smaller */}
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${config.bgColor}`}
                  >
                    <Icon className={`h-3 w-3 ${config.color}`} />
                  </div>

                  {/* Content - compact */}
                  <div className="flex-1 min-w-0 py-0.5">
                    <div className="flex items-center gap-1.5 text-sm">
                      <span className="font-medium text-foreground">
                        {config.label}
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(activity.timestamp), "HH:mm")}
                      </span>
                    </div>
                    
                    {/* User name + summary */}
                    <div className="text-xs text-muted-foreground truncate">
                      {activity.userName}
                      {summary && (
                        <span className="ml-1 text-foreground/70">— {summary}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
