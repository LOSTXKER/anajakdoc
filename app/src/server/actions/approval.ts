"use server";

/**
 * Box Approval Actions
 * 
 * Features:
 * - Approve/Reject box at current step
 * - Get approval status
 * - Initialize workflow for a box
 */

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import { createNotification } from "./notification";
import { revalidatePath } from "next/cache";
import type { ApprovalStatus } from "@prisma/client";

type ApiResponse<T = void> = { success: true; data: T } | { success: false; error: string };

// ============================================
// TYPES
// ============================================

export interface BoxApprovalData {
  id: string;
  stepId: string;
  stepName: string;
  stepOrder: number;
  status: ApprovalStatus;
  approverName: string | null;
  approverEmail: string | null;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BoxApprovalStatus {
  workflowId: string | null;
  workflowName: string | null;
  currentStep: number;
  totalSteps: number;
  isFullyApproved: boolean;
  isRejected: boolean;
  approvals: BoxApprovalData[];
  canApprove: boolean;
  currentApproval: BoxApprovalData | null;
}

// ============================================
// GET BOX APPROVAL STATUS
// ============================================

export async function getBoxApprovalStatus(boxId: string): Promise<ApiResponse<BoxApprovalStatus>> {
  const session = await requireOrganization();

  const box = await prisma.box.findFirst({
    where: {
      id: boxId,
      organizationId: session.currentOrganization.id,
    },
    include: {
      workflow: {
        include: {
          steps: {
            orderBy: { order: "asc" },
          },
        },
      },
      approvals: {
        include: {
          step: true,
          approver: {
            select: { name: true, email: true },
          },
        },
        orderBy: { step: { order: "asc" } },
      },
    },
  });

  if (!box) {
    return { success: false, error: "ไม่พบกล่องเอกสาร" };
  }

  if (!box.workflow) {
    return {
      success: true,
      data: {
        workflowId: null,
        workflowName: null,
        currentStep: 0,
        totalSteps: 0,
        isFullyApproved: false,
        isRejected: false,
        approvals: [],
        canApprove: false,
        currentApproval: null,
      },
    };
  }

  const approvalMap = new Map(box.approvals.map((a) => [a.stepId, a]));
  const totalSteps = box.workflow.steps.length;

  // Find current step (first pending or rejected)
  let currentStep = 0;
  let isFullyApproved = true;
  let isRejected = false;

  for (const step of box.workflow.steps) {
    const approval = approvalMap.get(step.id);
    if (!approval || approval.status === "PENDING") {
      currentStep = step.order;
      isFullyApproved = false;
      break;
    }
    if (approval.status === "REJECTED") {
      currentStep = step.order;
      isFullyApproved = false;
      isRejected = true;
      break;
    }
  }

  if (isFullyApproved) {
    currentStep = totalSteps;
  }

  // Check if current user can approve at current step
  let canApprove = false;
  let currentApproval: BoxApprovalData | null = null;

  if (!isFullyApproved && !isRejected) {
    const currentStepData = box.workflow.steps.find((s) => s.order === currentStep);
    if (currentStepData) {
      const approval = approvalMap.get(currentStepData.id);
      if (approval && approval.status === "PENDING") {
        currentApproval = {
          id: approval.id,
          stepId: approval.stepId,
          stepName: currentStepData.name,
          stepOrder: currentStepData.order,
          status: approval.status,
          approverName: approval.approver?.name || null,
          approverEmail: approval.approver?.email || null,
          comment: approval.comment,
          createdAt: approval.createdAt.toISOString(),
          updatedAt: approval.updatedAt.toISOString(),
        };

        // Check if user can approve based on approver type
        switch (currentStepData.approverType) {
          case "ANY":
            canApprove = true;
            break;
          case "ROLE":
            canApprove = session.currentOrganization.role === currentStepData.approverValue;
            break;
          case "USER":
            canApprove = session.id === currentStepData.approverValue;
            break;
        }
      }
    }
  }

  return {
    success: true,
    data: {
      workflowId: box.workflow.id,
      workflowName: box.workflow.name,
      currentStep,
      totalSteps,
      isFullyApproved,
      isRejected,
      approvals: box.approvals.map((a) => ({
        id: a.id,
        stepId: a.stepId,
        stepName: a.step.name,
        stepOrder: a.step.order,
        status: a.status,
        approverName: a.approver?.name || null,
        approverEmail: a.approver?.email || null,
        comment: a.comment,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      })),
      canApprove,
      currentApproval,
    },
  };
}

// ============================================
// INITIALIZE WORKFLOW FOR BOX
// ============================================

export async function initializeBoxWorkflow(
  boxId: string,
  workflowId: string
): Promise<ApiResponse> {
  const session = await requireOrganization();

  const [box, workflow] = await Promise.all([
    prisma.box.findFirst({
      where: {
        id: boxId,
        organizationId: session.currentOrganization.id,
      },
    }),
    prisma.approvalWorkflow.findFirst({
      where: {
        id: workflowId,
        organizationId: session.currentOrganization.id,
        isActive: true,
      },
      include: {
        steps: {
          orderBy: { order: "asc" },
        },
      },
    }),
  ]);

  if (!box) {
    return { success: false, error: "ไม่พบกล่องเอกสาร" };
  }

  if (!workflow) {
    return { success: false, error: "ไม่พบ Workflow หรือ Workflow ไม่ active" };
  }

  // Create approval records for each step
  await prisma.$transaction([
    // Update box with workflow
    prisma.box.update({
      where: { id: boxId },
      data: { workflowId },
    }),
    // Create pending approvals for each step
    prisma.boxApproval.createMany({
      data: workflow.steps.map((step) => ({
        boxId,
        stepId: step.id,
        status: "PENDING" as ApprovalStatus,
      })),
    }),
  ]);

  // Check for auto-approve on first step
  const firstStep = workflow.steps[0];
  if (firstStep?.autoApprove && firstStep.threshold) {
    const boxAmount = Number(box.totalAmount);
    if (boxAmount < Number(firstStep.threshold)) {
      // Auto-approve first step
      await prisma.boxApproval.updateMany({
        where: {
          boxId,
          stepId: firstStep.id,
        },
        data: {
          status: "APPROVED",
          comment: `อนุมัติอัตโนมัติ (ยอด ${boxAmount} < ${firstStep.threshold})`,
        },
      });
    }
  }

  revalidatePath(`/documents/${boxId}`);
  return { success: true, data: undefined };
}

// ============================================
// APPROVE BOX
// ============================================

export async function approveBox(
  boxId: string,
  comment?: string
): Promise<ApiResponse> {
  const session = await requireOrganization();

  const statusResult = await getBoxApprovalStatus(boxId);
  if (!statusResult.success) {
    return statusResult;
  }

  const status = statusResult.data;

  if (!status.canApprove || !status.currentApproval) {
    return { success: false, error: "คุณไม่สามารถอนุมัติขั้นตอนนี้ได้" };
  }

  // Update approval
  await prisma.boxApproval.update({
    where: { id: status.currentApproval.id },
    data: {
      status: "APPROVED",
      approvedBy: session.id,
      comment,
    },
  });

  // Check if there are more steps
  if (status.currentStep < status.totalSteps) {
    // Check next step for auto-approve
    const box = await prisma.box.findUnique({
      where: { id: boxId },
      include: {
        workflow: {
          include: {
            steps: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    const nextStep = box?.workflow?.steps.find((s) => s.order === status.currentStep + 1);
    if (nextStep?.autoApprove && nextStep.threshold) {
      const boxAmount = Number(box?.totalAmount || 0);
      if (boxAmount < Number(nextStep.threshold)) {
        await prisma.boxApproval.updateMany({
          where: {
            boxId,
            stepId: nextStep.id,
          },
          data: {
            status: "APPROVED",
            comment: `อนุมัติอัตโนมัติ (ยอด ${boxAmount} < ${nextStep.threshold})`,
          },
        });
      }
    }
  }

  // Notify box creator
  const box = await prisma.box.findUnique({
    where: { id: boxId },
    select: { createdById: true, boxNumber: true },
  });

  if (box && box.createdById !== session.id) {
    await createNotification(
      session.currentOrganization.id,
      box.createdById,
      "BOX_IN_REVIEW",
      "กล่องเอกสารได้รับการอนุมัติ",
      `กล่อง ${box.boxNumber} ผ่านการอนุมัติขั้นตอนที่ ${status.currentStep}`,
      { boxId, boxNumber: box.boxNumber }
    );
  }

  // Create activity log
  await prisma.activityLog.create({
    data: {
      boxId,
      userId: session.id,
      action: "APPROVED",
      details: {
        step: status.currentStep,
        stepName: status.currentApproval.stepName,
        comment,
      },
    },
  });

  revalidatePath(`/documents/${boxId}`);
  return { success: true, data: undefined };
}

// ============================================
// REJECT BOX
// ============================================

export async function rejectBox(
  boxId: string,
  comment: string
): Promise<ApiResponse> {
  const session = await requireOrganization();

  if (!comment) {
    return { success: false, error: "กรุณาระบุเหตุผลในการปฏิเสธ" };
  }

  const statusResult = await getBoxApprovalStatus(boxId);
  if (!statusResult.success) {
    return statusResult;
  }

  const status = statusResult.data;

  if (!status.canApprove || !status.currentApproval) {
    return { success: false, error: "คุณไม่สามารถปฏิเสธขั้นตอนนี้ได้" };
  }

  // Update approval
  await prisma.boxApproval.update({
    where: { id: status.currentApproval.id },
    data: {
      status: "REJECTED",
      approvedBy: session.id,
      comment,
    },
  });

  // Notify box creator
  const box = await prisma.box.findUnique({
    where: { id: boxId },
    select: { createdById: true, boxNumber: true },
  });

  if (box) {
    await createNotification(
      session.currentOrganization.id,
      box.createdById,
      "BOX_NEED_MORE_DOCS",
      "กล่องเอกสารถูกปฏิเสธ",
      `กล่อง ${box.boxNumber} ถูกปฏิเสธ: ${comment}`,
      { boxId, boxNumber: box.boxNumber }
    );
  }

  // Create activity log
  await prisma.activityLog.create({
    data: {
      boxId,
      userId: session.id,
      action: "REJECTED",
      details: {
        step: status.currentStep,
        stepName: status.currentApproval.stepName,
        comment,
      },
    },
  });

  revalidatePath(`/documents/${boxId}`);
  return { success: true, data: undefined };
}

// ============================================
// RESET BOX APPROVAL (for re-submission)
// ============================================

export async function resetBoxApproval(boxId: string): Promise<ApiResponse> {
  const session = await requireOrganization();

  const box = await prisma.box.findFirst({
    where: {
      id: boxId,
      organizationId: session.currentOrganization.id,
    },
    include: {
      approvals: true,
    },
  });

  if (!box) {
    return { success: false, error: "ไม่พบกล่องเอกสาร" };
  }

  // Only creator or admin can reset
  const isAdmin = ["ADMIN", "OWNER"].includes(session.currentOrganization.role);
  if (box.createdById !== session.id && !isAdmin) {
    return { success: false, error: "คุณไม่มีสิทธิ์รีเซ็ต Approval" };
  }

  // Reset all approvals to pending
  await prisma.boxApproval.updateMany({
    where: { boxId },
    data: {
      status: "PENDING",
      approvedBy: null,
      comment: null,
    },
  });

  // Create activity log
  await prisma.activityLog.create({
    data: {
      boxId,
      userId: session.id,
      action: "STATUS_CHANGED",
      details: {
        action: "APPROVAL_RESET",
        reason: "รีเซ็ต Approval เพื่อส่งใหม่",
      },
    },
  });

  revalidatePath(`/documents/${boxId}`);
  return { success: true, data: undefined };
}
