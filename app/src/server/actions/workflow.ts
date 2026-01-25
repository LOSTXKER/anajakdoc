"use server";

/**
 * Approval Workflow Actions
 * 
 * Features:
 * - CRUD for approval workflows
 * - Workflow step management
 */

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import { revalidatePath } from "next/cache";
import type { ApproverType } from "@prisma/client";
import type { ApiResponse } from "@/types";

// ============================================
// TYPES
// ============================================

export interface WorkflowStepData {
  id?: string;
  order: number;
  name: string;
  approverType: ApproverType;
  approverValue?: string | null;
  autoApprove: boolean;
  threshold?: number | null;
}

export interface WorkflowData {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  isActive: boolean;
  steps: WorkflowStepData[];
  createdAt: string;
}

// ============================================
// GET WORKFLOWS
// ============================================

export async function getWorkflows(): Promise<ApiResponse<WorkflowData[]>> {
  const session = await requireOrganization();

  const workflows = await prisma.approvalWorkflow.findMany({
    where: { organizationId: session.currentOrganization.id },
    include: {
      steps: {
        orderBy: { order: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    success: true,
    data: workflows.map((w) => ({
      id: w.id,
      name: w.name,
      description: w.description,
      isDefault: w.isDefault,
      isActive: w.isActive,
      steps: w.steps.map((s) => ({
        id: s.id,
        order: s.order,
        name: s.name,
        approverType: s.approverType,
        approverValue: s.approverValue,
        autoApprove: s.autoApprove,
        threshold: s.threshold ? Number(s.threshold) : null,
      })),
      createdAt: w.createdAt.toISOString(),
    })),
  };
}

export async function getWorkflow(id: string): Promise<ApiResponse<WorkflowData>> {
  const session = await requireOrganization();

  const workflow = await prisma.approvalWorkflow.findFirst({
    where: {
      id,
      organizationId: session.currentOrganization.id,
    },
    include: {
      steps: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!workflow) {
    return { success: false, error: "ไม่พบ Workflow" };
  }

  return {
    success: true,
    data: {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      isDefault: workflow.isDefault,
      isActive: workflow.isActive,
      steps: workflow.steps.map((s) => ({
        id: s.id,
        order: s.order,
        name: s.name,
        approverType: s.approverType,
        approverValue: s.approverValue,
        autoApprove: s.autoApprove,
        threshold: s.threshold ? Number(s.threshold) : null,
      })),
      createdAt: workflow.createdAt.toISOString(),
    },
  };
}

// ============================================
// CREATE WORKFLOW
// ============================================

export async function createWorkflow(data: {
  name: string;
  description?: string;
  isDefault?: boolean;
  steps: WorkflowStepData[];
}): Promise<ApiResponse<{ id: string }>> {
  const session = await requireOrganization();

  // Validate
  if (!data.name) {
    return { success: false, error: "กรุณากรอกชื่อ Workflow" };
  }

  if (data.steps.length === 0) {
    return { success: false, error: "กรุณาเพิ่มอย่างน้อย 1 ขั้นตอน" };
  }

  // If setting as default, unset other defaults
  if (data.isDefault) {
    await prisma.approvalWorkflow.updateMany({
      where: {
        organizationId: session.currentOrganization.id,
        isDefault: true,
      },
      data: { isDefault: false },
    });
  }

  const workflow = await prisma.approvalWorkflow.create({
    data: {
      organizationId: session.currentOrganization.id,
      name: data.name,
      description: data.description,
      isDefault: data.isDefault ?? false,
      steps: {
        create: data.steps.map((s, i) => ({
          order: i + 1,
          name: s.name,
          approverType: s.approverType,
          approverValue: s.approverValue,
          autoApprove: s.autoApprove,
          threshold: s.threshold,
        })),
      },
    },
  });

  revalidatePath("/settings/workflows");
  return { success: true, data: { id: workflow.id } };
}

// ============================================
// UPDATE WORKFLOW
// ============================================

export async function updateWorkflow(
  id: string,
  data: {
    name?: string;
    description?: string;
    isDefault?: boolean;
    isActive?: boolean;
    steps?: WorkflowStepData[];
  }
): Promise<ApiResponse> {
  const session = await requireOrganization();

  const workflow = await prisma.approvalWorkflow.findFirst({
    where: {
      id,
      organizationId: session.currentOrganization.id,
    },
  });

  if (!workflow) {
    return { success: false, error: "ไม่พบ Workflow" };
  }

  // If setting as default, unset other defaults
  if (data.isDefault) {
    await prisma.approvalWorkflow.updateMany({
      where: {
        organizationId: session.currentOrganization.id,
        isDefault: true,
        id: { not: id },
      },
      data: { isDefault: false },
    });
  }

  // Update workflow
  await prisma.approvalWorkflow.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      isDefault: data.isDefault,
      isActive: data.isActive,
    },
  });

  // Update steps if provided
  if (data.steps) {
    // Delete existing steps
    await prisma.approvalStep.deleteMany({
      where: { workflowId: id },
    });

    // Create new steps
    await prisma.approvalStep.createMany({
      data: data.steps.map((s, i) => ({
        workflowId: id,
        order: i + 1,
        name: s.name,
        approverType: s.approverType,
        approverValue: s.approverValue,
        autoApprove: s.autoApprove,
        threshold: s.threshold,
      })),
    });
  }

  revalidatePath("/settings/workflows");
  return { success: true, data: undefined };
}

// ============================================
// DELETE WORKFLOW
// ============================================

export async function deleteWorkflow(id: string): Promise<ApiResponse> {
  const session = await requireOrganization();

  const workflow = await prisma.approvalWorkflow.findFirst({
    where: {
      id,
      organizationId: session.currentOrganization.id,
    },
    include: {
      _count: {
        select: { boxes: true },
      },
    },
  });

  if (!workflow) {
    return { success: false, error: "ไม่พบ Workflow" };
  }

  // Check if workflow is in use
  if (workflow._count.boxes > 0) {
    return {
      success: false,
      error: `ไม่สามารถลบได้ เนื่องจากมีกล่องเอกสาร ${workflow._count.boxes} กล่องใช้ Workflow นี้อยู่`,
    };
  }

  await prisma.approvalWorkflow.delete({
    where: { id },
  });

  revalidatePath("/settings/workflows");
  return { success: true, data: undefined };
}

// ============================================
// GET DEFAULT WORKFLOW
// ============================================

export async function getDefaultWorkflow(): Promise<ApiResponse<WorkflowData | null>> {
  const session = await requireOrganization();

  const workflow = await prisma.approvalWorkflow.findFirst({
    where: {
      organizationId: session.currentOrganization.id,
      isDefault: true,
      isActive: true,
    },
    include: {
      steps: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!workflow) {
    return { success: true, data: null };
  }

  return {
    success: true,
    data: {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      isDefault: workflow.isDefault,
      isActive: workflow.isActive,
      steps: workflow.steps.map((s) => ({
        id: s.id,
        order: s.order,
        name: s.name,
        approverType: s.approverType,
        approverValue: s.approverValue,
        autoApprove: s.autoApprove,
        threshold: s.threshold ? Number(s.threshold) : null,
      })),
      createdAt: workflow.createdAt.toISOString(),
    },
  };
}
