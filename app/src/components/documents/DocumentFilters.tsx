"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  X, 
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  Receipt,
  Percent,
  Wallet,
  FileX,
  CreditCard
} from "lucide-react";
import { useState, useTransition, useCallback } from "react";
import { cn } from "@/lib/utils";

interface FilterState {
  type: string[];
  docStatus: string[];
}

export function DocumentFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  const [search, setSearch] = useState(searchParams.get("search") || "");
  
  // Parse current filters from URL
  const currentType = searchParams.get("type") || "";
  const currentVatMissing = searchParams.get("vat_missing") === "true";
  const currentWhtMissing = searchParams.get("wht_missing") === "true";
  const currentPaymentProofMissing = searchParams.get("payment_proof_missing") === "true";
  const currentDocIncomplete = searchParams.get("doc_incomplete") === "true";
  const currentReimburse = searchParams.get("reimburse") === "pending";

  const updateFilters = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    
    params.delete("page"); // Reset to page 1 on filter change
    
    startTransition(() => {
      router.push(`/documents?${params.toString()}`);
    });
  }, [router, searchParams]);

  const updateSearch = useCallback((value: string) => {
    updateFilters({ search: value || null });
  }, [updateFilters]);

  const handleSearch = () => {
    updateSearch(search);
  };

  const clearSearch = () => {
    setSearch("");
    updateSearch("");
  };

  const toggleTypeFilter = (type: "INCOME" | "EXPENSE") => {
    if (currentType === type) {
      updateFilters({ type: null });
    } else {
      updateFilters({ type });
    }
  };

  const toggleDocStatusFilter = (key: string, currentValue: boolean) => {
    updateFilters({ [key]: currentValue ? null : "true" });
  };

  const toggleReimburseFilter = () => {
    updateFilters({ reimburse: currentReimburse ? null : "pending" });
  };

  const clearAllFilters = () => {
    setSearch("");
    updateFilters({
      search: null,
      type: null,
      vat_missing: null,
      wht_missing: null,
      payment_proof_missing: null,
      doc_incomplete: null,
      reimburse: null,
    });
  };

  // Count active filters (excluding search)
  const activeFilterCount = [
    currentType,
    currentVatMissing,
    currentWhtMissing,
    currentPaymentProofMissing,
    currentDocIncomplete,
    currentReimburse,
  ].filter(Boolean).length;

  const hasAnyFilter = activeFilterCount > 0 || search;

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="ค้นหาเลขที่เอกสาร, คำอธิบาย..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="pl-10 pr-10"
        />
        {search && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="default" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">ตัวกรอง</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">ตัวกรองขั้นสูง</h4>
                {hasAnyFilter && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearAllFilters}
                    className="h-auto py-1 px-2 text-xs text-muted-foreground"
                  >
                    ล้างทั้งหมด
                  </Button>
                )}
              </div>

              <Separator />

              {/* Box Type Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">ประเภทกล่อง</Label>
                <div className="flex gap-2">
                  <Button
                    variant={currentType === "INCOME" ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleTypeFilter("INCOME")}
                    className={cn(
                      "flex-1 gap-1.5",
                      currentType === "INCOME" && "bg-emerald-600 hover:bg-emerald-700"
                    )}
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                    รายรับ
                  </Button>
                  <Button
                    variant={currentType === "EXPENSE" ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleTypeFilter("EXPENSE")}
                    className={cn(
                      "flex-1 gap-1.5",
                      currentType === "EXPENSE" && "bg-rose-600 hover:bg-rose-700"
                    )}
                  >
                    <TrendingDown className="h-3.5 w-3.5" />
                    รายจ่าย
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Document Status Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">เอกสารที่ขาด</Label>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="doc_incomplete" 
                    checked={currentDocIncomplete}
                    onCheckedChange={() => toggleDocStatusFilter("doc_incomplete", currentDocIncomplete)}
                  />
                  <label
                    htmlFor="doc_incomplete"
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <FileX className="h-4 w-4 text-amber-600" />
                    เอกสารไม่ครบ (ทั้งหมด)
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="vat_missing" 
                    checked={currentVatMissing}
                    onCheckedChange={() => toggleDocStatusFilter("vat_missing", currentVatMissing)}
                  />
                  <label
                    htmlFor="vat_missing"
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <Receipt className="h-4 w-4 text-yellow-600" />
                    ขาดใบกำกับภาษี (VAT)
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="wht_missing" 
                    checked={currentWhtMissing}
                    onCheckedChange={() => toggleDocStatusFilter("wht_missing", currentWhtMissing)}
                  />
                  <label
                    htmlFor="wht_missing"
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <Percent className="h-4 w-4 text-orange-600" />
                    ขาดหัก ณ ที่จ่าย (WHT)
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="payment_proof_missing" 
                    checked={currentPaymentProofMissing}
                    onCheckedChange={() => toggleDocStatusFilter("payment_proof_missing", currentPaymentProofMissing)}
                  />
                  <label
                    htmlFor="payment_proof_missing"
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <CreditCard className="h-4 w-4 text-blue-600" />
                    ขาดหลักฐานการชำระ
                  </label>
                </div>
              </div>

              <Separator />

              {/* Reimbursement Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">อื่นๆ</Label>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="reimburse" 
                    checked={currentReimburse}
                    onCheckedChange={toggleReimburseFilter}
                  />
                  <label
                    htmlFor="reimburse"
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <Wallet className="h-4 w-4 text-blue-600" />
                    รอคืนเงินพนักงาน
                  </label>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Active Filter Pills */}
        {activeFilterCount > 0 && (
          <div className="hidden sm:flex items-center gap-1.5">
            {currentType === "INCOME" && (
              <Badge variant="secondary" className="gap-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                <TrendingUp className="h-3 w-3" />
                รายรับ
                <button onClick={() => toggleTypeFilter("INCOME")} className="ml-1 hover:text-emerald-900">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {currentType === "EXPENSE" && (
              <Badge variant="secondary" className="gap-1 bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300">
                <TrendingDown className="h-3 w-3" />
                รายจ่าย
                <button onClick={() => toggleTypeFilter("EXPENSE")} className="ml-1 hover:text-rose-900">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {currentDocIncomplete && (
              <Badge variant="secondary" className="gap-1 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">
                เอกสารไม่ครบ
                <button onClick={() => toggleDocStatusFilter("doc_incomplete", true)} className="ml-1 hover:text-amber-900">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {currentVatMissing && (
              <Badge variant="secondary" className="gap-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300">
                ขาด VAT
                <button onClick={() => toggleDocStatusFilter("vat_missing", true)} className="ml-1 hover:text-yellow-900">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {currentWhtMissing && (
              <Badge variant="secondary" className="gap-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300">
                ขาด WHT
                <button onClick={() => toggleDocStatusFilter("wht_missing", true)} className="ml-1 hover:text-orange-900">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {currentPaymentProofMissing && (
              <Badge variant="secondary" className="gap-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                ขาดหลักฐานชำระ
                <button onClick={() => toggleDocStatusFilter("payment_proof_missing", true)} className="ml-1 hover:text-blue-900">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {currentReimburse && (
              <Badge variant="secondary" className="gap-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                รอคืนเงิน
                <button onClick={toggleReimburseFilter} className="ml-1 hover:text-blue-900">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
