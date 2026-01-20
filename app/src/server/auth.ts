"use server";

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

  // Get current organization from cookie or first one
  const currentOrg = organizations[0] || null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    currentOrganization: currentOrg,
    organizations,
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

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
