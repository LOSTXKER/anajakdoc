"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  Circle, 
  X, 
  ChevronDown, 
  ChevronUp,
  Package,
  Upload,
  Users,
  FolderTree,
  Download,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  completed: boolean;
}

interface OnboardingChecklistProps {
  items: ChecklistItem[];
  onDismiss: () => void;
  onItemClick?: (itemId: string) => void;
}

const defaultItems: ChecklistItem[] = [
  {
    id: "create-box",
    title: "สร้างกล่องเอกสารแรก",
    description: "เริ่มต้นด้วยการสร้างกล่องเอกสารใหม่",
    icon: Package,
    href: "/documents/new",
    completed: false,
  },
  {
    id: "upload-doc",
    title: "อัปโหลดเอกสาร",
    description: "เพิ่มไฟล์เอกสารลงในกล่อง",
    icon: Upload,
    href: "/documents",
    completed: false,
  },
  {
    id: "invite-member",
    title: "เพิ่มสมาชิกในทีม",
    description: "เชิญทีมงานมาใช้งานร่วมกัน",
    icon: Users,
    href: "/settings/members",
    completed: false,
  },
  {
    id: "setup-category",
    title: "ตั้งค่าหมวดหมู่",
    description: "สร้างหมวดหมู่เพื่อจัดระเบียบเอกสาร",
    icon: FolderTree,
    href: "/settings/categories",
    completed: false,
  },
  {
    id: "first-export",
    title: "Export เอกสารครั้งแรก",
    description: "ส่งออกข้อมูลเข้าระบบบัญชี",
    icon: Download,
    href: "/export",
    completed: false,
  },
];

export function OnboardingChecklist({ 
  items = defaultItems, 
  onDismiss,
  onItemClick 
}: OnboardingChecklistProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const completedCount = items.filter((item) => item.completed).length;
  const progress = (completedCount / items.length) * 100;

  return (
    <Card className="fixed bottom-4 right-4 w-80 shadow-xl z-50 animate-in slide-in-from-bottom-5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            เริ่มต้นใช้งาน
            <span className="text-sm font-normal text-muted-foreground">
              {completedCount}/{items.length}
            </span>
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Progress value={progress} className="h-1.5 mt-2" />
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-2 pb-4">
          <div className="space-y-2">
            {items.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => onItemClick?.(item.id)}
                className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${
                  item.completed 
                    ? "bg-primary/5 text-muted-foreground" 
                    : "hover:bg-muted"
                }`}
              >
                <div className="mt-0.5">
                  {item.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${item.completed ? "line-through" : ""}`}>
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {item.description}
                  </p>
                </div>
                {!item.completed && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground mt-0.5" />
                )}
              </Link>
            ))}
          </div>

          {completedCount === items.length && (
            <div className="mt-4 p-3 rounded-lg bg-primary/10 text-center">
              <p className="text-sm font-medium text-primary">
                ยินดีด้วย! คุณทำครบทุกขั้นตอนแล้ว
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
