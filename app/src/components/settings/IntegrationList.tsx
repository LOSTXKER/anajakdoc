"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  PlayCircle,
  MessageCircle,
  Hash,
  Webhook,
  Mail,
  Settings2,
  CheckCircle,
  XCircle,
  Bell,
} from "lucide-react";
import { toast } from "sonner";
import {
  createIntegration,
  updateIntegration,
  deleteIntegration,
  testIntegration,
  type IntegrationData,
} from "@/server/actions/integration";
import type { IntegrationType, NotificationType } from "@prisma/client";

const INTEGRATION_TYPES: { value: IntegrationType; label: string; icon: React.ReactNode; description: string; deprecated?: boolean }[] = [
  { value: "LINE_OA", label: "LINE Messaging API", icon: <MessageCircle className="h-5 w-5 text-green-600" />, description: "ส่งข้อความผ่าน LINE Official Account (แนะนำ)" },
  { value: "LINE_NOTIFY", label: "LINE Notify", icon: <MessageCircle className="h-5 w-5 text-gray-400" />, description: "ยกเลิกแล้ว (มีนาคม 2025)", deprecated: true },
  { value: "SLACK", label: "Slack", icon: <Hash className="h-5 w-5 text-purple-500" />, description: "ส่งข้อความไปยัง Slack channel" },
  { value: "DISCORD", label: "Discord", icon: <Hash className="h-5 w-5 text-indigo-500" />, description: "ส่งข้อความไปยัง Discord channel" },
  { value: "CUSTOM_WEBHOOK", label: "Custom Webhook", icon: <Webhook className="h-5 w-5 text-orange-500" />, description: "ส่งข้อมูลไปยัง URL ที่กำหนดเอง" },
  { value: "EMAIL", label: "Email", icon: <Mail className="h-5 w-5 text-blue-500" />, description: "ส่งอีเมลแจ้งเตือน" },
];

const EVENT_TYPES: { value: NotificationType; label: string; category: string }[] = [
  // Box Status
  { value: "BOX_SUBMITTED", label: "กล่องใหม่รอตรวจ", category: "สถานะกล่อง" },
  { value: "BOX_IN_REVIEW", label: "กำลังตรวจสอบ", category: "สถานะกล่อง" },
  { value: "BOX_NEED_MORE_DOCS", label: "ขอเอกสารเพิ่ม", category: "สถานะกล่อง" },
  { value: "BOX_READY_TO_BOOK", label: "พร้อมลงบัญชี", category: "สถานะกล่อง" },
  { value: "BOX_BOOKED", label: "ลงบัญชีแล้ว", category: "สถานะกล่อง" },
  // Documents
  { value: "DOCUMENT_ADDED", label: "มีเอกสารใหม่", category: "เอกสาร" },
  { value: "COMMENT_ADDED", label: "มี Comment ใหม่", category: "เอกสาร" },
  // Tasks
  { value: "TASK_ASSIGNED", label: "ได้รับ Task ใหม่", category: "งาน" },
  { value: "TASK_REMINDER", label: "เตือน Task", category: "งาน" },
  { value: "TASK_COMPLETED", label: "Task เสร็จสิ้น", category: "งาน" },
  // WHT
  { value: "WHT_PENDING", label: "WHT รอส่ง", category: "WHT" },
  { value: "WHT_RECEIVED", label: "ได้รับ WHT แล้ว", category: "WHT" },
  { value: "WHT_OVERDUE", label: "WHT เกินกำหนด", category: "WHT" },
];

interface IntegrationListProps {
  initialIntegrations: IntegrationData[];
}

export function IntegrationList({ initialIntegrations }: IntegrationListProps) {
  const [integrations, setIntegrations] = useState(initialIntegrations);
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    type: IntegrationType;
    name: string;
    config: Record<string, string>;
    events: NotificationType[];
  }>({
    type: "LINE_NOTIFY",
    name: "",
    config: {},
    events: [],
  });

  const handleCreate = async () => {
    if (!formData.name) {
      toast.error("กรุณากรอกชื่อ Integration");
      return;
    }

    if (formData.events.length === 0) {
      toast.error("กรุณาเลือกอย่างน้อย 1 event");
      return;
    }

    setLoading("create");
    try {
      const result = await createIntegration({
        type: formData.type,
        name: formData.name,
        config: formData.config,
        events: formData.events,
      });

      if (result.success) {
        toast.success("สร้าง Integration สำเร็จ");
        setShowDialog(false);
        // Refresh the list
        window.location.reload();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setLoading(null);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    setLoading(id);
    try {
      const result = await updateIntegration(id, { isActive });
      if (result.success) {
        setIntegrations(integrations.map(i => 
          i.id === id ? { ...i, isActive } : i
        ));
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

  const handleDelete = async (id: string) => {
    if (!confirm("ยืนยันลบ Integration นี้?")) return;

    setLoading(id);
    try {
      const result = await deleteIntegration(id);
      if (result.success) {
        setIntegrations(integrations.filter(i => i.id !== id));
        toast.success("ลบ Integration สำเร็จ");
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setLoading(null);
    }
  };

  const handleTest = async (id: string) => {
    setLoading(`test-${id}`);
    try {
      const result = await testIntegration(id);
      if (result.success) {
        toast.success("ส่งข้อความทดสอบสำเร็จ!");
      } else {
        toast.error(result.error || "ส่งข้อความไม่สำเร็จ");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setLoading(null);
    }
  };

  const toggleEvent = (event: NotificationType) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event],
    }));
  };

  const getTypeInfo = (type: IntegrationType) => 
    INTEGRATION_TYPES.find(t => t.value === type);

  const renderConfigFields = () => {
    switch (formData.type) {
      case "LINE_NOTIFY":
        return (
          <div className="space-y-2">
            <Label>Access Token</Label>
            <Input
              placeholder="LINE Notify Token"
              value={formData.config.accessToken || ""}
              onChange={(e) => setFormData({ ...formData, config: { ...formData.config, accessToken: e.target.value } })}
            />
            <p className="text-xs text-muted-foreground">
              สร้าง Token ได้ที่{" "}
              <a href="https://notify-bot.line.me/" target="_blank" className="text-blue-600 dark:text-blue-400 hover:underline">
                notify-bot.line.me
              </a>
            </p>
          </div>
        );

      case "LINE_OA":
        return (
          <>
            <div className="space-y-2">
              <Label>Channel Access Token</Label>
              <Input
                placeholder="Channel Access Token (Long-lived)"
                value={formData.config.channelAccessToken || ""}
                onChange={(e) => setFormData({ ...formData, config: { ...formData.config, channelAccessToken: e.target.value } })}
              />
              <p className="text-xs text-muted-foreground">
                สร้างได้ที่{" "}
                <a href="https://developers.line.biz/console/" target="_blank" className="text-blue-600 dark:text-blue-400 hover:underline">
                  LINE Developers Console
                </a>
                {" "}→ Messaging API → Channel access token
              </p>
            </div>
            <div className="space-y-2">
              <Label>User ID / Group ID</Label>
              <Input
                placeholder="U1234... หรือ C1234..."
                value={formData.config.userId || ""}
                onChange={(e) => setFormData({ ...formData, config: { ...formData.config, userId: e.target.value } })}
              />
              <p className="text-xs text-muted-foreground">
                User ID: ขึ้นต้นด้วย U (ส่งตรงถึงบุคคล) | Group ID: ขึ้นต้นด้วย C (ส่งเข้ากลุ่ม)
              </p>
            </div>
          </>
        );

      case "SLACK":
      case "DISCORD":
        return (
          <div className="space-y-2">
            <Label>Webhook URL</Label>
            <Input
              placeholder={formData.type === "SLACK" 
                ? "https://hooks.slack.com/services/..."
                : "https://discord.com/api/webhooks/..."
              }
              value={formData.config.webhookUrl || ""}
              onChange={(e) => setFormData({ ...formData, config: { ...formData.config, webhookUrl: e.target.value } })}
            />
          </div>
        );

      case "CUSTOM_WEBHOOK":
        return (
          <>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                placeholder="https://your-api.com/webhook"
                value={formData.config.url || ""}
                onChange={(e) => setFormData({ ...formData, config: { ...formData.config, url: e.target.value } })}
              />
            </div>
            <div className="space-y-2">
              <Label>Method</Label>
              <Select
                value={formData.config.method || "POST"}
                onValueChange={(v) => setFormData({ ...formData, config: { ...formData.config, method: v } })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case "EMAIL":
        return (
          <div className="space-y-2">
            <Label>Email Address</Label>
            <Input
              type="email"
              placeholder="notify@example.com"
              value={formData.config.to || ""}
              onChange={(e) => setFormData({ ...formData, config: { ...formData.config, to: e.target.value } })}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Button */}
      <div className="flex justify-end">
        <Button onClick={() => {
          setFormData({ type: "LINE_NOTIFY", name: "", config: {}, events: [] });
          setShowDialog(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          เพิ่ม Integration
        </Button>
      </div>

      {/* Integration List */}
      {integrations.length === 0 ? (
        <Card>
          <CardContent className="py-6">
            <EmptyState
              icon={Bell}
              title="ยังไม่มี Integration"
              description="เพิ่ม LINE, Slack หรือ Webhook เพื่อรับการแจ้งเตือนอัตโนมัติ"
              action={
                <Button onClick={() => setShowDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  เพิ่ม Integration แรก
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {integrations.map((integration) => {
            const typeInfo = getTypeInfo(integration.type);
            return (
              <Card key={integration.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        {typeInfo?.icon}
                      </div>
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {integration.name}
                          <Badge variant={integration.isActive ? "default" : "secondary"} className="text-xs">
                            {integration.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                          </Badge>
                        </CardTitle>
                        <CardDescription>{typeInfo?.label}</CardDescription>
                      </div>
                    </div>
                    <Switch
                      checked={integration.isActive}
                      onCheckedChange={(checked) => handleToggle(integration.id, checked)}
                      disabled={loading === integration.id}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {integration.events.slice(0, 3).map((event) => (
                        <Badge key={event} variant="outline" className="text-xs">
                          {EVENT_TYPES.find(e => e.value === event)?.label || event}
                        </Badge>
                      ))}
                      {integration.events.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{integration.events.length - 3} อื่นๆ
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {integration.lastTriggeredAt && (
                        <span className="text-xs text-muted-foreground">
                          ส่งล่าสุด: {new Date(integration.lastTriggeredAt).toLocaleDateString("th-TH")}
                        </span>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTest(integration.id)}
                        disabled={loading === `test-${integration.id}` || !integration.isActive}
                      >
                        {loading === `test-${integration.id}` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <PlayCircle className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => handleDelete(integration.id)}
                        disabled={loading === integration.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>เพิ่ม Integration</DialogTitle>
            <DialogDescription>
              เชื่อมต่อกับบริการภายนอกเพื่อรับการแจ้งเตือน
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Type Selection */}
            <div className="space-y-2">
              <Label>ประเภท</Label>
              <Select
                value={formData.type}
                onValueChange={(v: IntegrationType) => setFormData({ ...formData, type: v, config: {} })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTEGRATION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value} disabled={type.deprecated}>
                      <div className="flex items-center gap-2">
                        {type.icon}
                        <span className={type.deprecated ? "line-through text-muted-foreground" : ""}>
                          {type.label}
                        </span>
                        {type.deprecated && (
                          <Badge variant="outline" className="text-xs text-orange-600 dark:text-orange-400">
                            ยกเลิกแล้ว
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label>ชื่อ</Label>
              <Input
                placeholder="เช่น LINE แจ้งเตือนทีมบัญชี"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Config Fields */}
            {renderConfigFields()}

            {/* Events */}
            <div className="space-y-2">
              <Label>เหตุการณ์ที่แจ้งเตือน</Label>
              <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                {["สถานะกล่อง", "เอกสาร", "งาน", "WHT"].map((category) => (
                  <div key={category} className="mb-3 last:mb-0">
                    <p className="text-xs font-medium text-muted-foreground mb-2">{category}</p>
                    <div className="flex flex-wrap gap-2">
                      {EVENT_TYPES.filter((e) => e.category === category).map((event) => (
                        <Badge
                          key={event.value}
                          variant={formData.events.includes(event.value) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleEvent(event.value)}
                        >
                          {formData.events.includes(event.value) && (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          )}
                          {event.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                เลือก {formData.events.length} รายการ
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleCreate} disabled={loading === "create"}>
              {loading === "create" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              สร้าง Integration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
