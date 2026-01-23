"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import {
  Clock,
  CheckCircle,
  XCircle,
  User,
  AlertTriangle,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getTaskTypeConfig, getTaskStatusConfig } from "@/lib/document-config";
import { completeTask, cancelTask } from "@/server/actions/task";
import type { TaskType, TaskStatus } from "@/types";

interface TaskCardProps {
  task: {
    id: string;
    taskType: TaskType;
    status: TaskStatus;
    title: string;
    description: string | null;
    dueDate: Date | string | null;
    escalationLevel: number;
    assignee: {
      id: string;
      name: string | null;
      email: string;
      avatarUrl: string | null;
    } | null;
    createdAt: Date | string;
  };
  onUpdate?: () => void;
  compact?: boolean;
}

export function TaskCard({ task, onUpdate, compact = false }: TaskCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const typeConfig = getTaskTypeConfig(task.taskType);
  const statusConfig = getTaskStatusConfig(task.status);
  const TypeIcon = typeConfig.icon;
  const StatusIcon = statusConfig.icon;
  
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = dueDate && dueDate < new Date() && 
    ["OPEN", "IN_PROGRESS"].includes(task.status);

  const handleComplete = async () => {
    setIsLoading(true);
    await completeTask(task.id);
    setIsLoading(false);
    onUpdate?.();
  };

  const handleCancel = async () => {
    setIsLoading(true);
    await cancelTask(task.id, "Cancelled by user");
    setIsLoading(false);
    onUpdate?.();
  };

  if (compact) {
    return (
      <div className={cn(
        "flex items-center gap-3 p-2 rounded-lg border",
        task.status === "DONE" && "bg-muted opacity-60",
        isOverdue && "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950",
      )}>
        <div className={cn("p-1.5 rounded", typeConfig.className)}>
          <TypeIcon className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm font-medium truncate",
            task.status === "DONE" && "line-through"
          )}>
            {task.title}
          </p>
          {dueDate && (
            <p className={cn(
              "text-xs",
              isOverdue ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
            )}>
              {isOverdue ? "เลยกำหนด " : ""}
              {formatDistanceToNow(dueDate, { addSuffix: true, locale: th })}
            </p>
          )}
        </div>
        {task.status === "OPEN" && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleComplete}
            disabled={isLoading}
            className="h-7 w-7 p-0"
          >
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      "p-4 rounded-lg border bg-card",
      task.status === "DONE" && "bg-muted opacity-75",
      isOverdue && "border-red-200 dark:border-red-800",
      task.escalationLevel >= 2 && "border-red-300 dark:border-red-700 ring-1 ring-red-200 dark:ring-red-800",
    )}>
      <div className="flex items-start gap-3">
        {/* Type Icon */}
        <div className={cn("p-2 rounded-lg flex-shrink-0", typeConfig.className)}>
          <TypeIcon className="h-4 w-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className={cn(
                "font-medium",
                task.status === "DONE" && "line-through text-muted-foreground"
              )}>
                {task.title}
              </h4>
              {task.description && (
                <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
              )}
            </div>
            
            {/* Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {task.status !== "DONE" && task.status !== "CANCELLED" && (
                  <DropdownMenuItem onClick={handleComplete} disabled={isLoading}>
                    <CheckCircle className="mr-2 h-4 w-4 text-emerald-600" />
                    เสร็จสิ้น
                  </DropdownMenuItem>
                )}
                {task.status !== "CANCELLED" && (
                  <DropdownMenuItem 
                    onClick={handleCancel} 
                    disabled={isLoading}
                    className="text-red-600"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    ยกเลิก
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {/* Status */}
            <Badge variant="outline" className={statusConfig.className}>
              <StatusIcon className="mr-1 h-3 w-3" />
              {statusConfig.labelShort}
            </Badge>

            {/* Due Date */}
            {dueDate && (
              <Badge 
                variant="outline" 
                className={cn(
                  isOverdue 
                    ? "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800" 
                    : "bg-muted text-muted-foreground"
                )}
              >
                <Clock className="mr-1 h-3 w-3" />
                {isOverdue && <AlertTriangle className="mr-1 h-3 w-3" />}
                {formatDistanceToNow(dueDate, { addSuffix: true, locale: th })}
              </Badge>
            )}

            {/* Escalation Level */}
            {task.escalationLevel > 0 && (
              <Badge 
                variant="outline" 
                className={cn(
                  task.escalationLevel >= 2 
                    ? "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"
                    : "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                )}
              >
                <AlertTriangle className="mr-1 h-3 w-3" />
                Level {task.escalationLevel}
              </Badge>
            )}

            {/* Assignee */}
            {task.assignee && (
              <Badge variant="outline" className="bg-muted">
                <User className="mr-1 h-3 w-3" />
                {task.assignee.name || task.assignee.email}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
