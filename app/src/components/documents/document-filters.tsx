"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { useState, useTransition, useCallback } from "react";
import { SavedFilters } from "./saved-filters";
import type { SavedFilterData } from "@/server/actions/saved-filter";

interface DocumentFiltersProps {
  savedFilters?: SavedFilterData[];
}

const statusOptions = [
  { value: "all", label: "ทุกสถานะ" },
  { value: "DRAFT", label: "แบบร่าง" },
  { value: "SUBMITTED", label: "ส่งแล้ว" },
  { value: "IN_REVIEW", label: "กำลังตรวจ" },
  { value: "NEED_MORE_DOCS", label: "ขอเอกสารเพิ่ม" },
  { value: "READY_TO_BOOK", label: "พร้อมลงบัญชี" },
  { value: "WHT_PENDING", label: "รอ WHT" },
  { value: "BOOKED", label: "ลงบัญชีแล้ว" },
  { value: "ARCHIVED", label: "เก็บแล้ว" },
  { value: "CANCELLED", label: "ยกเลิก" },
];

const typeOptions = [
  { value: "all", label: "ทุกประเภท" },
  { value: "EXPENSE", label: "รายจ่าย" },
  { value: "INCOME", label: "รายรับ" },
];

export function DocumentFilters({ savedFilters = [] }: DocumentFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const status = searchParams.get("status") || "all";
  const type = searchParams.get("type") || "all";

  const updateFilters = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value === "all" || !value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    
    params.delete("page"); // Reset to page 1 on filter change
    
    startTransition(() => {
      router.push(`/documents?${params.toString()}`);
    });
  }, [router, searchParams]);

  const handleSearch = () => {
    updateFilters("search", search);
  };

  const clearFilters = () => {
    setSearch("");
    startTransition(() => {
      router.push("/documents");
    });
  };

  const applyFilterSet = (filters: Record<string, unknown>) => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "all") {
        params.set(key, String(value));
      }
    });
    
    if (filters.search) {
      setSearch(String(filters.search));
    } else {
      setSearch("");
    }
    
    startTransition(() => {
      router.push(`/documents?${params.toString()}`);
    });
  };

  const getCurrentFilters = (): Record<string, unknown> => {
    const filters: Record<string, unknown> = {};
    if (search) filters.search = search;
    if (status !== "all") filters.status = status;
    if (type !== "all") filters.type = type;
    return filters;
  };

  const hasFilters = search || status !== "all" || type !== "all";

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
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
              onClick={() => {
                setSearch("");
                updateFilters("search", "");
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <Select value={status} onValueChange={(v) => updateFilters("status", v)}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="สถานะ" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Type Filter */}
        <Select value={type} onValueChange={(v) => updateFilters("type", v)}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="ประเภท" />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasFilters && (
          <Button variant="ghost" onClick={clearFilters} disabled={isPending}>
            <X className="mr-2 h-4 w-4" />
            ล้างตัวกรอง
          </Button>
        )}
      </div>

      {/* Saved Filters */}
      <div className="flex items-center gap-2">
        <SavedFilters
          filters={savedFilters}
          currentFilters={getCurrentFilters()}
          onApplyFilter={applyFilterSet}
        />
      </div>
    </div>
  );
}
