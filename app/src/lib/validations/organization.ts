import { z } from "zod";
import { MemberRole } from ".prisma/client";

export const createOrganizationSchema = z.object({
  name: z.string().min(2, "ชื่อองค์กรต้องมีอย่างน้อย 2 ตัวอักษร"),
  slug: z
    .string()
    .min(2, "Slug ต้องมีอย่างน้อย 2 ตัวอักษร")
    .regex(/^[a-z0-9-]+$/, "Slug ต้องเป็นตัวพิมพ์เล็ก ตัวเลข หรือ - เท่านั้น")
    .optional()
    .or(z.literal("")),
  taxId: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email("อีเมลไม่ถูกต้อง").optional().or(z.literal("")),
});

export const updateOrganizationSchema = createOrganizationSchema.partial();

export const inviteMemberSchema = z.object({
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  role: z.nativeEnum(MemberRole).default(MemberRole.STAFF),
});

export const updateMemberRoleSchema = z.object({
  memberId: z.string(),
  role: z.nativeEnum(MemberRole),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
