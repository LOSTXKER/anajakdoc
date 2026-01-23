"use client";

import { OnboardingProvider } from "@/components/onboarding/onboarding-provider";

interface AppShellProps {
  children: React.ReactNode;
  userName?: string;
}

export function AppShell({ children, userName }: AppShellProps) {
  return (
    <>
      {children}
      <OnboardingProvider userName={userName} />
    </>
  );
}
