"use client";

import { useState } from "react";
import { Building2, Wallet, User, Plus, X, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ==================== Types ====================

export type PayerType = "COMPANY" | "PETTY_CASH" | "MEMBER";

export interface Payer {
  id: string;
  payerType: PayerType;
  memberId?: string;
  amount: number;
}

interface Member {
  id: string;
  name: string;
  visibleName?: string | null;
}

interface PayerSelectorProps {
  totalAmount: number;
  payers: Payer[];
  onPayersChange: (payers: Payer[]) => void;
  members: Member[];
  disabled?: boolean;
}

// ==================== Config ====================

const PAYER_TYPES = [
  {
    value: "COMPANY" as const,
    label: "บัญชีบริษัท",
    icon: Building2,
    description: "จ่ายจากบัญชีบริษัทโดยตรง",
  },
  {
    value: "PETTY_CASH" as const,
    label: "เงินสดย่อย",
    icon: Wallet,
    description: "จ่ายจากเงินสดย่อย",
  },
  {
    value: "MEMBER" as const,
    label: "สมาชิก",
    icon: User,
    description: "สมาชิกสำรองจ่าย (ต้องคืนเงิน)",
  },
];

// ==================== Helper ====================

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

function getMemberDisplayName(member: Member) {
  return member.visibleName || member.name;
}

// ==================== Component ====================

export function PayerSelector({
  totalAmount,
  payers,
  onPayersChange,
  members,
  disabled = false,
}: PayerSelectorProps) {
  const [isSplitMode, setIsSplitMode] = useState(payers.length > 1);

  // Calculate totals
  const payerTotal = payers.reduce((sum, p) => sum + (p.amount || 0), 0);
  const isValidTotal = Math.abs(payerTotal - totalAmount) < 0.01;
  const hasMemberPayer = payers.some((p) => p.payerType === "MEMBER");

  // Ensure at least one payer exists
  if (payers.length === 0) {
    onPayersChange([
      { id: generateId(), payerType: "COMPANY", amount: totalAmount },
    ]);
    return null;
  }

  const handleToggleSplitMode = (enabled: boolean) => {
    setIsSplitMode(enabled);
    if (!enabled && payers.length > 1) {
      // Keep only first payer with full amount
      onPayersChange([{ ...payers[0], amount: totalAmount }]);
    }
  };

  const handleAddPayer = () => {
    const remaining = totalAmount - payerTotal;
    onPayersChange([
      ...payers,
      { id: generateId(), payerType: "COMPANY", amount: Math.max(0, remaining) },
    ]);
  };

  const handleRemovePayer = (id: string) => {
    if (payers.length <= 1) return;
    onPayersChange(payers.filter((p) => p.id !== id));
  };

  const handlePayerChange = (id: string, updates: Partial<Payer>) => {
    onPayersChange(
      payers.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const handleSplitEqually = () => {
    if (payers.length === 0) return;
    const amountPerPayer = Math.floor((totalAmount / payers.length) * 100) / 100;
    const remainder = totalAmount - amountPerPayer * payers.length;
    
    onPayersChange(
      payers.map((p, i) => ({
        ...p,
        amount: i === 0 ? amountPerPayer + remainder : amountPerPayer,
      }))
    );
  };

  return (
    <div className="space-y-4">
      {/* Header with Split Toggle */}
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 text-base font-medium">
          <Wallet className="h-4 w-4" />
          ผู้จ่ายเงิน
        </Label>
        <div className="flex items-center gap-2">
          <Label htmlFor="split-mode" className="text-sm text-muted-foreground">
            แชร์จ่าย
          </Label>
          <Switch
            id="split-mode"
            checked={isSplitMode}
            onCheckedChange={handleToggleSplitMode}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Payers List */}
      <div className="space-y-4">
        {payers.map((payer, index) => (
          <PayerRow
            key={payer.id}
            payer={payer}
            index={index}
            members={members}
            showRemove={isSplitMode && payers.length > 1}
            showAmount={isSplitMode}
            singlePayerAmount={!isSplitMode ? totalAmount : undefined}
            disabled={disabled}
            onChange={(updates) => handlePayerChange(payer.id, updates)}
            onRemove={() => handleRemovePayer(payer.id)}
          />
        ))}
      </div>

      {/* Actions (only in split mode) */}
      {isSplitMode && (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddPayer}
            disabled={disabled}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            เพิ่มผู้จ่าย
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSplitEqually}
            disabled={disabled || payers.length < 2}
          >
            <Calculator className="h-4 w-4 mr-1.5" />
            หารเท่าๆ กัน
          </Button>
        </div>
      )}

      {/* Validation / Summary */}
      {isSplitMode && (
        <div
          className={cn(
            "flex items-center justify-between p-3 rounded-lg text-sm",
            isValidTotal
              ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400"
              : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400"
          )}
        >
          <span>ยอดรวมที่ระบุ:</span>
          <span className="font-medium">
            ฿{payerTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} / ฿
            {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      )}

      {/* Info note */}
      {hasMemberPayer && (
        <p className="text-xs text-muted-foreground bg-muted/50 p-2.5 rounded-lg">
          รายการที่จ่ายโดยสมาชิก จะปรากฏในหน้า &quot;คืนเงินสมาชิก&quot; เพื่อติดตามการโอนคืน
        </p>
      )}
    </div>
  );
}

// ==================== Payer Row Component ====================

interface PayerRowProps {
  payer: Payer;
  index: number;
  members: Member[];
  showRemove: boolean;
  showAmount: boolean;
  singlePayerAmount?: number;
  disabled: boolean;
  onChange: (updates: Partial<Payer>) => void;
  onRemove: () => void;
}

function PayerRow({
  payer,
  index,
  members,
  showRemove,
  showAmount,
  singlePayerAmount,
  disabled,
  onChange,
  onRemove,
}: PayerRowProps) {
  const selectedMember = members.find((m) => m.id === payer.memberId);

  return (
    <div className="space-y-3 p-4 rounded-xl border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          ผู้จ่าย #{index + 1}
        </span>
        {showRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onRemove}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Payer Type Selection */}
      <div className="space-y-2">
        <Label className="text-sm">ประเภทผู้จ่าย</Label>
        <div className="grid grid-cols-3 gap-2">
          {PAYER_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = payer.payerType === type.value;
            return (
              <button
                key={type.value}
                type="button"
                onClick={() => onChange({ payerType: type.value, memberId: undefined })}
                disabled={disabled}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    isSelected ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <span
                  className={cn(
                    "text-xs font-medium",
                    isSelected ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {type.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Member Selection (only for MEMBER type) */}
      {payer.payerType === "MEMBER" && (
        <div className="space-y-2">
          <Label className="text-sm">สมาชิก</Label>
          <Select
            value={payer.memberId || ""}
            onValueChange={(value) => onChange({ memberId: value })}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="เลือกสมาชิก">
                {selectedMember && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {getMemberDisplayName(selectedMember)}
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {members.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {getMemberDisplayName(member)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Amount Input */}
      {showAmount && (
        <div className="space-y-2">
          <Label className="text-sm">จำนวนเงิน</Label>
          <div className="relative">
            <Input
              type="number"
              step="0.01"
              min="0"
              value={payer.amount || ""}
              onChange={(e) => onChange({ amount: parseFloat(e.target.value) || 0 })}
              className="pr-12"
              disabled={disabled}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              บาท
            </span>
          </div>
        </div>
      )}

      {/* Single payer amount display */}
      {!showAmount && singlePayerAmount !== undefined && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">จำนวนเงิน</span>
          <span className="font-medium">
            ฿{singlePayerAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      )}
    </div>
  );
}
