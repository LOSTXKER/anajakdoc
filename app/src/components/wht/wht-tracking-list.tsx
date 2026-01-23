"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Receipt, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { WHTTrackingCard } from "./wht-tracking-card";
import { WHTTrackingForm } from "./wht-tracking-form";
import type { SerializedWhtTracking } from "@/types";

interface Contact {
  id: string;
  name: string;
}

interface WHTTrackingListProps {
  boxId: string;
  whtTrackings: SerializedWhtTracking[];
  contacts: Contact[];
  defaultContactId?: string;
  canEdit?: boolean;
}

export function WHTTrackingList({
  boxId,
  whtTrackings,
  contacts,
  defaultContactId,
  canEdit = true,
}: WHTTrackingListProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);

  const outgoingCount = whtTrackings.filter(t => t.type === "OUTGOING").length;
  const incomingCount = whtTrackings.filter(t => t.type === "INCOMING").length;
  const pendingCount = whtTrackings.filter(t => ["PENDING", "ISSUED", "SENT"].includes(t.status)).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          หัก ณ ที่จ่าย
          <span className="text-muted-foreground font-normal text-sm">
            ({whtTrackings.length})
          </span>
          {pendingCount > 0 && (
            <Badge variant="destructive" className="ml-1">
              {pendingCount} รอดำเนินการ
            </Badge>
          )}
        </h3>

        {canEdit && (
          <Button onClick={() => setIsFormOpen(true)} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            เพิ่ม WHT
          </Button>
        )}
      </div>

      {/* Summary */}
      {whtTrackings.length > 0 && (
        <div className="flex gap-4 text-sm">
          {outgoingCount > 0 && (
            <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
              <ArrowUpRight className="h-4 w-4" />
              <span>ส่งออก {outgoingCount}</span>
            </div>
          )}
          {incomingCount > 0 && (
            <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
              <ArrowDownLeft className="h-4 w-4" />
              <span>รับเข้า {incomingCount}</span>
            </div>
          )}
        </div>
      )}

      {/* List */}
      {whtTrackings.length === 0 ? (
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h4 className="font-medium mb-1">ยังไม่มีรายการหัก ณ ที่จ่าย</h4>
          <p className="text-sm text-muted-foreground mb-4">
            เพิ่มรายการติดตามหนังสือหัก ณ ที่จ่ายที่ต้องส่งหรือรอรับ
          </p>
          {canEdit && (
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              เพิ่มรายการแรก
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {whtTrackings.map((tracking) => (
            <WHTTrackingCard key={tracking.id} tracking={tracking} />
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <WHTTrackingForm
        boxId={boxId}
        contacts={contacts}
        defaultContactId={defaultContactId}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
      />
    </div>
  );
}
