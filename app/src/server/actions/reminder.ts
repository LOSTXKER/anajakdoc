"use server";

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import { createNotification, notifyAccountingTeam } from "./notification";
import type { ApiResponse } from "@/types";
import { TaskStatus, NotificationType } from "@prisma/client";

// ==================== Reminder Policy (Section 7) ====================
// Default Policy (can be customized per workspace):
// - Day 0: ส่งคำขอเอกสาร (Request sent)
// - Day 3: เตือน submitter
// - Day 7: escalate owner + amber flag (level 1)
// - Day 14: overdue + red flag + dashboard highlight (level 2)

interface ReminderPolicy {
  firstReminderDays: number;
  escalateToOwnerDays: number;
  overdueDays: number;
}

const DEFAULT_POLICY: ReminderPolicy = {
  firstReminderDays: 3,
  escalateToOwnerDays: 7,
  overdueDays: 14,
};

// ==================== Process Reminders (Cron Job) ====================

export async function processReminders(): Promise<ApiResponse<{
  remindersCreated: number;
  escalated: number;
  overdueMarked: number;
}>> {
  // This would typically be called by a cron job
  // For now, we process all organizations
  
  const organizations = await prisma.organization.findMany({
    select: { id: true, settings: true },
  });

  let totalReminders = 0;
  let totalEscalated = 0;
  let totalOverdue = 0;

  for (const org of organizations) {
    const result = await processOrgReminders(org.id);
    totalReminders += result.remindersCreated;
    totalEscalated += result.escalated;
    totalOverdue += result.overdueMarked;
  }

  return {
    success: true,
    data: {
      remindersCreated: totalReminders,
      escalated: totalEscalated,
      overdueMarked: totalOverdue,
    },
    message: `Processed: ${totalReminders} reminders, ${totalEscalated} escalated, ${totalOverdue} overdue`,
  };
}

async function processOrgReminders(organizationId: string) {
  const policy = DEFAULT_POLICY;
  const now = new Date();
  
  let remindersCreated = 0;
  let escalated = 0;
  let overdueMarked = 0;

  // Get all open tasks with due dates
  const tasks = await prisma.task.findMany({
    where: {
      organizationId,
      status: { in: [TaskStatus.OPEN, TaskStatus.IN_PROGRESS] },
      dueDate: { not: null },
    },
    include: {
      box: {
        include: { createdBy: true },
      },
    },
  });

  for (const task of tasks) {
    if (!task.dueDate) continue;
    
    const daysSinceDue = Math.floor(
      (now.getTime() - task.dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Check if already reminded today
    const lastReminder = task.lastReminderAt;
    const alreadyRemindedToday = lastReminder && 
      lastReminder.toDateString() === now.toDateString();

    // Level 2: Overdue (14+ days)
    if (daysSinceDue >= policy.overdueDays && task.escalationLevel < 2) {
      await prisma.task.update({
        where: { id: task.id },
        data: {
          escalationLevel: 2,
          escalatedAt: now,
        },
      });

      // Update box WHT overdue flag if applicable
      if (task.taskType === "WHT_CERTIFICATE") {
        await prisma.box.update({
          where: { id: task.boxId },
          data: { whtOverdue: true },
        });
      }

      // Notify owner and accounting team
      await notifyAccountingTeam(
        organizationId,
        NotificationType.TASK_ESCALATED,
        "งานเกินกำหนด (Level 2)",
        `${task.title} ในกล่อง ${task.box.boxNumber} เกินกำหนด ${daysSinceDue} วัน`,
        { taskId: task.id, boxId: task.boxId }
      );

      overdueMarked++;
      escalated++;
    }
    // Level 1: Escalate to owner (7+ days)
    else if (daysSinceDue >= policy.escalateToOwnerDays && task.escalationLevel < 1) {
      await prisma.task.update({
        where: { id: task.id },
        data: {
          escalationLevel: 1,
          escalatedAt: now,
        },
      });

      // Notify owner
      const owners = await prisma.organizationMember.findMany({
        where: {
          organizationId,
          role: { in: ["OWNER", "ADMIN"] },
          isActive: true,
        },
      });

      for (const owner of owners) {
        await createNotification(
          organizationId,
          owner.userId,
          NotificationType.TASK_ESCALATED,
          "งานเกินกำหนด",
          `${task.title} ในกล่อง ${task.box.boxNumber} เกินกำหนด ${daysSinceDue} วัน`,
          { taskId: task.id, boxId: task.boxId }
        );
      }

      escalated++;
    }
    // First reminder (3+ days)
    else if (daysSinceDue >= policy.firstReminderDays && !alreadyRemindedToday) {
      // Send reminder to box creator
      await createNotification(
        organizationId,
        task.box.createdById,
        NotificationType.TASK_REMINDER,
        "เตือนงานค้าง",
        `${task.title} เกินกำหนด ${daysSinceDue} วัน`,
        { taskId: task.id, boxId: task.boxId }
      );

      await prisma.task.update({
        where: { id: task.id },
        data: {
          lastReminderAt: now,
          reminderCount: { increment: 1 },
        },
      });

      remindersCreated++;
    }
  }

  return { remindersCreated, escalated, overdueMarked };
}

// ==================== Process WHT Overdue ====================

export async function processWhtOverdue(): Promise<ApiResponse<{ updated: number }>> {
  const now = new Date();
  
  // Find boxes with WHT that haven't received the certificate (exclude COMPLETED)
  const boxes = await prisma.box.findMany({
    where: {
      hasWht: true,
      whtDocStatus: { in: ["MISSING", "REQUEST_SENT"] },
      whtDueDate: { lt: now },
      whtOverdue: false,
      status: { notIn: ["COMPLETED"] },
    },
    include: {
      organization: { select: { id: true } },
    },
  });

  let updated = 0;

  for (const box of boxes) {
    await prisma.box.update({
      where: { id: box.id },
      data: { whtOverdue: true },
    });

    // Create notification
    await notifyAccountingTeam(
      box.organizationId,
      NotificationType.WHT_OVERDUE,
      "WHT เกินกำหนด",
      `กล่อง ${box.boxNumber} ยังไม่ได้รับหนังสือรับรองหัก ณ ที่จ่าย`,
      { boxId: box.id }
    );

    updated++;
  }

  return {
    success: true,
    data: { updated },
    message: `พบ ${updated} กล่องที่ WHT เกินกำหนด`,
  };
}

// ==================== Manual Send Reminder ====================

export async function sendTaskReminder(taskId: string): Promise<ApiResponse> {
  const session = await requireOrganization();
  
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      organizationId: session.currentOrganization.id,
    },
    include: {
      box: { include: { createdBy: true } },
    },
  });

  if (!task) {
    return { success: false, error: "ไม่พบงาน" };
  }

  // Send reminder notification
  await createNotification(
    session.currentOrganization.id,
    task.box.createdById,
    NotificationType.TASK_REMINDER,
    "เตือนงานค้าง",
    `${task.title} ในกล่อง ${task.box.boxNumber}`,
    { taskId: task.id, boxId: task.boxId }
  );

  // Update task
  await prisma.task.update({
    where: { id: taskId },
    data: {
      lastReminderAt: new Date(),
      reminderCount: { increment: 1 },
    },
  });

  return {
    success: true,
    message: "ส่งเตือนเรียบร้อยแล้ว",
  };
}

// ==================== Manual Escalate Task ====================

export async function escalateTask(taskId: string): Promise<ApiResponse> {
  const session = await requireOrganization();
  
  if (!["ACCOUNTING", "ADMIN", "OWNER"].includes(session.currentOrganization.role)) {
    return { success: false, error: "คุณไม่มีสิทธิ์ escalate" };
  }

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      organizationId: session.currentOrganization.id,
    },
    include: { box: true },
  });

  if (!task) {
    return { success: false, error: "ไม่พบงาน" };
  }

  const newLevel = Math.min(task.escalationLevel + 1, 2);

  await prisma.task.update({
    where: { id: taskId },
    data: {
      escalationLevel: newLevel,
      escalatedAt: new Date(),
    },
  });

  // Notify owners
  const owners = await prisma.organizationMember.findMany({
    where: {
      organizationId: session.currentOrganization.id,
      role: { in: ["OWNER", "ADMIN"] },
      isActive: true,
    },
  });

  for (const owner of owners) {
    await createNotification(
      session.currentOrganization.id,
      owner.userId,
      NotificationType.TASK_ESCALATED,
      `งาน Escalated (Level ${newLevel})`,
      `${task.title} ในกล่อง ${task.box.boxNumber}`,
      { taskId: task.id, boxId: task.boxId }
    );
  }

  return {
    success: true,
    message: `Escalate เป็น Level ${newLevel} แล้ว`,
  };
}

// ==================== Get Overdue Summary ====================

export async function getOverdueSummary(): Promise<{
  overdueTasks: number;
  overdueWht: number;
  escalatedLevel1: number;
  escalatedLevel2: number;
  totalCritical: number;
}> {
  const session = await requireOrganization();
  
  const [overdueTasks, overdueWht, escalatedLevel1, escalatedLevel2] = await Promise.all([
    prisma.task.count({
      where: {
        organizationId: session.currentOrganization.id,
        status: { in: [TaskStatus.OPEN, TaskStatus.IN_PROGRESS] },
        dueDate: { lt: new Date() },
      },
    }),
    prisma.box.count({
      where: {
        organizationId: session.currentOrganization.id,
        whtOverdue: true,
        status: { notIn: ["COMPLETED"] },
      },
    }),
    prisma.task.count({
      where: {
        organizationId: session.currentOrganization.id,
        escalationLevel: 1,
        status: { in: [TaskStatus.OPEN, TaskStatus.IN_PROGRESS] },
      },
    }),
    prisma.task.count({
      where: {
        organizationId: session.currentOrganization.id,
        escalationLevel: 2,
        status: { in: [TaskStatus.OPEN, TaskStatus.IN_PROGRESS] },
      },
    }),
  ]);

  return {
    overdueTasks,
    overdueWht,
    escalatedLevel1,
    escalatedLevel2,
    totalCritical: escalatedLevel2 + overdueWht,
  };
}
