import { NextRequest, NextResponse } from "next/server";
import { processReminders, processWhtOverdue } from "@/server/actions/reminder";

// Vercel Cron Job configuration
// Add to vercel.json:
// {
//   "crons": [
//     {
//       "path": "/api/cron/reminders",
//       "schedule": "0 9 * * *"
//     }
//   ]
// }

// Security: Verify cron secret or Vercel cron header
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get("authorization");
  const cronHeader = request.headers.get("x-vercel-cron");

  // Allow if:
  // 1. Vercel cron job (has x-vercel-cron header)
  // 2. Valid CRON_SECRET in authorization header
  // 3. In development mode
  const isDev = process.env.NODE_ENV === "development";
  const isVercelCron = cronHeader === "1";
  const hasValidSecret = CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`;

  if (!isDev && !isVercelCron && !hasValidSecret) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // Process reminders and WHT overdue in parallel
    const [remindersResult, whtResult] = await Promise.all([
      processReminders(),
      processWhtOverdue(),
    ]);

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      reminders: remindersResult.success ? remindersResult.data : null,
      whtOverdue: whtResult.success ? whtResult.data : null,
    };

    console.log("[CRON] Reminders processed:", response);

    return NextResponse.json(response);
  } catch (error) {
    console.error("[CRON] Error processing reminders:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to process reminders",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Also allow POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
