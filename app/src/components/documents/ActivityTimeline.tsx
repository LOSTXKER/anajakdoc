"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Clock,
  ChevronDown,
  ChevronRight,
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
  Filter,
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
  CREATED: { icon: Plus, label: "สร้างกล่อง", color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  UPDATED: { icon: Edit, label: "แก้ไขข้อมูล", color: "text-gray-600", bgColor: "bg-gray-100 dark:bg-gray-800" },
  STATUS_CHANGED: { icon: Edit, label: "เปลี่ยนสถานะ", color: "text-purple-600", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
  SUBMITTED: { icon: Send, label: "ส่งตรวจ", color: "text-orange-600", bgColor: "bg-orange-100 dark:bg-orange-900/30" },
  APPROVED: { icon: CheckCircle, label: "อนุมัติ", color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30" },
  REJECTED: { icon: XCircle, label: "ปฏิเสธ", color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/30" },
  NEED_MORE_DOCS: { icon: AlertCircle, label: "ขอเอกสารเพิ่ม", color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-900/30" },
  BOOKED: { icon: CheckCircle, label: "ลงบัญชี", color: "text-teal-600", bgColor: "bg-teal-100 dark:bg-teal-900/30" },
  ARCHIVED: { icon: Archive, label: "เก็บถาวร", color: "text-gray-600", bgColor: "bg-gray-100 dark:bg-gray-800" },
  FILE_UPLOADED: { icon: FileUp, label: "อัปโหลดไฟล์", color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  FILE_DELETED: { icon: Trash2, label: "ลบไฟล์", color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/30" },
  COMMENT_ADDED: { icon: MessageCircle, label: "เพิ่มความคิดเห็น", color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  TASK_CREATED: { icon: ClipboardList, label: "สร้าง Task", color: "text-purple-600", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
  TASK_COMPLETED: { icon: CheckCircle, label: "Task เสร็จสิ้น", color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30" },
  PAYMENT_ADDED: { icon: CreditCard, label: "บันทึกการชำระ", color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30" },
  BULK_APPROVED: { icon: CheckCircle, label: "อนุมัติ (Bulk)", color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30" },
  BULK_REJECTED: { icon: XCircle, label: "ปฏิเสธ (Bulk)", color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/30" },
  BULK_REQUESTED_DOCS: { icon: AlertCircle, label: "ขอเอกสาร (Bulk)", color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-900/30" },
  BULK_MARKED_READY: { icon: CheckCircle, label: "Ready (Bulk)", color: "text-teal-600", bgColor: "bg-teal-100 dark:bg-teal-900/30" },
  BULK_BOOKED: { icon: CheckCircle, label: "ลงบัญชี (Bulk)", color: "text-teal-600", bgColor: "bg-teal-100 dark:bg-teal-900/30" },
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

interface ActivityTimelineProps {
  activities: AuditLogEntry[];
  showFilter?: boolean;
}

export function ActivityTimeline({ activities, showFilter = true }: ActivityTimelineProps) {
  const [filterAction, setFilterAction] = useState<string>("all");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Get unique actions for filter
  const uniqueActions = [...new Set(activities.map((a) => a.action))];

  // Filter activities
  const filteredActivities =
    filterAction === "all"
      ? activities
      : activities.filter((a) => a.action === filterAction);

  // Group by date
  const groupedActivities = filteredActivities.reduce((acc, activity) => {
    const date = format(new Date(activity.timestamp), "yyyy-MM-dd");
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(activity);
    return acc;
  }, {} as Record<string, AuditLogEntry[]>);

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>ยังไม่มีประวัติกิจกรรม</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      {showFilter && uniqueActions.length > 1 && (
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="ทั้งหมด" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด ({activities.length})</SelectItem>
              {uniqueActions.map((action) => {
                const config = getActionConfig(action);
                const count = activities.filter((a) => a.action === action).length;
                return (
                  <SelectItem key={action} value={action}>
                    {config.label} ({count})
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-6">
        {Object.entries(groupedActivities).map(([date, dayActivities]) => (
          <div key={date}>
            {/* Date Header */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium text-muted-foreground">
                {format(new Date(date), "EEEE d MMMM yyyy", { locale: th })}
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Activities */}
            <div className="space-y-3">
              {dayActivities.map((activity) => {
                const config = getActionConfig(activity.action);
                const Icon = config.icon;
                const isExpanded = expandedItems.has(activity.id);
                const hasDetails = activity.details && Object.keys(activity.details).length > 0;

                return (
                  <div key={activity.id} className="flex gap-3">
                    {/* Icon */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${config.bgColor}`}
                    >
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {config.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(activity.timestamp), {
                                addSuffix: true,
                                locale: th,
                              })}
                            </span>
                          </div>

                          {/* User Info */}
                          <div className="flex items-center gap-2 mt-1.5">
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-[10px]">
                                {getInitials(activity.userName)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-foreground">
                              {activity.userName}
                            </span>
                          </div>
                        </div>

                        {/* Time */}
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(activity.timestamp), "HH:mm")}
                        </span>
                      </div>

                      {/* Expandable Details */}
                      {hasDetails && (
                        <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(activity.id)}>
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs mt-1 px-2"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-3 w-3 mr-1" />
                              ) : (
                                <ChevronRight className="h-3 w-3 mr-1" />
                              )}
                              รายละเอียด
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                              {JSON.stringify(activity.details, null, 2)}
                            </pre>
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
