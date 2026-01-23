"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/server/auth";
import { revalidatePath } from "next/cache";

// Plan types matching Prisma schema
export type OrgPlan = "FREE" | "STARTER" | "BUSINESS" | "PRO" | "ENTERPRISE";
export type FirmPlan = "STARTER" | "PRO";

export interface SubscriptionStatus {
  plan: OrgPlan;
  billingEmail: string | null;
  usage: {
    docsUsed: number;
    docsLimit: number;
    membersUsed: number;
    membersLimit: number;
    storageUsed: number;
    storageLimit: number;
  };
}

const PLAN_LIMITS: Record<OrgPlan, { docs: number; users: number; storage: number }> = {
  FREE: { docs: 20, users: 1, storage: 1 },
  STARTER: { docs: -1, users: 3, storage: 10 },
  BUSINESS: { docs: -1, users: 10, storage: 50 },
  PRO: { docs: -1, users: 25, storage: 100 },
  ENTERPRISE: { docs: -1, users: -1, storage: -1 },
};

/**
 * Get current subscription status for the organization
 */
export async function getSubscriptionStatus(): Promise<{ 
  success: boolean; 
  data?: SubscriptionStatus; 
  error?: string 
}> {
  try {
    const session = await getSession();
    
    if (!session?.currentOrganization) {
      return { success: false, error: "No organization found" };
    }

    const org = await prisma.organization.findUnique({
      where: { id: session.currentOrganization.id },
      include: {
        members: true,
        boxes: {
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        },
      },
    });

    if (!org) {
      return { success: false, error: "Organization not found" };
    }

    const plan = (org.plan as OrgPlan) || "FREE";
    const limits = PLAN_LIMITS[plan];

    // TODO: Calculate actual storage usage from files
    const storageUsed = 0.3; // Placeholder

    return {
      success: true,
      data: {
        plan,
        billingEmail: org.billingEmail,
        usage: {
          docsUsed: org.boxes.length,
          docsLimit: limits.docs,
          membersUsed: org.members.length,
          membersLimit: limits.users,
          storageUsed,
          storageLimit: limits.storage,
        },
      },
    };
  } catch (error) {
    console.error("Error getting subscription status:", error);
    return { success: false, error: "Failed to get subscription status" };
  }
}

/**
 * Create a checkout session for plan upgrade
 * This is a placeholder - will integrate with payment gateway later
 */
export async function createCheckoutSession(plan: OrgPlan): Promise<{
  success: boolean;
  checkoutUrl?: string;
  error?: string;
}> {
  try {
    const session = await getSession();
    
    if (!session?.currentOrganization) {
      return { success: false, error: "No organization found" };
    }

    // TODO: Integrate with Stripe/Omise
    // For now, return a placeholder
    console.log(`Creating checkout session for plan: ${plan}`);

    return {
      success: true,
      checkoutUrl: `/checkout?plan=${plan}`,
    };
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return { success: false, error: "Failed to create checkout session" };
  }
}

/**
 * Update organization plan (after successful payment)
 * This should be called from webhook in production
 */
export async function updateOrganizationPlan(
  organizationId: string,
  plan: OrgPlan
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.organization.update({
      where: { id: organizationId },
      data: { plan },
    });

    revalidatePath("/settings/subscription");
    return { success: true };
  } catch (error) {
    console.error("Error updating organization plan:", error);
    return { success: false, error: "Failed to update plan" };
  }
}

/**
 * Update billing information
 */
export async function updateBillingInfo(data: {
  billingEmail?: string;
  companyName?: string;
  taxId?: string;
  address?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    
    if (!session?.currentOrganization) {
      return { success: false, error: "No organization found" };
    }

    await prisma.organization.update({
      where: { id: session.currentOrganization.id },
      data: {
        billingEmail: data.billingEmail,
        // Note: You may want to add these fields to the schema
        // companyName, taxId, address for billing
      },
    });

    revalidatePath("/settings/subscription");
    return { success: true };
  } catch (error) {
    console.error("Error updating billing info:", error);
    return { success: false, error: "Failed to update billing info" };
  }
}

/**
 * Cancel subscription (downgrade to FREE)
 * This is a placeholder - will integrate with payment gateway later
 */
export async function cancelSubscription(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();
    
    if (!session?.currentOrganization) {
      return { success: false, error: "No organization found" };
    }

    // TODO: Cancel subscription in payment gateway
    // For now, just downgrade to FREE at end of billing period

    console.log(`Cancelling subscription for org: ${session.currentOrganization.id}`);

    // In production, you'd schedule this for end of billing period
    // await prisma.organization.update({
    //   where: { id: session.currentOrganization.id },
    //   data: { plan: "FREE" },
    // });

    revalidatePath("/settings/subscription");
    return { success: true };
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return { success: false, error: "Failed to cancel subscription" };
  }
}

/**
 * Get billing history
 * This is a placeholder - will be populated when payment gateway is integrated
 */
export async function getBillingHistory(): Promise<{
  success: boolean;
  data?: Array<{
    id: string;
    date: Date;
    amount: number;
    status: "paid" | "pending" | "failed";
    description: string;
  }>;
  error?: string;
}> {
  try {
    const session = await getSession();
    
    if (!session?.currentOrganization) {
      return { success: false, error: "No organization found" };
    }

    // TODO: Fetch from payment gateway
    return {
      success: true,
      data: [], // Empty for now
    };
  } catch (error) {
    console.error("Error getting billing history:", error);
    return { success: false, error: "Failed to get billing history" };
  }
}
