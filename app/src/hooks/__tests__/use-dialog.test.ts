import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDialog, useCrudDialog } from "../use-dialog";

describe("useDialog", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Initial State", () => {
    it("should initialize with closed state and no editing item", () => {
      const { result } = renderHook(() => useDialog<{ id: string }>());

      expect(result.current.open).toBe(false);
      expect(result.current.editingItem).toBeNull();
      expect(result.current.isEditMode).toBe(false);
      expect(result.current.isCreateMode).toBe(true);
    });
  });

  describe("openCreate", () => {
    it("should open dialog in create mode", () => {
      const { result } = renderHook(() => useDialog<{ id: string }>());

      act(() => {
        result.current.openCreate();
      });

      expect(result.current.open).toBe(true);
      expect(result.current.editingItem).toBeNull();
      expect(result.current.isCreateMode).toBe(true);
      expect(result.current.isEditMode).toBe(false);
    });
  });

  describe("openEdit", () => {
    it("should open dialog in edit mode with item", () => {
      const { result } = renderHook(() => useDialog<{ id: string; name: string }>());
      const item = { id: "1", name: "Test" };

      act(() => {
        result.current.openEdit(item);
      });

      expect(result.current.open).toBe(true);
      expect(result.current.editingItem).toEqual(item);
      expect(result.current.isEditMode).toBe(true);
      expect(result.current.isCreateMode).toBe(false);
    });
  });

  describe("close", () => {
    it("should close dialog and clear editing item after delay", () => {
      const { result } = renderHook(() => useDialog<{ id: string }>());
      const item = { id: "1" };

      // Open in edit mode
      act(() => {
        result.current.openEdit(item);
      });

      expect(result.current.open).toBe(true);
      expect(result.current.editingItem).toEqual(item);

      // Close
      act(() => {
        result.current.close();
      });

      expect(result.current.open).toBe(false);
      // Item still present before timer
      expect(result.current.editingItem).toEqual(item);

      // Fast forward timer
      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(result.current.editingItem).toBeNull();
    });
  });

  describe("toggle", () => {
    it("should toggle from closed to open", () => {
      const { result } = renderHook(() => useDialog());

      act(() => {
        result.current.toggle();
      });

      expect(result.current.open).toBe(true);
    });

    it("should toggle from open to closed", () => {
      const { result } = renderHook(() => useDialog());

      act(() => {
        result.current.openCreate();
      });

      expect(result.current.open).toBe(true);

      act(() => {
        result.current.toggle();
      });

      expect(result.current.open).toBe(false);
    });
  });

  describe("setOpen", () => {
    it("should set open state directly", () => {
      const { result } = renderHook(() => useDialog());

      act(() => {
        result.current.setOpen(true);
      });

      expect(result.current.open).toBe(true);

      act(() => {
        result.current.setOpen(false);
      });

      expect(result.current.open).toBe(false);
    });
  });

  describe("setEditingItem", () => {
    it("should set editing item directly", () => {
      const { result } = renderHook(() => useDialog<{ id: string }>());
      const item = { id: "123" };

      act(() => {
        result.current.setEditingItem(item);
      });

      expect(result.current.editingItem).toEqual(item);
      expect(result.current.isEditMode).toBe(true);
    });
  });
});

describe("useCrudDialog", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Initial State", () => {
    it("should initialize with all dialogs closed", () => {
      const { result } = renderHook(() => useCrudDialog<{ id: string }>());

      expect(result.current.formOpen).toBe(false);
      expect(result.current.deleteOpen).toBe(false);
      expect(result.current.editingItem).toBeNull();
      expect(result.current.deletingItem).toBeNull();
      expect(result.current.isCreateMode).toBe(true);
      expect(result.current.isEditMode).toBe(false);
    });
  });

  describe("Form Dialog", () => {
    it("should open create dialog", () => {
      const { result } = renderHook(() => useCrudDialog<{ id: string }>());

      act(() => {
        result.current.openCreate();
      });

      expect(result.current.formOpen).toBe(true);
      expect(result.current.editingItem).toBeNull();
      expect(result.current.isCreateMode).toBe(true);
    });

    it("should open edit dialog with item", () => {
      const { result } = renderHook(() => useCrudDialog<{ id: string; name: string }>());
      const item = { id: "1", name: "Test" };

      act(() => {
        result.current.openEdit(item);
      });

      expect(result.current.formOpen).toBe(true);
      expect(result.current.editingItem).toEqual(item);
      expect(result.current.isEditMode).toBe(true);
    });

    it("should close form dialog and clear item after delay", () => {
      const { result } = renderHook(() => useCrudDialog<{ id: string }>());
      const item = { id: "1" };

      act(() => {
        result.current.openEdit(item);
      });

      act(() => {
        result.current.closeForm();
      });

      expect(result.current.formOpen).toBe(false);
      expect(result.current.editingItem).toEqual(item); // Still present

      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(result.current.editingItem).toBeNull();
    });
  });

  describe("Delete Dialog", () => {
    it("should open delete confirmation dialog", () => {
      const { result } = renderHook(() => useCrudDialog<{ id: string; name: string }>());
      const item = { id: "1", name: "Test" };

      act(() => {
        result.current.openDelete(item);
      });

      expect(result.current.deleteOpen).toBe(true);
      expect(result.current.deletingItem).toEqual(item);
    });

    it("should close delete dialog and clear item after delay", () => {
      const { result } = renderHook(() => useCrudDialog<{ id: string }>());
      const item = { id: "1" };

      act(() => {
        result.current.openDelete(item);
      });

      act(() => {
        result.current.closeDelete();
      });

      expect(result.current.deleteOpen).toBe(false);
      expect(result.current.deletingItem).toEqual(item); // Still present

      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(result.current.deletingItem).toBeNull();
    });
  });

  describe("closeAll", () => {
    it("should close all dialogs", () => {
      const { result } = renderHook(() => useCrudDialog<{ id: string }>());
      const item = { id: "1" };

      // Open both dialogs
      act(() => {
        result.current.openEdit(item);
        result.current.openDelete(item);
      });

      expect(result.current.formOpen).toBe(true);
      expect(result.current.deleteOpen).toBe(true);

      // Close all
      act(() => {
        result.current.closeAll();
      });

      expect(result.current.formOpen).toBe(false);
      expect(result.current.deleteOpen).toBe(false);
    });
  });

  describe("Direct setters", () => {
    it("should allow direct state manipulation", () => {
      const { result } = renderHook(() => useCrudDialog<{ id: string }>());

      act(() => {
        result.current.setFormOpen(true);
        result.current.setDeleteOpen(true);
        result.current.setEditingItem({ id: "edit" });
        result.current.setDeletingItem({ id: "delete" });
      });

      expect(result.current.formOpen).toBe(true);
      expect(result.current.deleteOpen).toBe(true);
      expect(result.current.editingItem).toEqual({ id: "edit" });
      expect(result.current.deletingItem).toEqual({ id: "delete" });
    });
  });
});
