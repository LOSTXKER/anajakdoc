import { NextResponse } from "next/server";
import { generateDigest, getUsersForDigest } from "@/server/actions/digest";

// This endpoint is called by a cron job to send email digests
// You can configure this in vercel.json or your cron service

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Determine which digest to send based on time
    const now = new Date();
    const isWeekly = now.getDay() === 1; // Monday for weekly digest
    const frequency = isWeekly ? "WEEKLY" : "DAILY";

    // Get users who want this digest
    const users = await getUsersForDigest(frequency);

    let sent = 0;
    let errors = 0;

    for (const user of users) {
      try {
        // Generate digest for this user's organization
        const digest = await generateDigest(
          user.organizationId,
          frequency.toLowerCase() as "daily" | "weekly"
        );

        // TODO: Send email using your email service (Resend, SendGrid, etc.)
        // Example:
        // await sendEmail({
        //   to: user.email,
        //   subject: `[${digest.organizationName}] ${digest.period}`,
        //   html: generateDigestHtml(digest),
        // });

        console.log(`Digest sent to ${user.email}`);
        sent++;
      } catch (error) {
        console.error(`Error sending digest to ${user.email}:`, error);
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      frequency,
      sent,
      errors,
    });
  } catch (error) {
    console.error("Digest cron error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
