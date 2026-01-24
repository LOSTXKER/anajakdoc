import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

// Only allow in development
const isDev = process.env.NODE_ENV === "development";

export async function POST(request: NextRequest) {
  if (!isDev) {
    return NextResponse.json({ success: false, error: "Not allowed in production" }, { status: 403 });
  }

  try {
    // Delete in order to respect foreign key constraints
    // Start with the most dependent tables first

    // Delete documents and files
    await prisma.documentFile.deleteMany({});
    await prisma.document.deleteMany({});
    
    // Delete box-related data
    await prisma.boxApproval.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.box.deleteMany({});
    
    // Delete master data
    await prisma.contact.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.costCenter.deleteMany({});
    await prisma.fiscalPeriod.deleteMany({});
    
    // Delete export and filter data
    await prisma.exportHistory.deleteMany({});
    await prisma.exportProfile.deleteMany({});
    await prisma.savedFilter.deleteMany({});
    
    // Delete workflow and notification data
    await prisma.approvalStep.deleteMany({});
    await prisma.approvalWorkflow.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.activityLog.deleteMany({});
    
    // Delete booking entries
    await prisma.bookingEntry.deleteMany({});
    
    // Delete integrations
    await prisma.integration.deleteMany({});
    
    // Delete share links
    await prisma.shareLink.deleteMany({});
    
    // Delete invitations
    await prisma.invitation.deleteMany({});
    
    // Delete firm assignments
    await prisma.firmClientAssignment.deleteMany({});
    
    // Delete organization and firm memberships
    await prisma.organizationMember.deleteMany({});
    await prisma.firmMember.deleteMany({});
    
    // Delete organizations and firms
    await prisma.organization.deleteMany({});
    await prisma.accountingFirm.deleteMany({});
    
    // Delete users (but keep Supabase auth - users can re-register)
    await prisma.user.deleteMany({});
    
    // Clear cookies
    const cookieStore = await cookies();
    cookieStore.delete("currentOrgId");
    
    // Sign out from Supabase
    const supabase = await createClient();
    await supabase.auth.signOut();

    return NextResponse.json({
      success: true,
      message: "Database reset successfully. All data has been deleted.",
    });
  } catch (error) {
    console.error("Reset error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
