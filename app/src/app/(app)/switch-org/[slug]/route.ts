import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/server/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const session = await requireAuth();

  // Find organization by slug
  const organization = await prisma.organization.findUnique({
    where: { slug },
    include: {
      members: {
        where: {
          userId: session.id,
          isActive: true,
        },
      },
    },
  });

  if (!organization || organization.members.length === 0) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Set cookie for current organization
  const cookieStore = await cookies();
  cookieStore.set("currentOrgId", organization.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
  });

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
