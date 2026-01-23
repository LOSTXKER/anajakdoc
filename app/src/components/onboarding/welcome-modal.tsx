"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Package, Upload, FileCheck, ArrowRight, Sparkles } from "lucide-react";

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
  onStartTour: () => void;
  userName?: string;
}

const features = [
  {
    icon: Package,
    title: "สร้างกล่องเอกสาร",
    description: "จัดเก็บเอกสารในรูปแบบ 'กล่อง' ที่เข้าใจง่าย",
  },
  {
    icon: Upload,
    title: "อัปโหลดเอกสาร",
    description: "ถ่ายรูปหรือเลือกไฟล์ รองรับหลายรูปแบบ",
  },
  {
    icon: FileCheck,
    title: "ส่งให้บัญชี",
    description: "ทีมบัญชีตรวจสอบและ Export เข้าระบบ",
  },
];

export function WelcomeModal({ open, onClose, onStartTour, userName }: WelcomeModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl">
            ยินดีต้อนรับ{userName ? `, ${userName}` : ""}!
          </DialogTitle>
          <DialogDescription className="text-base">
            พร้อมเริ่มจัดการเอกสารอย่างเป็นระบบแล้วหรือยัง?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="flex items-start gap-4 p-3 rounded-lg bg-muted/50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{feature.title}</p>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <Button onClick={onStartTour} size="lg" className="w-full">
            เริ่มทัวร์แนะนำ
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full">
            ข้ามไปก่อน
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
