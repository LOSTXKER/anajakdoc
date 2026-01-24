"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Loader2,
  Trash2,
  Edit,
  GitBranch,
  CheckCircle,
  Users,
  User,
  ArrowDown,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import {
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  type WorkflowData,
  type WorkflowStepData,
} from "@/server/actions/workflow";
import type { ApproverType } from "@prisma/client";

const APPROVER_TYPES: { value: ApproverType; label: string; icon: React.ElementType }[] = [
  { value: "ROLE", label: "ตาม Role", icon: Users },
  { value: "USER", label: "บุคคลเฉพาะ", icon: User },
  { value: "ANY", label: "ใครก็ได้", icon: CheckCircle },
];

const ROLES = [
  { value: "OWNER", label: "เจ้าของ" },
  { value: "ADMIN", label: "ผู้ดูแล" },
  { value: "ACCOUNTING", label: "บัญชี" },
  { value: "STAFF", label: "พนักงาน" },
];

interface WorkflowListProps {
  initialWorkflows: WorkflowData[];
}

export function WorkflowList({ initialWorkflows }: WorkflowListProps) {
  const [workflows, setWorkflows] = useState(initialWorkflows);
  const [showDialog, setShowDialog] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<WorkflowData | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [steps, setSteps] = useState<WorkflowStepData[]>([]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setIsDefault(false);
    setSteps([]);
    setEditingWorkflow(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setShowDialog(true);
  };

  const openEditDialog = (workflow: WorkflowData) => {
    setEditingWorkflow(workflow);
    setName(workflow.name);
    setDescription(workflow.description || "");
    setIsDefault(workflow.isDefault);
    setSteps(workflow.steps);
    setShowDialog(true);
  };

  const addStep = () => {
    setSteps([
      ...steps,
      {
        order: steps.length + 1,
        name: `ขั้นตอนที่ ${steps.length + 1}`,
        approverType: "ANY",
        approverValue: null,
        autoApprove: false,
        threshold: null,
      },
    ]);
  };

  const updateStep = (index: number, updates: Partial<WorkflowStepData>) => {
    setSteps(
      steps.map((s, i) => (i === index ? { ...s, ...updates } : s))
    );
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name) {
      toast.error("กรุณากรอกชื่อ Workflow");
      return;
    }
    if (steps.length === 0) {
      toast.error("กรุณาเพิ่มอย่างน้อย 1 ขั้นตอน");
      return;
    }

    setLoading("save");
    try {
      if (editingWorkflow) {
        const result = await updateWorkflow(editingWorkflow.id, {
          name,
          description,
          isDefault,
          steps,
        });
        if (result.success) {
          toast.success("บันทึก Workflow สำเร็จ");
          setShowDialog(false);
          window.location.reload();
        } else {
          toast.error(result.error);
        }
      } else {
        const result = await createWorkflow({
          name,
          description,
          isDefault,
          steps,
        });
        if (result.success) {
          toast.success("สร้าง Workflow สำเร็จ");
          setShowDialog(false);
          window.location.reload();
        } else {
          toast.error(result.error);
        }
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ต้องการลบ Workflow นี้?")) return;

    setLoading(id);
    try {
      const result = await deleteWorkflow(id);
      if (result.success) {
        setWorkflows(workflows.filter((w) => w.id !== id));
        toast.success("ลบ Workflow สำเร็จ");
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setLoading(null);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    setLoading(id);
    try {
      const result = await updateWorkflow(id, { isActive });
      if (result.success) {
        setWorkflows(
          workflows.map((w) => (w.id === id ? { ...w, isActive } : w))
        );
        toast.success(isActive ? "เปิดใช้งานแล้ว" : "ปิดใช้งานแล้ว");
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Button */}
      <div className="flex justify-end">
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          สร้าง Workflow
        </Button>
      </div>

      {/* Workflow List */}
      {workflows.length === 0 ? (
        <Card>
          <CardContent className="py-6">
            <EmptyState
              icon={GitBranch}
              title="ยังไม่มี Approval Workflow"
              description="สร้าง Workflow เพื่อกำหนดขั้นตอนการอนุมัติเอกสาร"
              action={
                <Button onClick={openCreateDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  สร้าง Workflow แรก
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {workflows.map((workflow) => (
            <Card key={workflow.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <GitBranch className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {workflow.name}
                        {workflow.isDefault && (
                          <Badge variant="default" className="text-xs">
                            Default
                          </Badge>
                        )}
                        <Badge
                          variant={workflow.isActive ? "secondary" : "outline"}
                          className="text-xs"
                        >
                          {workflow.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {workflow.description || `${workflow.steps.length} ขั้นตอน`}
                      </CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={workflow.isActive}
                    onCheckedChange={(checked) =>
                      handleToggleActive(workflow.id, checked)
                    }
                    disabled={loading === workflow.id}
                  />
                </div>
              </CardHeader>
              <CardContent>
                {/* Steps Preview */}
                <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
                  {workflow.steps.map((step, i) => (
                    <div key={i} className="flex items-center">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-full text-sm whitespace-nowrap">
                        <span className="font-medium">{step.order}.</span>
                        {step.name}
                      </div>
                      {i < workflow.steps.length - 1 && (
                        <ArrowDown className="h-4 w-4 text-muted-foreground mx-1 rotate-[-90deg]" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(workflow)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    แก้ไข
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(workflow.id)}
                    disabled={loading === workflow.id}
                  >
                    {loading === workflow.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingWorkflow ? "แก้ไข Workflow" : "สร้าง Workflow ใหม่"}
            </DialogTitle>
            <DialogDescription>
              กำหนดขั้นตอนการอนุมัติสำหรับกล่องเอกสาร
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>ชื่อ Workflow</Label>
                <Input
                  placeholder="เช่น Standard Approval"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>รายละเอียด (ไม่บังคับ)</Label>
                <Textarea
                  placeholder="อธิบาย workflow นี้..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={isDefault} onCheckedChange={setIsDefault} />
                <Label>ใช้เป็น Default สำหรับกล่องใหม่</Label>
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>ขั้นตอนการอนุมัติ</Label>
                <Button type="button" variant="outline" size="sm" onClick={addStep}>
                  <Plus className="h-4 w-4 mr-1" />
                  เพิ่มขั้นตอน
                </Button>
              </div>

              {steps.length === 0 ? (
                <div className="text-center py-8 border rounded-lg border-dashed">
                  <GitBranch className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    ยังไม่มีขั้นตอน กดเพิ่มขั้นตอนเพื่อเริ่มต้น
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {steps.map((step, index) => (
                    <Card key={index} className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 cursor-move">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <CardContent className="pl-10 pr-4 py-4">
                        <div className="grid gap-4">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline">ขั้นตอนที่ {index + 1}</Badge>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => removeStep(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label>ชื่อขั้นตอน</Label>
                              <Input
                                placeholder="เช่น ผู้จัดการตรวจสอบ"
                                value={step.name}
                                onChange={(e) =>
                                  updateStep(index, { name: e.target.value })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>ผู้อนุมัติ</Label>
                              <Select
                                value={step.approverType}
                                onValueChange={(v: ApproverType) =>
                                  updateStep(index, {
                                    approverType: v,
                                    approverValue: null,
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {APPROVER_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                      <div className="flex items-center gap-2">
                                        <type.icon className="h-4 w-4" />
                                        {type.label}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {step.approverType === "ROLE" && (
                            <div className="space-y-2">
                              <Label>เลือก Role</Label>
                              <Select
                                value={step.approverValue || ""}
                                onValueChange={(v) =>
                                  updateStep(index, { approverValue: v })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="เลือก Role" />
                                </SelectTrigger>
                                <SelectContent>
                                  {ROLES.map((role) => (
                                    <SelectItem key={role.value} value={role.value}>
                                      {role.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={step.autoApprove}
                                onCheckedChange={(v) =>
                                  updateStep(index, { autoApprove: v })
                                }
                              />
                              <Label className="text-sm">อนุมัติอัตโนมัติ</Label>
                            </div>
                            {step.autoApprove && (
                              <div className="flex items-center gap-2">
                                <Label className="text-sm">ถ้ายอด &lt;</Label>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  className="w-24"
                                  value={step.threshold || ""}
                                  onChange={(e) =>
                                    updateStep(index, {
                                      threshold: e.target.value
                                        ? parseFloat(e.target.value)
                                        : null,
                                    })
                                  }
                                />
                                <span className="text-sm text-muted-foreground">
                                  บาท
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSave} disabled={loading === "save"}>
              {loading === "save" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingWorkflow ? "บันทึก" : "สร้าง Workflow"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
