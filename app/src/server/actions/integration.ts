"use server";

/**
 * Integration Actions (Section 7 & Phase 3)
 * 
 * Features:
 * - LINE OA / LINE Notify
 * - Slack / Discord webhooks
 * - Custom HTTP webhooks
 * - Event-based triggers
 */

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import { revalidatePath } from "next/cache";
import type { NotificationType, IntegrationType } from "@prisma/client";

type ApiResponse<T = void> = { success: true; data: T } | { success: false; error: string };

// ============================================
// Integration CRUD
// ============================================

export type IntegrationData = {
  id: string;
  type: IntegrationType;
  name: string;
  isActive: boolean;
  events: NotificationType[];
  lastTriggeredAt: string | null;
  triggerCount: number;
  createdAt: string;
};

/**
 * Get all integrations for the organization
 */
export async function getIntegrations(): Promise<ApiResponse<IntegrationData[]>> {
  const session = await requireOrganization();

  const integrations = await prisma.integration.findMany({
    where: { organizationId: session.currentOrganization.id },
    orderBy: { createdAt: "desc" },
  });

  return {
    success: true,
    data: integrations.map((i) => ({
      id: i.id,
      type: i.type,
      name: i.name,
      isActive: i.isActive,
      events: i.events,
      lastTriggeredAt: i.lastTriggeredAt?.toISOString() ?? null,
      triggerCount: i.triggerCount,
      createdAt: i.createdAt.toISOString(),
    })),
  };
}

/**
 * Create a new integration
 */
export async function createIntegration(data: {
  type: IntegrationType;
  name: string;
  config: Record<string, unknown>;
  events: NotificationType[];
}): Promise<ApiResponse<{ id: string }>> {
  const session = await requireOrganization();

  // Validate config based on type
  const requiredFields: Record<IntegrationType, string[]> = {
    LINE_OA: ["channelAccessToken", "userId"],
    LINE_NOTIFY: ["accessToken"],
    SLACK: ["webhookUrl"],
    DISCORD: ["webhookUrl"],
    CUSTOM_WEBHOOK: ["url", "method"],
    EMAIL: ["to"],
  };

  const required = requiredFields[data.type] || [];
  for (const field of required) {
    if (!data.config[field]) {
      return { success: false, error: `กรุณากรอก ${field}` };
    }
  }

  const integration = await prisma.integration.create({
    data: {
      organizationId: session.currentOrganization.id,
      type: data.type,
      name: data.name,
      config: JSON.parse(JSON.stringify(data.config)),
      events: data.events,
    },
  });

  revalidatePath("/settings/integrations");
  return { success: true, data: { id: integration.id } };
}

/**
 * Update an integration
 */
export async function updateIntegration(
  id: string,
  data: {
    name?: string;
    isActive?: boolean;
    config?: Record<string, unknown>;
    events?: NotificationType[];
  }
): Promise<ApiResponse<void | undefined>> {
  const session = await requireOrganization();

  const integration = await prisma.integration.findFirst({
    where: {
      id,
      organizationId: session.currentOrganization.id,
    },
  });

  if (!integration) {
    return { success: false, error: "ไม่พบ Integration" };
  }

  await prisma.integration.update({
    where: { id },
    data: {
      name: data.name,
      isActive: data.isActive,
      config: data.config ? JSON.parse(JSON.stringify(data.config)) : undefined,
      events: data.events,
    },
  });

  revalidatePath("/settings/integrations");
  return { success: true, data: undefined };
}

/**
 * Delete an integration
 */
export async function deleteIntegration(id: string): Promise<ApiResponse<void | undefined>> {
  const session = await requireOrganization();

  const integration = await prisma.integration.findFirst({
    where: {
      id,
      organizationId: session.currentOrganization.id,
    },
  });

  if (!integration) {
    return { success: false, error: "ไม่พบ Integration" };
  }

  await prisma.integration.delete({ where: { id } });

  revalidatePath("/settings/integrations");
  return { success: true, data: undefined };
}

/**
 * Test an integration (send test message)
 */
export async function testIntegration(id: string): Promise<ApiResponse<void | undefined>> {
  const session = await requireOrganization();

  const integration = await prisma.integration.findFirst({
    where: {
      id,
      organizationId: session.currentOrganization.id,
    },
  });

  if (!integration) {
    return { success: false, error: "ไม่พบ Integration" };
  }

  // Send test notification
  const result = await sendWebhook(integration.id, "BOX_SUBMITTED", {
    type: "TEST",
    title: "ทดสอบการเชื่อมต่อ",
    message: `ทดสอบจาก ${session.currentOrganization.name}`,
    timestamp: new Date().toISOString(),
  });

  if (!result.success) {
    return { success: false, error: result.error || "Unknown error" };
  }

  return { success: true, data: undefined };
}

// ============================================
// Webhook Trigger
// ============================================

/**
 * Trigger all integrations for a specific event
 */
export async function triggerEvent(
  organizationId: string,
  eventType: NotificationType,
  payload: Record<string, unknown>
): Promise<void> {
  // Find all active integrations that subscribe to this event
  const integrations = await prisma.integration.findMany({
    where: {
      organizationId,
      isActive: true,
      events: { has: eventType },
    },
  });

  // Trigger each integration
  await Promise.allSettled(
    integrations.map((integration) =>
      sendWebhook(integration.id, eventType, {
        ...payload,
        timestamp: new Date().toISOString(),
      })
    )
  );
}

/**
 * Send webhook to a specific integration
 */
async function sendWebhook(
  integrationId: string,
  eventType: NotificationType,
  payload: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const integration = await prisma.integration.findUnique({
    where: { id: integrationId },
  });

  if (!integration) {
    return { success: false, error: "Integration not found" };
  }

  const config = integration.config as Record<string, unknown>;
  let response: Response | null = null;
  let errorMessage: string | null = null;

  try {
    switch (integration.type) {
      case "LINE_NOTIFY": {
        response = await fetch("https://notify-api.line.me/api/notify", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Bearer ${config.accessToken}`,
          },
          body: new URLSearchParams({
            message: formatMessage(payload),
          }),
        });
        break;
      }

      case "SLACK":
      case "DISCORD": {
        const webhookUrl = config.webhookUrl as string;
        response = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: formatMessage(payload),
            // Discord uses "content" instead of "text"
            content: integration.type === "DISCORD" ? formatMessage(payload) : undefined,
          }),
        });
        break;
      }

      case "CUSTOM_WEBHOOK": {
        const url = config.url as string;
        const method = (config.method as string) || "POST";
        const headers = (config.headers as Record<string, string>) || {};

        response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          body: JSON.stringify(payload),
        });
        break;
      }

      case "LINE_OA": {
        // LINE OA uses push message API
        response = await fetch("https://api.line.me/v2/bot/message/push", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.channelAccessToken}`,
          },
          body: JSON.stringify({
            to: config.userId,
            messages: [
              {
                type: "text",
                text: formatMessage(payload),
              },
            ],
          }),
        });
        break;
      }

      default:
        return { success: false, error: "Unsupported integration type" };
    }

    // Log the webhook
    await prisma.webhookLog.create({
      data: {
        integrationId,
        eventType,
        payload: JSON.parse(JSON.stringify(payload)),
        status: response.ok ? "success" : "failed",
        responseCode: response.status,
        responseBody: await response.text().catch(() => null),
      },
    });

    // Update integration stats
    await prisma.integration.update({
      where: { id: integrationId },
      data: {
        lastTriggeredAt: new Date(),
        triggerCount: { increment: 1 },
      },
    });

    return { success: response.ok };
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Log the error
    await prisma.webhookLog.create({
      data: {
        integrationId,
        eventType,
        payload: JSON.parse(JSON.stringify(payload)),
        status: "failed",
        errorMessage,
      },
    });

    return { success: false, error: errorMessage };
  }
}

/**
 * Format payload into a readable message
 */
function formatMessage(payload: Record<string, unknown>): string {
  const { type, title, message, boxNumber, contactName, amount } = payload;

  let text = "";

  if (title) {
    text += `📋 ${title}\n`;
  }

  if (message) {
    text += `${message}\n`;
  }

  if (boxNumber) {
    text += `เลขที่: ${boxNumber}\n`;
  }

  if (contactName) {
    text += `คู่ค้า: ${contactName}\n`;
  }

  if (amount) {
    text += `ยอดเงิน: ฿${Number(amount).toLocaleString()}\n`;
  }

  // Default fallback
  if (!text) {
    text = `[${type}] ${JSON.stringify(payload)}`;
  }

  return text.trim();
}
