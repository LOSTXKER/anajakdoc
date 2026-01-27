"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { useState, useTransition, useCallback } from "react";

export function DocumentFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  const [search, setSearch] = useState(searchParams.get("search") || "");

  const updateSearch = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (!value) {
      params.delete("search");
    } else {
      params.set("search", value);
    }
    
    params.delete("page"); // Reset to page 1 on search change
    
    startTransition(() => {
      router.push(`/documents?${params.toString()}`);
    });
  }, [router, searchParams]);

  const handleSearch = () => {
    updateSearch(search);
  };

  const clearSearch = () => {
    setSearch("");
    updateSearch("");
  };

  return (
    <div className="relative max-w-md">
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
  );
}
