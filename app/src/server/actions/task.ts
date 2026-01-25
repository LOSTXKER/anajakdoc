"use server";

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notification";
import { withErrorHandling } from "@/lib/error-handler";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants/values";
import type { ApiResponse, CreateTaskInput, UpdateTaskInput, TaskFilters, PaginatedResponse } from "@/types";
import { TaskStatus, TaskType, NotificationType, BoxStatus } from "@prisma/client";
import { ERROR_MESSAGES } from "@/lib/error-messages";

// ==================== Create Task ====================

export async function createTask(input: CreateTaskInput): Promise<ApiResponse<{ id: string }>> {
  const session = await requireOrganization();
  
  const box = await prisma.box.findFirst({
    where: {
      id: input.boxId,
      organizationId: session.currentOrganization.id,
    },
  });

  if (!box) {
    return {
      success: false,
      error: "ไม่พบกล่องเอกสาร",
    };
  }

  const task = await prisma.task.create({
    data: {
      boxId: input.boxId,
      organizationId: session.currentOrganization.id,
      taskType: input.taskType,
      title: input.title,
      description: input.description,
      dueDate: input.dueDate,
      assigneeId: input.assigneeId,
      status: TaskStatus.OPEN,
    },
  });

  // Notify assignee if assigned
  if (input.assigneeId && input.assigneeId !== session.id) {
    await createNotification(
      session.currentOrganization.id,
      input.assigneeId,
      NotificationType.TASK_ASSIGNED,
      "งานใหม่",
      `คุณได้รับมอบหมายงาน: ${input.title}`,
      { taskId: task.id, boxId: input.boxId }
    );
  }

    // Log activity
    await prisma.activityLog.create({
      data: {
        boxId: input.boxId,
        userId: session.id,
        action: "TASK_CREATED",
        details: { taskId: task.id, taskType: input.taskType },
      },
    });

  revalidatePath(`/documents/${input.boxId}`);
  
  return {
    success: true,
    data: { id: task.id },
    message: "สร้างงานเรียบร้อยแล้ว",
  };
}

// ==================== Auto Create Tasks (Section 6.3) ====================

export async function autoCreateTasks(boxId: string): Promise<ApiResponse> {
  const session = await requireOrganization();
  
  const box = await prisma.box.findFirst({
    where: {
      id: boxId,
      organizationId: session.currentOrganization.id,
    },
    include: {
      tasks: true,
    },
  });

  if (!box) {
    return {
      success: false,
      error: "ไม่พบกล่องเอกสาร",
    };
  }

  const tasksToCreate: { taskType: TaskType; title: string; dueDate?: Date }[] = [];

  // Check VAT task
  if (box.hasVat && !box.tasks.some(t => t.taskType === TaskType.VAT_INVOICE && t.status !== TaskStatus.CANCELLED)) {
    tasksToCreate.push({
      taskType: TaskType.VAT_INVOICE,
      title: "ขอใบกำกับภาษี",
      dueDate: box.dueDate || undefined,
    });
  }

  // Check WHT task
  if (box.hasWht && !box.tasks.some(t => t.taskType === TaskType.WHT_CERTIFICATE && t.status !== TaskStatus.CANCELLED)) {
    // WHT due date is typically 7 days from box date
    const whtDueDate = box.whtDueDate || new Date(box.boxDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    tasksToCreate.push({
      taskType: TaskType.WHT_CERTIFICATE,
      title: "ขอหนังสือรับรองหัก ณ ที่จ่าย",
      dueDate: whtDueDate,
    });
  }

  if (tasksToCreate.length === 0) {
    return {
      success: true,
      message: "ไม่มีงานที่ต้องสร้างเพิ่ม",
    };
  }

  await prisma.task.createMany({
    data: tasksToCreate.map(t => ({
      boxId,
      organizationId: session.currentOrganization.id,
      taskType: t.taskType,
      title: t.title,
      dueDate: t.dueDate,
      status: TaskStatus.OPEN,
    })),
  });

  revalidatePath(`/documents/${boxId}`);
  
  return {
    success: true,
    message: `สร้างงานอัตโนมัติ ${tasksToCreate.length} งาน`,
  };
}

// ==================== Update Task ====================

export async function updateTask(
  taskId: string,
  input: UpdateTaskInput
): Promise<ApiResponse> {
  const session = await requireOrganization();
  
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      organizationId: session.currentOrganization.id,
    },
  });

  if (!task) {
    return {
      success: false,
      error: "ไม่พบงาน",
    };
  }

  const updateData: Record<string, unknown> = {};

  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.dueDate !== undefined) updateData.dueDate = input.dueDate;
  if (input.assigneeId !== undefined) updateData.assigneeId = input.assigneeId;
  if (input.taskType !== undefined) updateData.taskType = input.taskType;

  if (input.status !== undefined) {
    updateData.status = input.status;
    
    if (input.status === TaskStatus.DONE) {
      updateData.completedAt = new Date();
      updateData.completedById = session.id;
    } else if (input.status === TaskStatus.CANCELLED) {
      updateData.cancelledAt = new Date();
      updateData.cancelReason = input.cancelReason;
    }
  }

  await prisma.task.update({
    where: { id: taskId },
    data: updateData,
  });

  // Notify new assignee if changed
  if (input.assigneeId && input.assigneeId !== task.assigneeId && input.assigneeId !== session.id) {
    await createNotification(
      session.currentOrganization.id,
      input.assigneeId,
      NotificationType.TASK_ASSIGNED,
      "งานใหม่",
      `คุณได้รับมอบหมายงาน: ${task.title}`,
      { taskId, boxId: task.boxId }
    );
  }

  revalidatePath(`/documents/${task.boxId}`);
  
  return {
    success: true,
    message: "อัปเดตงานเรียบร้อยแล้ว",
  };
}

// ==================== Complete Task ====================

export async function completeTask(taskId: string): Promise<ApiResponse> {
  return updateTask(taskId, { status: TaskStatus.DONE });
}

// ==================== Cancel Task ====================

export async function cancelTask(taskId: string, reason?: string): Promise<ApiResponse> {
  return updateTask(taskId, { status: TaskStatus.CANCELLED, cancelReason: reason });
}

// ==================== Get Tasks for Box ====================

export async function getTasksForBox(boxId: string) {
  const session = await requireOrganization();
  
  const tasks = await prisma.task.findMany({
    where: {
      boxId,
      organizationId: session.currentOrganization.id,
    },
    include: {
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: [
      { status: "asc" },
      { dueDate: "asc" },
      { createdAt: "desc" },
    ],
  });

  return tasks;
}

// ==================== Get Tasks (with filters) ====================

export async function getTasks(
  filters?: TaskFilters,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<PaginatedResponse<unknown>> {
  const session = await requireOrganization();
  
  const where: Record<string, unknown> = {
    organizationId: session.currentOrganization.id,
  };

  if (filters?.status?.length) {
    where.status = { in: filters.status };
  }

  if (filters?.taskType?.length) {
    where.taskType = { in: filters.taskType };
  }

  if (filters?.assigneeId) {
    where.assigneeId = filters.assigneeId;
  }

  if (filters?.dueDateFrom || filters?.dueDateTo) {
    where.dueDate = {};
    if (filters.dueDateFrom) {
      (where.dueDate as Record<string, Date>).gte = filters.dueDateFrom;
    }
    if (filters.dueDateTo) {
      (where.dueDate as Record<string, Date>).lte = filters.dueDateTo;
    }
  }

  if (filters?.overdue) {
    where.dueDate = { lt: new Date() };
    where.status = { in: [TaskStatus.OPEN, TaskStatus.IN_PROGRESS] };
  }

  if (filters?.escalationLevel !== undefined) {
    where.escalationLevel = filters.escalationLevel;
  }

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        box: {
          select: {
            id: true,
            boxNumber: true,
            title: true,
            totalAmount: true,
            boxDate: true,
            contact: true,
          },
        },
      },
      orderBy: [
        { status: "asc" },
        { dueDate: "asc" },
        { createdAt: "desc" },
      ],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.task.count({ where }),
  ]);

  return {
    items: tasks,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ==================== Get Overdue Tasks ====================

export async function getOverdueTasks() {
  const session = await requireOrganization();
  
  const tasks = await prisma.task.findMany({
    where: {
      organizationId: session.currentOrganization.id,
      dueDate: { lt: new Date() },
      status: { in: [TaskStatus.OPEN, TaskStatus.IN_PROGRESS] },
    },
    include: {
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      box: {
        select: {
          id: true,
          boxNumber: true,
          title: true,
          totalAmount: true,
          boxDate: true,
          contact: true,
        },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  return tasks;
}

// ==================== Get Task Stats ====================

export async function getTaskStats() {
  const session = await requireOrganization();
  
  const [open, inProgress, overdue, completedToday] = await Promise.all([
    prisma.task.count({
      where: {
        organizationId: session.currentOrganization.id,
        status: TaskStatus.OPEN,
      },
    }),
    prisma.task.count({
      where: {
        organizationId: session.currentOrganization.id,
        status: TaskStatus.IN_PROGRESS,
      },
    }),
    prisma.task.count({
      where: {
        organizationId: session.currentOrganization.id,
        dueDate: { lt: new Date() },
        status: { in: [TaskStatus.OPEN, TaskStatus.IN_PROGRESS] },
      },
    }),
    prisma.task.count({
      where: {
        organizationId: session.currentOrganization.id,
        status: TaskStatus.DONE,
        completedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
  ]);

  return {
    open,
    inProgress,
    overdue,
    completedToday,
    total: open + inProgress,
  };
}

// ==================== Update Box Status Based on Tasks ====================

export async function updateBoxFromTaskCompletion(boxId: string): Promise<void> {
  const tasks = await prisma.task.findMany({
    where: {
      boxId,
      status: { notIn: [TaskStatus.CANCELLED] },
    },
  });

  const box = await prisma.box.findUnique({
    where: { id: boxId },
  });

  if (!box) return;

  // Update VAT doc status if VAT task is done
  const vatTask = tasks.find(t => t.taskType === TaskType.VAT_INVOICE);
  if (vatTask?.status === TaskStatus.DONE && box.vatDocStatus === "MISSING") {
    await prisma.box.update({
      where: { id: boxId },
      data: { vatDocStatus: "RECEIVED" },
    });
  }

  // Update WHT doc status if WHT task is done
  const whtTask = tasks.find(t => t.taskType === TaskType.WHT_CERTIFICATE);
  if (whtTask?.status === TaskStatus.DONE && box.whtDocStatus === "MISSING") {
    await prisma.box.update({
      where: { id: boxId },
      data: { whtDocStatus: "RECEIVED" },
    });
  }
}
