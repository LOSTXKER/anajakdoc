import { NextResponse } from "next/server";
import { getSession } from "@/server/auth";

export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.redirect(`${origin}/login`);
    }
    
    // No organization - go to onboarding
    if (!session.currentOrganization) {
      return NextResponse.redirect(`${origin}/onboarding`);
    }
    
    // Firm member - go to firm dashboard
    if (session.firmMembership) {
      return NextResponse.redirect(`${origin}/firm/dashboard`);
    }
    
    // Regular user - go to app dashboard
    return NextResponse.redirect(`${origin}/dashboard`);
    
  } catch (error) {
    console.error("Auth redirect error:", error);
    return NextResponse.redirect(`${origin}/login`);
  }
}
