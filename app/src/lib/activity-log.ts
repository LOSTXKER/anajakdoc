"use server";

import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * Log box activity
 * Replaces 44+ identical activity log creation patterns
 */
export async function logBoxActivity(
  boxId: string,
  userId: string,
  action: string,
  details?: Prisma.InputJsonValue
): Promise<void> {
  await prisma.activityLog.create({
    data: {
      boxId,
      userId,
      action,
      details: details ?? Prisma.JsonNull,
    },
  });
}

/**
 * Log box activity within a transaction
 * For use with prisma.$transaction
 */
export async function logActivityInTransaction(
  tx: Prisma.TransactionClient,
  boxId: string,
  userId: string,
  action: string,
  details?: Prisma.InputJsonValue
): Promise<void> {
  await tx.activityLog.create({
    data: {
      boxId,
      userId,
      action,
      details: details ?? Prisma.JsonNull,
    },
  });
}

/**
 * Log multiple activities in batch
 * For bulk operations
 */
export async function logBulkActivity(
  activities: Array<{
    boxId: string;
    userId: string;
    action: string;
    details?: Prisma.InputJsonValue;
  }>
): Promise<void> {
  await prisma.activityLog.createMany({
    data: activities.map(({ boxId, userId, action, details }) => ({
      boxId,
      userId,
      action,
      details: details ?? Prisma.JsonNull,
    })),
  });
}

/**
 * Log activity with IP address tracking
 */
export async function logBoxActivityWithIP(
  boxId: string,
  userId: string,
  action: string,
  ipAddress: string,
  details?: Prisma.InputJsonValue
): Promise<void> {
  await prisma.activityLog.create({
    data: {
      boxId,
      userId,
      action,
      ipAddress,
      details: details ?? Prisma.JsonNull,
    },
  });
}
