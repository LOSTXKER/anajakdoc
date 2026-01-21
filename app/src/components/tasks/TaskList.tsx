"use client";

import { useState } from "react";
import { Plus, ListTodo, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskCard } from "./TaskCard";
import { TaskForm } from "./TaskForm";
import type { TaskType, TaskStatus } from "@/types";

interface TaskItem {
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
}

interface TaskListProps {
  boxId: string;
  tasks: TaskItem[];
  onRefresh?: () => void;
  showHeader?: boolean;
  compact?: boolean;
  maxItems?: number;
}

export function TaskList({ 
  boxId, 
  tasks, 
  onRefresh, 
  showHeader = true,
  compact = false,
  maxItems,
}: TaskListProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Filter out cancelled tasks for display
  const activeTasks = tasks.filter(t => t.status !== "CANCELLED");
  const openTasks = activeTasks.filter(t => t.status !== "DONE");
  const doneTasks = activeTasks.filter(t => t.status === "DONE");
  
  // Limit items if maxItems is set
  const displayTasks = maxItems 
    ? [...openTasks.slice(0, maxItems)]
    : [...openTasks, ...doneTasks];

  const handleTaskCreated = () => {
    setIsFormOpen(false);
    onRefresh?.();
  };

  const handleTaskUpdate = () => {
    onRefresh?.();
  };

  if (compact) {
    return (
      <div className="space-y-2">
        {displayTasks.length === 0 ? (
          <p className="text-sm text-gray-500 py-2">ไม่มีงานค้าง</p>
        ) : (
          displayTasks.map((task) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onUpdate={handleTaskUpdate}
              compact
            />
          ))
        )}
        {maxItems && openTasks.length > maxItems && (
          <p className="text-xs text-gray-500 text-center">
            +{openTasks.length - maxItems} งานเพิ่มเติม
          </p>
        )}
      </div>
    );
  }

  return (
    <Card>
      {showHeader && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListTodo className="h-5 w-5 text-gray-500" />
              <CardTitle className="text-lg">
                งานติดตาม
                {openTasks.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({openTasks.length} งานค้าง)
                  </span>
                )}
              </CardTitle>
            </div>
            <Button size="sm" onClick={() => setIsFormOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              เพิ่มงาน
            </Button>
          </div>
        </CardHeader>
      )}

      <CardContent className={showHeader ? "" : "pt-0"}>
        {displayTasks.length === 0 ? (
          <div className="text-center py-8">
            <ListTodo className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">ไม่มีงานติดตาม</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={() => setIsFormOpen(true)}
            >
              <Plus className="mr-1 h-4 w-4" />
              สร้างงานแรก
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {displayTasks.map((task) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onUpdate={handleTaskUpdate}
              />
            ))}
          </div>
        )}
      </CardContent>

      {/* Task Form Dialog */}
      <TaskForm
        boxId={boxId}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onCreated={handleTaskCreated}
      />
    </Card>
  );
}
