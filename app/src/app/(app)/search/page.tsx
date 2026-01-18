"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Calendar, DollarSign, Loader2 } from "lucide-react";
import Link from "next/link";
import { searchDocuments } from "@/server/actions/document";

interface SearchResult {
  id: string;
  docNumber: string;
  description: string | null;
  docDate: Date;
  totalAmount: { toString(): string } | number;
  status: string;
  category: { name: string } | null;
  submittedBy: { name: string | null };
}

const statusLabels: Record<string, string> = {
  DRAFT: "แบบร่าง",
  PENDING_REVIEW: "รอตรวจ",
  NEED_INFO: "ขอข้อมูลเพิ่ม",
  READY_TO_EXPORT: "พร้อม Export",
  EXPORTED: "Export แล้ว",
  BOOKED: "บันทึกแล้ว",
  REJECTED: "ปฏิเสธ",
  VOID: "ยกเลิก",
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  PENDING_REVIEW: "bg-blue-100 text-blue-700",
  NEED_INFO: "bg-orange-100 text-orange-700",
  READY_TO_EXPORT: "bg-green-100 text-green-700",
  EXPORTED: "bg-purple-100 text-purple-700",
  BOOKED: "bg-teal-100 text-teal-700",
  REJECTED: "bg-red-100 text-red-700",
  VOID: "bg-gray-100 text-gray-500",
};

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
    
    const result = await searchDocuments(query);
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
        title="ค้นหาเอกสาร" 
        description="ค้นหาเอกสารด้วยเลขที่เอกสาร รายละเอียด หรือชื่อผู้ติดต่อ"
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
              placeholder="ค้นหาเลขที่เอกสาร, รายละเอียด, ชื่อผู้ติดต่อ..."
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
          <div className="text-center py-12">
            <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium">ไม่พบผลลัพธ์</p>
            <p className="text-muted-foreground">ลองค้นหาด้วยคำอื่น</p>
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              พบ {results.length} รายการ
            </p>
            {results.map((doc) => (
              <Link key={doc.id} href={`/documents/${doc.id}`}>
                <Card className="hover:border-primary transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{doc.docNumber}</h3>
                            <Badge className={statusColors[doc.status]}>
                              {statusLabels[doc.status]}
                            </Badge>
                          </div>
                          {doc.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                              {doc.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(doc.docDate).toLocaleDateString("th-TH")}
                            </span>
                            {doc.category && (
                              <span>{doc.category.name}</span>
                            )}
                            <span>โดย {doc.submittedBy.name || "ไม่ระบุ"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">
                          ฿{Number(doc.totalAmount).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
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
