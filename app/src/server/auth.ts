"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { SessionUser } from "@/types";

export async function getSession(): Promise<SessionUser | null> {
  const supabase = await createClient();
  
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();
  
  if (!supabaseUser) {
    return null;
  }

  // Get user from database with organizations
  let user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
    include: {
      memberships: {
        where: { isActive: true },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  // Auto-create user in database if exists in Supabase but not in DB
  if (!user && supabaseUser.email) {
    user = await prisma.user.create({
      data: {
        email: supabaseUser.email,
        name: supabaseUser.user_metadata?.name || supabaseUser.email.split("@")[0],
        supabaseId: supabaseUser.id,
      },
      include: {
        memberships: {
          where: { isActive: true },
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });
  }

  if (!user) {
    return null;
  }

  const organizations = user.memberships.map((m) => ({
    id: m.organization.id,
    name: m.organization.name,
    slug: m.organization.slug,
    role: m.role,
  }));

  // Get current organization from cookie or fallback to first one
  const cookieStore = await cookies();
  const currentOrgId = cookieStore.get("currentOrgId")?.value;
  
  // Find org from cookie, validate user has access, fallback to first
  const currentOrg = (currentOrgId && organizations.find(o => o.id === currentOrgId)) 
    || organizations[0] 
    || null;

  // Get firm membership (Section 22)
  let firmMembership = null;
  try {
    const firmMember = await prisma.firmMember.findFirst({
      where: {
        userId: user.id,
        isActive: true,
      },
      include: {
        firm: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (firmMember) {
      firmMembership = {
        firmId: firmMember.firm.id,
        firmName: firmMember.firm.name,
        firmSlug: firmMember.firm.slug,
        role: firmMember.role,
      };
    }
  } catch {
    // Firm tables might not exist yet in dev
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    currentOrganization: currentOrg,
    organizations,
    firmMembership,
  };
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  
  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function requireOrganization(): Promise<SessionUser & { currentOrganization: NonNullable<SessionUser["currentOrganization"]> }> {
  const session = await requireAuth();
  
  if (!session.currentOrganization) {
    redirect("/onboarding");
  }

  return session as SessionUser & { currentOrganization: NonNullable<SessionUser["currentOrganization"]> };
}

export async function requireUser(): Promise<{ id: string; email: string; name: string | null }> {
  const session = await getSession();
  
  if (!session) {
    redirect("/login");
  }

  return {
    id: session.id,
    email: session.email,
    name: session.name,
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * Require firm membership
 */
export async function requireFirmMember(): Promise<SessionUser & { firmMembership: NonNullable<SessionUser["firmMembership"]> }> {
  const session = await requireAuth();
  
  if (!session.firmMembership) {
    redirect("/dashboard");
  }

  return session as SessionUser & { firmMembership: NonNullable<SessionUser["firmMembership"]> };
}

/**
 * Require firm owner role
 */
export async function requireFirmOwner(): Promise<SessionUser & { firmMembership: NonNullable<SessionUser["firmMembership"]> }> {
  const session = await requireFirmMember();
  
  if (session.firmMembership.role !== "OWNER") {
    redirect("/firm/dashboard?error=unauthorized");
  }

  return session;
}

/**
 * Require firm manager or above
 */
export async function requireFirmManager(): Promise<SessionUser & { firmMembership: NonNullable<SessionUser["firmMembership"]> }> {
  const session = await requireFirmMember();
  
  const role = session.firmMembership.role;
  if (role !== "OWNER" && role !== "MANAGER") {
    redirect("/firm/dashboard?error=unauthorized");
  }

  return session;
}
