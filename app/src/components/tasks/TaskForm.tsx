"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createTask } from "@/server/actions/task";
import { TASK_TYPE_CONFIG } from "@/lib/document-config";
import type { TaskType } from "@/types";

const taskFormSchema = z.object({
  taskType: z.enum(["VAT_INVOICE", "WHT_CERTIFICATE", "GENERAL_DOC", "FOLLOW_UP"]),
  title: z.string().min(1, "กรุณาระบุชื่องาน"),
  description: z.string().optional(),
  dueDate: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface TaskFormProps {
  boxId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export function TaskForm({ boxId, open, onOpenChange, onCreated }: TaskFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      taskType: "GENERAL_DOC",
      title: "",
      description: "",
      dueDate: "",
    },
  });

  const selectedType = form.watch("taskType");

  // Update title when type changes
  const handleTypeChange = (type: TaskType) => {
    form.setValue("taskType", type);
    const config = TASK_TYPE_CONFIG[type];
    if (config) {
      form.setValue("title", config.label);
    }
  };

  const onSubmit = async (values: TaskFormValues) => {
    setIsSubmitting(true);
    
    const result = await createTask({
      boxId,
      taskType: values.taskType as TaskType,
      title: values.title,
      description: values.description || undefined,
      dueDate: values.dueDate ? new Date(values.dueDate) : undefined,
    });

    setIsSubmitting(false);

    if (result.success) {
      form.reset();
      onCreated?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>สร้างงานใหม่</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Task Type */}
            <FormField
              control={form.control}
              name="taskType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ประเภทงาน</FormLabel>
                  <Select 
                    value={field.value} 
                    onValueChange={(value) => handleTypeChange(value as TaskType)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(TASK_TYPE_CONFIG).map(([type, config]) => (
                        <SelectItem key={type} value={type}>
                          <div className="flex items-center gap-2">
                            <config.icon className="h-4 w-4" />
                            {config.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ชื่องาน</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="เช่น ขอใบกำกับภาษีจาก ABC" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>รายละเอียด (ถ้ามี)</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="รายละเอียดเพิ่มเติม..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Due Date */}
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>กำหนดส่ง (ถ้ามี)</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                ยกเลิก
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                สร้างงาน
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
