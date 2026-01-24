"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bookmark, Star, Trash2, Loader2, Plus, Check } from "lucide-react";
import { toast } from "sonner";
import {
  createSavedFilter,
  deleteSavedFilter,
  updateSavedFilter,
  type SavedFilterData,
} from "@/server/actions/saved-filter";

interface SavedFiltersProps {
  filters: SavedFilterData[];
  currentFilters: Record<string, unknown>;
  onApplyFilter: (filters: Record<string, unknown>) => void;
}

export function SavedFilters({
  filters,
  currentFilters,
  onApplyFilter,
}: SavedFiltersProps) {
  const [isPending, startTransition] = useTransition();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState("");

  const hasActiveFilters = Object.keys(currentFilters).some(
    key => currentFilters[key] !== undefined && currentFilters[key] !== ""
  );

  const handleSaveFilter = () => {
    if (!filterName.trim()) {
      toast.error("กรุณากรอกชื่อ filter");
      return;
    }

    startTransition(async () => {
      const result = await createSavedFilter(filterName, currentFilters);
      if (result.success) {
        toast.success("บันทึก filter เรียบร้อย");
        setShowSaveDialog(false);
        setFilterName("");
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  const handleApplyFilter = (filter: SavedFilterData) => {
    onApplyFilter(filter.filters);
    toast.success(`ใช้ filter "${filter.name}"`);
  };

  const handleSetDefault = (filter: SavedFilterData) => {
    startTransition(async () => {
      const result = await updateSavedFilter(filter.id, { isDefault: true });
      if (result.success) {
        toast.success(`ตั้ง "${filter.name}" เป็นค่าเริ่มต้น`);
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  const handleDeleteFilter = (filter: SavedFilterData) => {
    if (!confirm(`ลบ filter "${filter.name}"?`)) return;

    startTransition(async () => {
      const result = await deleteSavedFilter(filter.id);
      if (result.success) {
        toast.success("ลบ filter เรียบร้อย");
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Bookmark className="h-4 w-4" />
            Filter ที่บันทึก
            {filters.length > 0 && (
              <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                {filters.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          {filters.length === 0 ? (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              ยังไม่มี filter ที่บันทึก
            </div>
          ) : (
            filters.map((filter) => (
              <DropdownMenuItem
                key={filter.id}
                className="flex items-center justify-between group"
                onSelect={(e) => e.preventDefault()}
              >
                <button
                  className="flex items-center gap-2 flex-1 text-left"
                  onClick={() => handleApplyFilter(filter)}
                >
                  {filter.isDefault && (
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                  )}
                  <span className="truncate">{filter.name}</span>
                </button>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!filter.isDefault && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleSetDefault(filter)}
                      title="ตั้งเป็นค่าเริ่มต้น"
                    >
                      <Star className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive"
                    onClick={() => handleDeleteFilter(filter)}
                    title="ลบ"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </DropdownMenuItem>
            ))
          )}
          
          {hasActiveFilters && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setShowSaveDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                บันทึก filter ปัจจุบัน
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>บันทึก Filter</DialogTitle>
            <DialogDescription>
              ตั้งชื่อ filter เพื่อใช้งานในภายหลัง
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="ชื่อ filter เช่น 'ค่าใช้จ่ายรอตรวจ'"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveFilter()}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSaveDialog(false)}
            >
              ยกเลิก
            </Button>
            <Button onClick={handleSaveFilter} disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
