import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useServerAction, handleActionResult } from "../use-server-action";

// Mock dependencies
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn(),
  }),
}));

import { toast } from "sonner";

describe("useServerAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial State", () => {
    it("should return isPending as false initially", () => {
      const mockAction = vi.fn().mockResolvedValue({ success: true });
      
      const { result } = renderHook(() => useServerAction(mockAction));

      expect(result.current.isPending).toBe(false);
      expect(typeof result.current.execute).toBe("function");
    });
  });

  describe("Successful Action", () => {
    it("should show success toast when action succeeds", async () => {
      const mockAction = vi.fn().mockResolvedValue({ success: true, data: { id: "123" } });
      
      const { result } = renderHook(() => 
        useServerAction(mockAction, {
          successMessage: "สำเร็จ",
        })
      );

      act(() => {
        result.current.execute();
      });

      await waitFor(() => {
        expect(mockAction).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith("สำเร็จ");
      });
    });

    it("should call onSuccess callback with data", async () => {
      const onSuccess = vi.fn();
      const mockData = { id: "123", name: "Test" };
      const mockAction = vi.fn().mockResolvedValue({ success: true, data: mockData });
      
      const { result } = renderHook(() => 
        useServerAction(mockAction, {
          onSuccess,
        })
      );

      act(() => {
        result.current.execute();
      });

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(mockData);
      });
    });

    it("should not show toast when showToast is false", async () => {
      const mockAction = vi.fn().mockResolvedValue({ success: true });
      
      const { result } = renderHook(() => 
        useServerAction(mockAction, {
          successMessage: "สำเร็จ",
          showToast: false,
        })
      );

      act(() => {
        result.current.execute();
      });

      await waitFor(() => {
        expect(mockAction).toHaveBeenCalled();
      });
      
      expect(toast.success).not.toHaveBeenCalled();
    });
  });

  describe("Failed Action", () => {
    it("should show error toast when action fails", async () => {
      const mockAction = vi.fn().mockResolvedValue({ 
        success: false, 
        error: "ไม่สามารถบันทึกได้" 
      });
      
      const { result } = renderHook(() => useServerAction(mockAction));

      act(() => {
        result.current.execute();
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("ไม่สามารถบันทึกได้");
      });
    });

    it("should use default error message when none provided", async () => {
      const mockAction = vi.fn().mockResolvedValue({ success: false });
      
      const { result } = renderHook(() => useServerAction(mockAction));

      act(() => {
        result.current.execute();
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("เกิดข้อผิดพลาด");
      });
    });

    it("should use custom error message when provided", async () => {
      const mockAction = vi.fn().mockResolvedValue({ success: false });
      
      const { result } = renderHook(() => 
        useServerAction(mockAction, {
          errorMessage: "ล้มเหลว",
        })
      );

      act(() => {
        result.current.execute();
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("ล้มเหลว");
      });
    });

    it("should call onError callback", async () => {
      const onError = vi.fn();
      const mockAction = vi.fn().mockResolvedValue({ 
        success: false, 
        error: "Error message" 
      });
      
      const { result } = renderHook(() => 
        useServerAction(mockAction, {
          onError,
        })
      );

      act(() => {
        result.current.execute();
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith("Error message");
      });
    });
  });

  describe("Exception Handling", () => {
    it("should handle thrown exceptions", async () => {
      const mockAction = vi.fn().mockRejectedValue(new Error("Network error"));
      
      const { result } = renderHook(() => useServerAction(mockAction));

      act(() => {
        result.current.execute();
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Network error");
      });
    });
  });

  describe("Action Arguments", () => {
    it("should pass arguments to the action", async () => {
      const mockAction = vi.fn().mockResolvedValue({ success: true });
      
      const { result } = renderHook(() => useServerAction(mockAction));

      act(() => {
        result.current.execute("arg1", "arg2", 123);
      });

      await waitFor(() => {
        expect(mockAction).toHaveBeenCalledWith("arg1", "arg2", 123);
      });
    });
  });
});

describe("handleActionResult", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return true and show success toast for successful result", () => {
    const result = handleActionResult(
      { success: true, data: { id: "123" } },
      { successMessage: "สำเร็จ" }
    );

    expect(result).toBe(true);
    expect(toast.success).toHaveBeenCalledWith("สำเร็จ");
  });

  it("should return false and show error toast for failed result", () => {
    const result = handleActionResult(
      { success: false, error: "ล้มเหลว" },
      {}
    );

    expect(result).toBe(false);
    expect(toast.error).toHaveBeenCalledWith("ล้มเหลว");
  });

  it("should call onSuccess callback with data", () => {
    const onSuccess = vi.fn();
    const data = { id: "123" };
    
    handleActionResult(
      { success: true, data },
      { onSuccess }
    );

    expect(onSuccess).toHaveBeenCalledWith(data);
  });

  it("should call onError callback with error", () => {
    const onError = vi.fn();
    
    handleActionResult(
      { success: false, error: "Error" },
      { onError }
    );

    expect(onError).toHaveBeenCalledWith("Error");
  });

  it("should not show toast when showToast is false", () => {
    handleActionResult(
      { success: true },
      { successMessage: "สำเร็จ", showToast: false }
    );

    expect(toast.success).not.toHaveBeenCalled();
  });
});
