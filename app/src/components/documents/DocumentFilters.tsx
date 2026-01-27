"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Filter } from "lucide-react";
import { useState, useTransition, useCallback } from "react";
import { SavedFilters } from "./SavedFilters";
import type { SavedFilterData } from "@/server/actions/saved-filter";

interface DocumentFiltersProps {
  savedFilters?: SavedFilterData[];
}

export function DocumentFilters({ savedFilters = [] }: DocumentFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  const [search, setSearch] = useState(searchParams.get("search") || "");

  const updateFilters = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (!value) {
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
    return filters;
  };

  const hasFilters = !!search;

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
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

      {/* Saved Filters */}
      <SavedFilters
        filters={savedFilters}
        currentFilters={getCurrentFilters()}
        onApplyFilter={applyFilterSet}
      />

      {/* Clear Filters */}
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} disabled={isPending}>
          <X className="mr-1 h-4 w-4" />
          ล้าง
        </Button>
      )}
    </div>
  );
}
