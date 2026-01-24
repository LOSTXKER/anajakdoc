"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Search, Building2, Loader2, CheckCircle2 } from "lucide-react";
import { searchFirms, inviteFirm, type FirmSearchResult } from "@/server/actions/firm-relation";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function InviteFirmDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FirmSearchResult[]>([]);
  const [selectedFirm, setSelectedFirm] = useState<FirmSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSearch = async (value: string) => {
    setQuery(value);
    setSelectedFirm(null);
    
    if (value.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const firms = await searchFirms(value);
      setResults(firms);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInvite = () => {
    if (!selectedFirm) return;

    startTransition(async () => {
      const result = await inviteFirm(selectedFirm.id);
      if (result.success) {
        toast.success("ส่งคำเชิญสำเร็จ", {
          description: `ส่งคำเชิญไปยัง ${selectedFirm.name} แล้ว`,
        });
        setOpen(false);
        setQuery("");
        setResults([]);
        setSelectedFirm(null);
        router.refresh();
      } else {
        toast.error("เกิดข้อผิดพลาด", {
          description: result.error,
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          เชิญสำนักบัญชี
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>เชิญสำนักบัญชี</DialogTitle>
          <DialogDescription>
            ค้นหาและเชิญสำนักบัญชีมาดูแลธุรกิจของคุณ
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="search">ค้นหาสำนักบัญชี</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="พิมพ์ชื่อหรือ slug..."
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Search Results */}
          {isSearching && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isSearching && results.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {results.map((firm) => (
                <button
                  key={firm.id}
                  type="button"
                  onClick={() => setSelectedFirm(firm)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                    selectedFirm?.id === firm.id
                      ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
                    {firm.logo ? (
                      <img src={firm.logo} alt={firm.name} className="h-6 w-6 rounded" />
                    ) : (
                      <Building2 className="h-5 w-5 text-violet-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{firm.name}</p>
                    <p className="text-sm text-muted-foreground">@{firm.slug}</p>
                  </div>
                  {selectedFirm?.id === firm.id && (
                    <CheckCircle2 className="h-5 w-5 text-violet-600 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}

          {!isSearching && query.length >= 2 && results.length === 0 && (
            <div className="text-center py-4 text-sm text-muted-foreground">
              ไม่พบสำนักบัญชีที่ค้นหา
            </div>
          )}

          {query.length < 2 && !selectedFirm && (
            <div className="text-center py-4 text-sm text-muted-foreground">
              พิมพ์อย่างน้อย 2 ตัวอักษรเพื่อค้นหา
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            ยกเลิก
          </Button>
          <Button
            onClick={handleInvite}
            disabled={!selectedFirm || isPending}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                กำลังส่ง...
              </>
            ) : (
              "ส่งคำเชิญ"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
