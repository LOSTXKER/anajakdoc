"use server";

/**
 * Comment Actions
 * 
 * Features:
 * - Create, update, delete comments
 * - Reply threading
 * - @mentions with notifications
 */

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import { createNotification } from "./notification";
import { revalidatePath } from "next/cache";
import type { ApiResponse } from "@/types";

// ============================================
// TYPES
// ============================================

export interface CommentData {
  id: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  editedAt: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
  mentions: string[];
  replies: CommentData[];
  parentId: string | null;
}

// Prisma Comment with includes
type CommentWithUser = {
  id: string;
  content: string;
  isInternal: boolean;
  createdAt: Date;
  editedAt: Date | null;
  parentId: string | null;
  mentions: string[];
  user: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
  replies?: CommentWithUser[];
}

// ============================================
// GET COMMENTS
// ============================================

/**
 * Get all comments for a box (with replies nested)
 */
export async function getBoxComments(boxId: string): Promise<ApiResponse<CommentData[]>> {
  const session = await requireOrganization();

  // Verify box belongs to organization
  const box = await prisma.box.findFirst({
    where: {
      id: boxId,
      organizationId: session.currentOrganization.id,
    },
  });

  if (!box) {
    return { success: false, error: "ไม่พบกล่องเอกสาร" };
  }

  // Get top-level comments with replies
  const comments = await prisma.comment.findMany({
    where: {
      boxId,
      parentId: null, // Only top-level comments
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      replies: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
          replies: {
            include: {
              user: {
                select: { id: true, name: true, email: true, avatarUrl: true },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const formatComment = (comment: CommentWithUser): CommentData => ({
    id: comment.id,
    content: comment.content,
    isInternal: comment.isInternal,
    createdAt: comment.createdAt.toISOString(),
    editedAt: comment.editedAt?.toISOString() || null,
    user: comment.user,
    mentions: comment.mentions,
    parentId: comment.parentId,
    replies: comment.replies?.map(formatComment) || [],
  });

  return {
    success: true,
    data: comments.map(formatComment),
  };
}

// ============================================
// CREATE COMMENT
// ============================================

/**
 * Create a new comment (or reply)
 */
export async function createComment(data: {
  boxId: string;
  content: string;
  isInternal?: boolean;
  parentId?: string;
  mentions?: string[];
}): Promise<ApiResponse<CommentData>> {
  const session = await requireOrganization();

  // Verify box belongs to organization
  const box = await prisma.box.findFirst({
    where: {
      id: data.boxId,
      organizationId: session.currentOrganization.id,
    },
  });

  if (!box) {
    return { success: false, error: "ไม่พบกล่องเอกสาร" };
  }

  // If replying, verify parent comment exists
  if (data.parentId) {
    const parentComment = await prisma.comment.findFirst({
      where: { id: data.parentId, boxId: data.boxId },
    });
    if (!parentComment) {
      return { success: false, error: "ไม่พบ comment ที่ต้องการตอบกลับ" };
    }
  }

  // Extract mentions from content (@username pattern)
  const mentionPattern = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const extractedMentions: string[] = [];
  let match;
  while ((match = mentionPattern.exec(data.content)) !== null) {
    extractedMentions.push(match[2]); // User ID is in second capture group
  }

  const allMentions = [...new Set([...(data.mentions || []), ...extractedMentions])];

  const comment = await prisma.comment.create({
    data: {
      boxId: data.boxId,
      userId: session.id,
      content: data.content,
      isInternal: data.isInternal ?? false,
      parentId: data.parentId,
      mentions: allMentions,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  });

  // Create activity log
  await prisma.activityLog.create({
    data: {
      boxId: data.boxId,
      userId: session.id,
      action: "COMMENT_ADDED",
      details: {
        commentId: comment.id,
        isReply: !!data.parentId,
        isInternal: data.isInternal ?? false,
      },
    },
  });

  // Batch create notifications for better performance
  const notificationsToCreate = [];
  
  // Add notifications for mentioned users
  for (const userId of allMentions) {
    if (userId !== session.id) {
      notificationsToCreate.push({
        organizationId: session.currentOrganization.id,
        userId,
        type: "COMMENT_ADDED" as const,
        title: "มีคนกล่าวถึงคุณในความคิดเห็น",
        message: `${session.name || session.email} กล่าวถึงคุณในกล่อง ${box.boxNumber}`,
        actionUrl: `/documents/${box.id}`,
        metadata: { boxId: box.id, boxNumber: box.boxNumber, commentId: comment.id },
      });
    }
  }

  // Add notification for box creator
  if (box.createdById !== session.id && !allMentions.includes(box.createdById)) {
    notificationsToCreate.push({
      organizationId: session.currentOrganization.id,
      userId: box.createdById,
      type: "COMMENT_ADDED" as const,
      title: "มีความคิดเห็นใหม่",
      message: `${session.name || session.email} แสดงความคิดเห็นในกล่อง ${box.boxNumber}`,
      actionUrl: `/documents/${box.id}`,
      metadata: { boxId: box.id, boxNumber: box.boxNumber, commentId: comment.id },
    });
  }

  // Create all notifications at once
  if (notificationsToCreate.length > 0) {
    await prisma.notification.createMany({
      data: notificationsToCreate,
    });
  }

  revalidatePath(`/documents/${data.boxId}`);

  return {
    success: true,
    data: {
      id: comment.id,
      content: comment.content,
      isInternal: comment.isInternal,
      createdAt: comment.createdAt.toISOString(),
      editedAt: null,
      user: comment.user,
      mentions: comment.mentions,
      parentId: comment.parentId,
      replies: [],
    },
  };
}

// ============================================
// UPDATE COMMENT
// ============================================

/**
 * Update a comment (only by the author)
 */
export async function updateComment(
  commentId: string,
  content: string
): Promise<ApiResponse<CommentData>> {
  const session = await requireOrganization();

  const comment = await prisma.comment.findFirst({
    where: { id: commentId },
    include: {
      box: { select: { organizationId: true } },
    },
  });

  if (!comment) {
    return { success: false, error: "ไม่พบความคิดเห็น" };
  }

  if (comment.box.organizationId !== session.currentOrganization.id) {
    return { success: false, error: "ไม่มีสิทธิ์แก้ไข" };
  }

  // Only author can edit
  if (comment.userId !== session.id) {
    return { success: false, error: "คุณสามารถแก้ไขได้เฉพาะความคิดเห็นของตัวเอง" };
  }

  // Extract mentions from new content
  const mentionPattern = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const extractedMentions: string[] = [];
  let match;
  while ((match = mentionPattern.exec(content)) !== null) {
    extractedMentions.push(match[2]);
  }

  const updatedComment = await prisma.comment.update({
    where: { id: commentId },
    data: {
      content,
      editedAt: new Date(),
      mentions: [...new Set(extractedMentions)],
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      replies: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  revalidatePath(`/documents/${comment.boxId}`);

  const formatComment = (c: CommentWithUser): CommentData => ({
    id: c.id,
    content: c.content,
    isInternal: c.isInternal,
    createdAt: c.createdAt.toISOString(),
    editedAt: c.editedAt?.toISOString() || null,
    user: c.user,
    mentions: c.mentions,
    parentId: c.parentId,
    replies: c.replies?.map(formatComment) || [],
  });

  return {
    success: true,
    data: formatComment(updatedComment),
  };
}

// ============================================
// DELETE COMMENT
// ============================================

/**
 * Delete a comment (only by author or admin)
 */
export async function deleteComment(commentId: string): Promise<ApiResponse> {
  const session = await requireOrganization();

  const comment = await prisma.comment.findFirst({
    where: { id: commentId },
    include: {
      box: { select: { organizationId: true, id: true } },
    },
  });

  if (!comment) {
    return { success: false, error: "ไม่พบความคิดเห็น" };
  }

  if (comment.box.organizationId !== session.currentOrganization.id) {
    return { success: false, error: "ไม่มีสิทธิ์ลบ" };
  }

  // Only author or admin can delete
  const isAdmin = ["ADMIN", "OWNER"].includes(session.currentOrganization.role);
  if (comment.userId !== session.id && !isAdmin) {
    return { success: false, error: "คุณสามารถลบได้เฉพาะความคิดเห็นของตัวเอง" };
  }

  await prisma.comment.delete({
    where: { id: commentId },
  });

  revalidatePath(`/documents/${comment.box.id}`);

  return { success: true, data: undefined };
}

// ============================================
// GET MENTIONABLE USERS
// ============================================

/**
 * Get users that can be mentioned in comments
 */
export async function getMentionableUsers(): Promise<ApiResponse<{
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
}[]>> {
  const session = await requireOrganization();

  const members = await prisma.organizationMember.findMany({
    where: {
      organizationId: session.currentOrganization.id,
      isActive: true,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  });

  return {
    success: true,
    data: members.map((m) => m.user),
  };
}
