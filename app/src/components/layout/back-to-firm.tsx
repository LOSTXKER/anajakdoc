"use client";

import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SessionUser } from "@/types";

interface BackToFirmProps {
  user: SessionUser;
}

export function BackToFirm({ user }: BackToFirmProps) {
  if (!user.firmMembership) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      asChild
      className="gap-2 text-muted-foreground hover:text-foreground"
    >
      <Link href="/firm/dashboard">
        <ArrowLeft className="h-4 w-4" />
        <Building2 className="h-4 w-4" />
        <span className="hidden sm:inline">{user.firmMembership.firmName}</span>
      </Link>
    </Button>
  );
}
