"use server";

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import type { ApiResponse } from "@/types";
import type { NotificationType } from ".prisma/client";

export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

export async function getNotifications(
  limit = 20,
  includeRead = false
): Promise<NotificationData[]> {
  const session = await requireOrganization();
  
  const notifications = await prisma.notification.findMany({
    where: {
      userId: session.id,
      organizationId: session.currentOrganization.id,
      ...(includeRead ? {} : { isRead: false }),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return notifications.map(n => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    data: n.data as Record<string, unknown> | null,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  }));
}

export async function getUnreadCount(): Promise<number> {
  const session = await requireOrganization();
  
  return prisma.notification.count({
    where: {
      userId: session.id,
      organizationId: session.currentOrganization.id,
      isRead: false,
    },
  });
}

export async function markAsRead(notificationId: string): Promise<ApiResponse> {
  const session = await requireOrganization();
  
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId: session.id,
    },
  });

  if (!notification) {
    return { success: false, error: "ไม่พบการแจ้งเตือน" };
  }

  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true, readAt: new Date() },
  });

  return { success: true };
}

export async function markAllAsRead(): Promise<ApiResponse> {
  const session = await requireOrganization();
  
  await prisma.notification.updateMany({
    where: {
      userId: session.id,
      organizationId: session.currentOrganization.id,
      isRead: false,
    },
    data: { isRead: true, readAt: new Date() },
  });

  return { success: true };
}

// Helper function to create notifications (called from other server actions)
export async function createNotification(
  organizationId: string,
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: Record<string, unknown>
): Promise<void> {
  await prisma.notification.create({
    data: {
      organizationId,
      userId,
      type,
      title,
      message,
      data: data || null,
    },
  });
}

// Notify all accounting/admin users in organization
export async function notifyAccountingTeam(
  organizationId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: Record<string, unknown>
): Promise<void> {
  const accountingMembers = await prisma.organizationMember.findMany({
    where: {
      organizationId,
      role: { in: ["ACCOUNTING", "ADMIN", "OWNER"] },
      isActive: true,
    },
    select: { userId: true },
  });

  await prisma.notification.createMany({
    data: accountingMembers.map(member => ({
      organizationId,
      userId: member.userId,
      type,
      title,
      message,
      data: data || null,
    })),
  });
}
