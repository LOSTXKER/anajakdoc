"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  MessageSquare,
  UserPlus,
  Check,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  type NotificationData,
} from "@/server/actions/notification";
import type { NotificationType } from ".prisma/client";

const notificationIcons: Record<NotificationType, typeof FileText> = {
  BOX_SUBMITTED: FileText,
  BOX_APPROVED: CheckCircle,
  BOX_REJECTED: XCircle,
  BOX_NEED_INFO: AlertCircle,
  DOCUMENT_ADDED: FileText,
  DUE_DATE_REMINDER: Calendar,
  DUE_DATE_OVERDUE: Calendar,
  WHT_PENDING: AlertCircle,
  WHT_OVERDUE: AlertCircle,
  COMMENT_ADDED: MessageSquare,
  MEMBER_INVITED: UserPlus,
};

const notificationColors: Record<NotificationType, string> = {
  BOX_SUBMITTED: "text-blue-500",
  BOX_APPROVED: "text-green-500",
  BOX_REJECTED: "text-red-500",
  BOX_NEED_INFO: "text-orange-500",
  DOCUMENT_ADDED: "text-blue-400",
  DUE_DATE_REMINDER: "text-yellow-500",
  DUE_DATE_OVERDUE: "text-red-500",
  WHT_PENDING: "text-orange-500",
  WHT_OVERDUE: "text-red-500",
  COMMENT_ADDED: "text-purple-500",
  MEMBER_INVITED: "text-cyan-500",
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const fetchNotifications = async () => {
    const [notifs, count] = await Promise.all([
      getNotifications(10, true),
      getUnreadCount(),
    ]);
    setNotifications(notifs);
    setUnreadCount(count);
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = (notification: NotificationData) => {
    if (notification.isRead) return;
    
    startTransition(async () => {
      await markAsRead(notification.id);
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    });
  };

  const handleMarkAllAsRead = () => {
    startTransition(async () => {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    });
  };

  const getNotificationLink = (notification: NotificationData): string | null => {
    const data = notification.data;
    if (data?.documentId) {
      return `/documents/${data.documentId}`;
    }
    return null;
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-xs bg-red-500 text-white rounded-full">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="font-semibold">การแจ้งเตือน</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-1 px-2 text-xs"
              onClick={handleMarkAllAsRead}
              disabled={isPending}
            >
              <Check className="mr-1 h-3 w-3" />
              อ่านทั้งหมด
            </Button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-gray-400">
              <Bell className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">ไม่มีการแจ้งเตือน</p>
            </div>
          ) : (
            notifications.map((notification) => {
              const Icon = notificationIcons[notification.type];
              const iconColor = notificationColors[notification.type];
              const link = getNotificationLink(notification);

              const content = (
                <div
                  className={`flex gap-3 p-3 ${
                    !notification.isRead ? "bg-primary/5" : ""
                  }`}
                  onClick={() => handleMarkAsRead(notification)}
                >
                  <div className={`mt-0.5 ${iconColor}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                        locale: th,
                      })}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  )}
                </div>
              );

              if (link) {
                return (
                  <Link key={notification.id} href={link}>
                    <DropdownMenuItem className="p-0 cursor-pointer">
                      {content}
                    </DropdownMenuItem>
                  </Link>
                );
              }

              return (
                <DropdownMenuItem
                  key={notification.id}
                  className="p-0 cursor-pointer"
                >
                  {content}
                </DropdownMenuItem>
              );
            })
          )}
        </div>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                asChild
              >
                <Link href="/notifications">ดูทั้งหมด</Link>
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
