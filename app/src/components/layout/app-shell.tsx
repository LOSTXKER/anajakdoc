"use client";

import { OnboardingProvider } from "@/components/onboarding/onboarding-provider";
import { ShortcutsHelp } from "@/components/layout/shortcuts-help";
import { WhatsNewModal } from "@/components/onboarding/whats-new-modal";

interface AppShellProps {
  children: React.ReactNode;
  userName?: string;
}

export function AppShell({ children, userName }: AppShellProps) {
  return (
    <>
      {children}
      <OnboardingProvider userName={userName} />
      <ShortcutsHelp />
      <WhatsNewModal />
    </>
  );
}
