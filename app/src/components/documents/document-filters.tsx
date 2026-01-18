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
import { Search, X, Filter } from "lucide-react";
import { useState, useTransition } from "react";

const statusOptions = [
  { value: "all", label: "ทุกสถานะ" },
  { value: "DRAFT", label: "แบบร่าง" },
  { value: "PENDING_REVIEW", label: "รอตรวจ" },
  { value: "NEED_INFO", label: "ขอข้อมูลเพิ่ม" },
  { value: "READY_TO_EXPORT", label: "พร้อม Export" },
  { value: "EXPORTED", label: "Export แล้ว" },
  { value: "BOOKED", label: "บันทึกแล้ว" },
];

const typeOptions = [
  { value: "all", label: "ทุกประเภท" },
  { value: "EXPENSE", label: "รายจ่าย" },
  { value: "INCOME", label: "รายรับ" },
];

export function DocumentFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const status = searchParams.get("status") || "all";
  const type = searchParams.get("type") || "all";

  const updateFilters = (key: string, value: string) => {
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
  };

  const handleSearch = () => {
    updateFilters("search", search);
  };

  const clearFilters = () => {
    setSearch("");
    startTransition(() => {
      router.push("/documents");
    });
  };

  const hasFilters = search || status !== "all" || type !== "all";

  return (
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
  );
}
