"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  HelpCircle, 
  Play, 
  CheckSquare, 
  BookOpen, 
  MessageCircle,
  RotateCcw,
} from "lucide-react";

interface HelpButtonProps {
  onStartTour: () => void;
  onShowChecklist: () => void;
  onResetOnboarding?: () => void;
}

export function HelpButton({ 
  onStartTour, 
  onShowChecklist,
  onResetOnboarding,
}: HelpButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg z-40 bg-background"
          data-tour="help-button"
        >
          <HelpCircle className="h-5 w-5" />
          <span className="sr-only">ความช่วยเหลือ</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => { onStartTour(); setIsOpen(false); }}>
          <Play className="mr-2 h-4 w-4" />
          เริ่มทัวร์แนะนำ
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => { onShowChecklist(); setIsOpen(false); }}>
          <CheckSquare className="mr-2 h-4 w-4" />
          ดู Checklist
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="https://docs.anajakdoc.com" target="_blank" rel="noopener noreferrer">
            <BookOpen className="mr-2 h-4 w-4" />
            ศูนย์ช่วยเหลือ
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="mailto:support@anajakdoc.com">
            <MessageCircle className="mr-2 h-4 w-4" />
            ติดต่อ Support
          </a>
        </DropdownMenuItem>
        {onResetOnboarding && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => { onResetOnboarding(); setIsOpen(false); }}
              className="text-muted-foreground"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              รีเซ็ต Onboarding
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
