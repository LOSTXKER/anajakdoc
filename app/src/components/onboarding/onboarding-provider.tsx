"use client";

import { useState, useEffect } from "react";
import { useOnboarding } from "@/hooks/use-onboarding";
import { WelcomeModal } from "./welcome-modal";
import { ProductTour } from "./product-tour";
import { OnboardingChecklist } from "./onboarding-checklist";
import { HelpButton } from "./help-button";

interface OnboardingProviderProps {
  userName?: string;
}

const defaultChecklistItems = [
  {
    id: "create-box",
    title: "สร้างกล่องเอกสารแรก",
    description: "เริ่มต้นด้วยการสร้างกล่องเอกสารใหม่",
    icon: () => null,
    href: "/documents/new",
    completed: false,
  },
  {
    id: "upload-doc",
    title: "อัปโหลดเอกสาร",
    description: "เพิ่มไฟล์เอกสารลงในกล่อง",
    icon: () => null,
    href: "/documents",
    completed: false,
  },
  {
    id: "invite-member",
    title: "เพิ่มสมาชิกในทีม",
    description: "เชิญทีมงานมาใช้งานร่วมกัน",
    icon: () => null,
    href: "/settings/members",
    completed: false,
  },
  {
    id: "setup-category",
    title: "ตั้งค่าหมวดหมู่",
    description: "สร้างหมวดหมู่เพื่อจัดระเบียบเอกสาร",
    icon: () => null,
    href: "/settings/categories",
    completed: false,
  },
  {
    id: "first-export",
    title: "Export เอกสารครั้งแรก",
    description: "ส่งออกข้อมูลเข้าระบบบัญชี",
    icon: () => null,
    href: "/export",
    completed: false,
  },
];

export function OnboardingProvider({ userName }: OnboardingProviderProps) {
  const {
    state,
    isLoaded,
    shouldShowWelcome,
    shouldShowChecklist,
    markWelcomeShown,
    markTourCompleted,
    dismissChecklist,
    completeChecklistItem,
    resetOnboarding,
    restartTour,
  } = useOnboarding();

  const [showWelcome, setShowWelcome] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);

  // Handle initial welcome modal
  useEffect(() => {
    if (shouldShowWelcome) {
      // Small delay to let the page render first
      const timer = setTimeout(() => setShowWelcome(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [shouldShowWelcome]);

  // Handle checklist visibility
  useEffect(() => {
    if (isLoaded && shouldShowChecklist && state.welcomeShown) {
      setShowChecklist(true);
    }
  }, [isLoaded, shouldShowChecklist, state.welcomeShown]);

  const handleCloseWelcome = () => {
    setShowWelcome(false);
    markWelcomeShown();
  };

  const handleStartTour = () => {
    setShowWelcome(false);
    markWelcomeShown();
    setShowTour(true);
  };

  const handleTourComplete = () => {
    setShowTour(false);
    markTourCompleted();
    setShowChecklist(true);
  };

  const handleTourSkip = () => {
    setShowTour(false);
    markTourCompleted();
    setShowChecklist(true);
  };

  const handleDismissChecklist = () => {
    setShowChecklist(false);
    dismissChecklist();
  };

  const handleRestartTour = () => {
    restartTour();
    setShowTour(true);
  };

  const handleShowChecklist = () => {
    setShowChecklist(true);
  };

  // Prepare checklist items with completion status
  const checklistItems = defaultChecklistItems.map((item) => ({
    ...item,
    completed: state.completedItems.includes(item.id),
  }));

  if (!isLoaded) return null;

  return (
    <>
      {/* Welcome Modal */}
      <WelcomeModal
        open={showWelcome}
        onClose={handleCloseWelcome}
        onStartTour={handleStartTour}
        userName={userName}
      />

      {/* Product Tour */}
      <ProductTour
        isActive={showTour}
        onComplete={handleTourComplete}
        onSkip={handleTourSkip}
      />

      {/* Onboarding Checklist */}
      {showChecklist && (
        <OnboardingChecklist
          items={checklistItems}
          onDismiss={handleDismissChecklist}
          onItemClick={completeChecklistItem}
        />
      )}

      {/* Help Button - Always visible when checklist is dismissed */}
      {!showChecklist && (
        <HelpButton
          onStartTour={handleRestartTour}
          onShowChecklist={handleShowChecklist}
          onResetOnboarding={resetOnboarding}
        />
      )}
    </>
  );
}
