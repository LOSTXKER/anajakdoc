"use server";

import prisma from "@/lib/prisma";
import { requireAuth } from "@/server/auth";
import { createOrganizationSchema, inviteMemberSchema } from "@/lib/validations/organization";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ApiResponse } from "@/types";
import { MemberRole } from ".prisma/client";

function generateSlug(name: string): string {
  // Try to create slug from name
  const slug = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
  
  // If slug is empty (e.g., Thai-only name), generate random slug
  if (!slug || slug.length < 2) {
    return `org-${Date.now().toString(36)}`;
  }
  
  return slug;
}

async function generateUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const existing = await prisma.organization.findUnique({
      where: { slug },
    });
    
    if (!existing) {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

export async function createOrganization(_prevState: { error: string | null; success: boolean }, formData: FormData): Promise<{ error: string | null; success: boolean }> {
  const session = await requireAuth();
  
  const name = formData.get("name") as string;
  const rawData = {
    name,
    slug: (formData.get("slug") as string) || generateSlug(name),
    taxId: formData.get("taxId") as string || undefined,
    address: formData.get("address") as string || undefined,
    phone: formData.get("phone") as string || undefined,
    email: formData.get("email") as string || undefined,
  };

  const result = createOrganizationSchema.safeParse(rawData);
  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0].message,
    };
  }

  try {
    // Generate unique slug
    const baseSlug = result.data.slug || generateSlug(result.data.name);
    const slug = await generateUniqueSlug(baseSlug);

  // Create organization with owner membership
  const organization = await prisma.organization.create({
    data: {
      name: result.data.name,
      slug,
      taxId: result.data.taxId,
      address: result.data.address,
      phone: result.data.phone,
      email: result.data.email,
      members: {
        create: {
          userId: session.id,
          role: MemberRole.OWNER,
          joinedAt: new Date(),
        },
      },
    },
  });

  // Create default categories
  await prisma.category.createMany({
    data: [
      { organizationId: organization.id, code: "OFC", name: "ค่าใช้จ่ายสำนักงาน", categoryType: "EXPENSE" },
      { organizationId: organization.id, code: "TRV", name: "ค่าเดินทาง", categoryType: "EXPENSE" },
      { organizationId: organization.id, code: "MTG", name: "ค่าประชุม/สัมมนา", categoryType: "EXPENSE" },
      { organizationId: organization.id, code: "UTL", name: "ค่าสาธารณูปโภค", categoryType: "EXPENSE" },
      { organizationId: organization.id, code: "MKT", name: "ค่าการตลาด", categoryType: "EXPENSE" },
      { organizationId: organization.id, code: "SAL", name: "รายได้จากการขาย", categoryType: "INCOME" },
      { organizationId: organization.id, code: "SVC", name: "รายได้จากบริการ", categoryType: "INCOME" },
    ],
  });

  // Create default cost center
  await prisma.costCenter.create({
    data: {
      organizationId: organization.id,
      code: "HQ",
      name: "สำนักงานใหญ่",
    },
  });

    return { success: true, error: null };
  } catch (error) {
    console.error("Error creating organization:", error);
    return { success: false, error: "เกิดข้อผิดพลาดในการสร้างองค์กร" };
  }
}

export async function getOrganizations() {
  const session = await requireAuth();
  
  const memberships = await prisma.organizationMember.findMany({
    where: {
      userId: session.id,
      isActive: true,
    },
    include: {
      organization: true,
    },
    orderBy: {
      organization: {
        name: "asc",
      },
    },
  });

  return memberships.map((m) => ({
    ...m.organization,
    role: m.role,
  }));
}

export async function getOrganization(orgId: string) {
  const session = await requireAuth();
  
  const membership = await prisma.organizationMember.findFirst({
    where: {
      organizationId: orgId,
      userId: session.id,
      isActive: true,
    },
    include: {
      organization: {
        include: {
          members: {
            where: { isActive: true },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!membership) {
    return null;
  }

  return {
    ...membership.organization,
    currentUserRole: membership.role,
  };
}

export async function inviteMember(orgId: string, formData: FormData): Promise<ApiResponse> {
  const session = await requireAuth();
  
  // Check if user has permission
  const membership = await prisma.organizationMember.findFirst({
    where: {
      organizationId: orgId,
      userId: session.id,
      role: { in: [MemberRole.OWNER, MemberRole.ADMIN] },
      isActive: true,
    },
  });

  if (!membership) {
    return {
      success: false,
      error: "คุณไม่มีสิทธิ์เชิญสมาชิก",
    };
  }

  const rawData = {
    email: formData.get("email") as string,
    role: formData.get("role") as MemberRole || MemberRole.STAFF,
  };

  const result = inviteMemberSchema.safeParse(rawData);
  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0].message,
    };
  }

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: result.data.email },
  });

  if (!user) {
    return {
      success: false,
      error: "ไม่พบผู้ใช้งานที่มีอีเมลนี้",
    };
  }

  // Check if already a member
  const existingMember = await prisma.organizationMember.findFirst({
    where: {
      organizationId: orgId,
      userId: user.id,
    },
  });

  if (existingMember) {
    if (existingMember.isActive) {
      return {
        success: false,
        error: "ผู้ใช้นี้เป็นสมาชิกอยู่แล้ว",
      };
    }
    
    // Reactivate membership
    await prisma.organizationMember.update({
      where: { id: existingMember.id },
      data: {
        isActive: true,
        role: result.data.role,
        joinedAt: new Date(),
      },
    });
  } else {
    // Create new membership
    await prisma.organizationMember.create({
      data: {
        organizationId: orgId,
        userId: user.id,
        role: result.data.role,
        joinedAt: new Date(),
      },
    });
  }

  revalidatePath(`/settings/members`);
  
  return {
    success: true,
    message: "เพิ่มสมาชิกเรียบร้อยแล้ว",
  };
}

export async function removeMember(orgId: string, memberId: string): Promise<ApiResponse> {
  const session = await requireAuth();
  
  // Check if user has permission
  const membership = await prisma.organizationMember.findFirst({
    where: {
      organizationId: orgId,
      userId: session.id,
      role: { in: [MemberRole.OWNER, MemberRole.ADMIN] },
      isActive: true,
    },
  });

  if (!membership) {
    return {
      success: false,
      error: "คุณไม่มีสิทธิ์ลบสมาชิก",
    };
  }

  const targetMember = await prisma.organizationMember.findUnique({
    where: { id: memberId },
  });

  if (!targetMember || targetMember.organizationId !== orgId) {
    return {
      success: false,
      error: "ไม่พบสมาชิก",
    };
  }

  if (targetMember.role === MemberRole.OWNER) {
    return {
      success: false,
      error: "ไม่สามารถลบเจ้าขององค์กรได้",
    };
  }

  await prisma.organizationMember.update({
    where: { id: memberId },
    data: { isActive: false },
  });

  revalidatePath(`/settings/members`);
  
  return {
    success: true,
    message: "ลบสมาชิกเรียบร้อยแล้ว",
  };
}
