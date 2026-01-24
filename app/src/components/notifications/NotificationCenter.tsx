"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  CheckCircle,
  Package,
  MessageCircle,
  ClipboardList,
  Receipt,
  Filter,
  CheckCheck,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { th } from "date-fns/locale";
import { toast } from "sonner";
import { markAsRead, markAllAsRead, type NotificationData } from "@/server/actions/notification";
import type { NotificationType } from "@prisma/client";
import Link from "next/link";

// Notification type config
const NOTIFICATION_CONFIG: Record<string, {
  icon: React.ElementType;
  color: string;
  bgColor: string;
}> = {
  BOX_SUBMITTED: { icon: Package, color: "text-orange-600", bgColor: "bg-orange-100 dark:bg-orange-900/30" },
  BOX_IN_REVIEW: { icon: Package, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  BOX_NEED_MORE_DOCS: { icon: Package, color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-900/30" },
  BOX_READY_TO_BOOK: { icon: Package, color: "text-teal-600", bgColor: "bg-teal-100 dark:bg-teal-900/30" },
  BOX_BOOKED: { icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30" },
  DOCUMENT_ADDED: { icon: Package, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  COMMENT_ADDED: { icon: MessageCircle, color: "text-purple-600", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
  TASK_ASSIGNED: { icon: ClipboardList, color: "text-purple-600", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
  TASK_REMINDER: { icon: ClipboardList, color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-900/30" },
  TASK_COMPLETED: { icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30" },
  WHT_PENDING: { icon: Receipt, color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-900/30" },
  WHT_RECEIVED: { icon: Receipt, color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30" },
  WHT_OVERDUE: { icon: Receipt, color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/30" },
};

function getNotificationConfig(type: NotificationType) {
  return NOTIFICATION_CONFIG[type] || {
    icon: Bell,
    color: "text-gray-600",
    bgColor: "bg-gray-100 dark:bg-gray-800",
  };
}

interface NotificationCenterProps {
  initialNotifications: NotificationData[];
  currentUserId: string;
}

export function NotificationCenter({
  initialNotifications,
  currentUserId,
}: NotificationCenterProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState<string | null>(null);

  const filteredNotifications = filter === "unread"
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  // Group by date
  const groupedNotifications = filteredNotifications.reduce((acc, notif) => {
    const date = format(new Date(notif.createdAt), "yyyy-MM-dd");
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(notif);
    return acc;
  }, {} as Record<string, NotificationData[]>);

  const handleMarkAsRead = async (id: string) => {
    setLoading(id);
    try {
      const result = await markAsRead(id);
      if (result.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setLoading(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    setLoading("all");
    try {
      const result = await markAllAsRead();
      if (result.success) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true }))
        );
        toast.success("อ่านทั้งหมดแล้ว");
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setLoading(null);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select value={filter} onValueChange={(v: "all" | "unread") => setFilter(v)}>
            <SelectTrigger className="w-[150px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด ({notifications.length})</SelectItem>
              <SelectItem value="unread">ยังไม่อ่าน ({unreadCount})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={handleMarkAllAsRead}
            disabled={loading === "all"}
          >
            {loading === "all" ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCheck className="h-4 w-4 mr-2" />
            )}
            อ่านทั้งหมด
          </Button>
        )}
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              {filter === "unread" ? "ไม่มีการแจ้งเตือนที่ยังไม่ได้อ่าน" : "ยังไม่มีการแจ้งเตือน"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedNotifications).map(([date, dayNotifs]) => (
            <div key={date}>
              {/* Date Header */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-medium text-muted-foreground">
                  {format(new Date(date), "EEEE d MMMM yyyy", { locale: th })}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Notifications */}
              <div className="space-y-2">
                {dayNotifs.map((notif) => {
                  const config = getNotificationConfig(notif.type);
                  const Icon = config.icon;
                  const boxId = (notif.data as { boxId?: string })?.boxId;

                  return (
                    <Card
                      key={notif.id}
                      className={`transition-colors ${
                        notif.isRead ? "opacity-70" : "border-primary/30"
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.bgColor}`}
                          >
                            <Icon className={`h-5 w-5 ${config.color}`} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium text-sm">
                                  {notif.title}
                                  {!notif.isRead && (
                                    <Badge variant="default" className="ml-2 text-xs">
                                      ใหม่
                                    </Badge>
                                  )}
                                </p>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                  {notif.message}
                                </p>
                              </div>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDistanceToNow(new Date(notif.createdAt), {
                                  addSuffix: true,
                                  locale: th,
                                })}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 mt-2">
                              {boxId && (
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/documents/${boxId}`}>
                                    ดูเอกสาร
                                  </Link>
                                </Button>
                              )}
                              {!notif.isRead && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleMarkAsRead(notif.id)}
                                  disabled={loading === notif.id}
                                >
                                  {loading === notif.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                  )}
                                  อ่านแล้ว
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
