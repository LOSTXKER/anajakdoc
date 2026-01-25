"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Search, Package, Calendar, Loader2 } from "lucide-react";
import Link from "next/link";
import { searchBoxes } from "@/server/actions/box";
import { getBoxStatusConfig, getDocStatusConfig, getBoxTypeConfig } from "@/lib/document-config";
import type { BoxStatus, DocStatus } from "@/types";

interface SearchResult {
  id: string;
  boxNumber: string;
  title: string | null;
  boxDate: Date;
  totalAmount: { toString(): string } | number;
  status: string;
  docStatus: string;
  category: { name: string } | null;
  createdBy: { name: string | null };
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    
    // Update URL
    router.push(`/search?q=${encodeURIComponent(query)}`);
    
    const result = await searchBoxes(query);
    setResults(result);
    setIsSearching(false);
  };

  // Search on mount if query exists
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setQuery(q);
      handleSearch();
    }
  }, []);

  return (
    <>
      <AppHeader 
        title="ค้นหากล่องเอกสาร" 
        description="ค้นหาด้วยเลขที่กล่อง รายละเอียด หรือชื่อผู้ติดต่อ"
        showCreateButton={false}
      />
      
      <div className="p-6 max-w-4xl">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหาเลขที่กล่อง, รายละเอียด, ชื่อผู้ติดต่อ..."
              className="pl-10 h-12"
              autoFocus
            />
          </div>
          <Button type="submit" size="lg" disabled={isSearching}>
            {isSearching ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "ค้นหา"
            )}
          </Button>
        </form>

        {/* Results */}
        {isSearching ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-2 text-muted-foreground">กำลังค้นหา...</p>
          </div>
        ) : hasSearched && results.length === 0 ? (
          <EmptyState
            icon={Search}
            title="ไม่พบผลลัพธ์"
            description="ลองค้นหาด้วยคำอื่น"
            className="py-12"
          />
        ) : results.length > 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              พบ {results.length} รายการ
            </p>
            {results.map((box) => {
              const statusConfig = getBoxStatusConfig(box.status as BoxStatus);
              const docStatusConfig = getDocStatusConfig(box.docStatus as DocStatus);
              return (
                <Link key={box.id} href={`/documents/${box.id}`}>
                  <Card className="hover:border-primary transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                            <Package className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold">{box.boxNumber}</h3>
                              <Badge className={statusConfig.className}>
                                {statusConfig.label}
                              </Badge>
                              <Badge variant="outline" className={docStatusConfig.className}>
                                {docStatusConfig.label}
                              </Badge>
                            </div>
                            {box.title && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                {box.title}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(box.boxDate).toLocaleDateString("th-TH")}
                              </span>
                              {box.category && (
                                <span>{box.category.name}</span>
                              )}
                              <span>โดย {box.createdBy.name || "ไม่ระบุ"}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-primary">
                            ฿{Number(box.totalAmount).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto opacity-50 mb-4" />
            <p>พิมพ์คำค้นหาเพื่อเริ่มต้น</p>
          </div>
        )}
      </div>
    </>
  );
}
