import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

// Only allow in development
const isDev = process.env.NODE_ENV === "development";

export async function POST(request: NextRequest) {
  if (!isDev) {
    return NextResponse.json({ success: false, error: "Not allowed in production" }, { status: 403 });
  }

  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ success: false, error: "Email required" }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          where: { isActive: true },
          include: { organization: true },
        },
        firmMemberships: {
          where: { isActive: true },
          include: { firm: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found. Run seed first." }, { status: 404 });
    }

    // First, ensure email is confirmed using admin client
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabaseAdmin = createAdminClient();
        
        // Find user in Supabase by email
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const supabaseUser = listData?.users?.find(u => u.email === email);
        
        if (supabaseUser && !supabaseUser.email_confirmed_at) {
          // Confirm the email
          await supabaseAdmin.auth.admin.updateUserById(supabaseUser.id, {
            email_confirm: true,
          });
          console.log("[Switch Account] Confirmed email for:", email);
        }
      } catch (adminError) {
        console.error("[Switch Account] Admin error:", adminError);
      }
    }

    // Sign in as this user
    const supabase = await createClient();
    
    // Use the test password
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: "password123",
    });

    if (signInError) {
      return NextResponse.json({ success: false, error: signInError.message }, { status: 400 });
    }

    // Set the context cookies based on user type
    const cookieStore = await cookies();
    
    // Determine if this is primarily a firm user or org user
    const isFirmUser = user.firmMemberships.length > 0 && user.memberships.length === 0;
    const hasOrgMembership = user.memberships.length > 0;
    const hasFirmMembership = user.firmMemberships.length > 0;

    if (isFirmUser && hasFirmMembership) {
      // Pure firm user - set firm context, clear org context
      cookieStore.set("currentFirmId", user.firmMemberships[0].firmId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
      });
      cookieStore.delete("currentOrgId");
    } else if (hasOrgMembership) {
      // Org user (might also have firm membership)
      cookieStore.set("currentOrgId", user.memberships[0].organizationId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
      });
      cookieStore.delete("currentFirmId");
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isFirmUser,
        organizations: user.memberships.map((m) => ({
          id: m.organization.id,
          name: m.organization.name,
          role: m.role,
        })),
        firms: user.firmMemberships.map((m) => ({
          id: m.firm.id,
          name: m.firm.name,
          role: m.role,
        })),
      },
    });
  } catch (error) {
    console.error("Switch account error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
