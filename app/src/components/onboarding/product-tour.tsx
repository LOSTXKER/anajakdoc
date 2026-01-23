"use client";

import { useEffect, useCallback } from "react";
import { driver, DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

interface ProductTourProps {
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const tourSteps: DriveStep[] = [
  {
    element: "[data-tour='sidebar']",
    popover: {
      title: "เมนูหลัก",
      description: "นี่คือเมนูหลัก เข้าถึงทุกฟีเจอร์ได้ที่นี่ เช่น เอกสาร, รายงาน, ตั้งค่า",
      side: "right",
      align: "start",
    },
  },
  {
    element: "[data-tour='create-button']",
    popover: {
      title: "สร้างกล่องเอกสาร",
      description: "คลิกที่นี่เพื่อสร้างกล่องเอกสารใหม่ เลือกประเภท ใส่รายละเอียด แล้วอัปโหลดไฟล์",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "[data-tour='documents-list']",
    popover: {
      title: "รายการเอกสาร",
      description: "เอกสารทั้งหมดจะแสดงที่นี่ คุณสามารถกรอง ค้นหา และจัดการเอกสารได้",
      side: "top",
      align: "center",
    },
  },
  {
    element: "[data-tour='search']",
    popover: {
      title: "ค้นหาเอกสาร",
      description: "ค้นหาเอกสารได้รวดเร็วด้วย Cmd+K (Mac) หรือ Ctrl+K (Windows)",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "[data-tour='notifications']",
    popover: {
      title: "การแจ้งเตือน",
      description: "การแจ้งเตือนต่างๆ จะแสดงที่นี่ เช่น เอกสารรออนุมัติ, งานที่ต้องทำ",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: "[data-tour='help-button']",
    popover: {
      title: "ต้องการความช่วยเหลือ?",
      description: "คลิกที่นี่เพื่อดูทัวร์อีกครั้ง หรือดู Checklist สิ่งที่ต้องทำ",
      side: "top",
      align: "end",
    },
  },
];

export function ProductTour({ isActive, onComplete, onSkip }: ProductTourProps) {
  const startTour = useCallback(() => {
    const driverObj = driver({
      showProgress: true,
      steps: tourSteps,
      nextBtnText: "ถัดไป",
      prevBtnText: "ก่อนหน้า",
      doneBtnText: "เสร็จสิ้น",
      progressText: "{{current}} จาก {{total}}",
      onDestroyStarted: () => {
        if (!driverObj.hasNextStep()) {
          onComplete();
        } else {
          onSkip();
        }
        driverObj.destroy();
      },
    });

    driverObj.drive();
  }, [onComplete, onSkip]);

  useEffect(() => {
    if (isActive) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(startTour, 500);
      return () => clearTimeout(timer);
    }
  }, [isActive, startTour]);

  return null; // This component doesn't render anything visible
}

// Custom styles for driver.js to match the app theme
export const tourStyles = `
  .driver-popover {
    background: hsl(var(--background));
    color: hsl(var(--foreground));
    border: 1px solid hsl(var(--border));
    border-radius: 0.75rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  }
  
  .driver-popover-title {
    font-size: 1rem;
    font-weight: 600;
    color: hsl(var(--foreground));
  }
  
  .driver-popover-description {
    font-size: 0.875rem;
    color: hsl(var(--muted-foreground));
    margin-top: 0.5rem;
  }
  
  .driver-popover-progress-text {
    font-size: 0.75rem;
    color: hsl(var(--muted-foreground));
  }
  
  .driver-popover-prev-btn,
  .driver-popover-next-btn {
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
  }
  
  .driver-popover-next-btn,
  .driver-popover-done-btn {
    background: hsl(var(--primary));
    color: hsl(var(--primary-foreground));
  }
  
  .driver-popover-prev-btn {
    background: transparent;
    border: 1px solid hsl(var(--border));
    color: hsl(var(--foreground));
  }
  
  .driver-overlay {
    background: rgba(0, 0, 0, 0.5);
  }
`;
