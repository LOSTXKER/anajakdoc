"use client";

import { useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/**
 * Generic action result type used by server actions
 */
interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

interface UseServerActionOptions<T> {
  /** Callback when action succeeds */
  onSuccess?: (data?: T) => void;
  /** Callback when action fails */
  onError?: (error: string) => void;
  /** Success message to show via toast */
  successMessage?: string;
  /** Error message to show when action fails (default: "เกิดข้อผิดพลาด") */
  errorMessage?: string;
  /** Whether to refresh the page on success (calls router.refresh()) */
  refreshOnSuccess?: boolean;
  /** Whether to show toast notifications (default: true) */
  showToast?: boolean;
}

/**
 * Hook for handling server actions with loading state, error handling, and toasts.
 * 
 * Replaces the common pattern of:
 * ```typescript
 * const [isPending, startTransition] = useTransition();
 * startTransition(async () => {
 *   const result = await someServerAction(...);
 *   if (result.success) {
 *     toast.success("Success");
 *     router.refresh();
 *   } else {
 *     toast.error(result.error || "เกิดข้อผิดพลาด");
 *   }
 * });
 * ```
 * 
 * @example
 * // Basic usage
 * const { execute, isPending } = useServerAction(deleteItem, {
 *   successMessage: "ลบสำเร็จ",
 *   refreshOnSuccess: true,
 * });
 * 
 * // With typed result
 * const { execute, isPending } = useServerAction<{ id: string }>(createItem, {
 *   onSuccess: (data) => {
 *     router.push(`/items/${data?.id}`);
 *   },
 * });
 */
export function useServerAction<T = unknown, Args extends unknown[] = unknown[]>(
  action: (...args: Args) => Promise<ActionResult<T>>,
  options: UseServerActionOptions<T> = {}
) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    onSuccess,
    onError,
    successMessage,
    errorMessage = "เกิดข้อผิดพลาด",
    refreshOnSuccess = false,
    showToast = true,
  } = options;

  const execute = useCallback(
    (...args: Args) => {
      startTransition(async () => {
        try {
          const result = await action(...args);

          if (result.success) {
            if (showToast && successMessage) {
              toast.success(successMessage);
            }
            if (refreshOnSuccess) {
              router.refresh();
            }
            onSuccess?.(result.data);
          } else {
            const error = result.error || errorMessage;
            if (showToast) {
              toast.error(error);
            }
            onError?.(error);
          }
        } catch (e) {
          const error = e instanceof Error ? e.message : errorMessage;
          if (showToast) {
            toast.error(error);
          }
          onError?.(error);
        }
      });
    },
    [action, onSuccess, onError, successMessage, errorMessage, refreshOnSuccess, showToast, router]
  );

  return {
    execute,
    isPending,
  };
}

/**
 * Simpler version that just handles the result without the hook infrastructure.
 * Useful when you need to handle the result manually or chain actions.
 * 
 * @example
 * const result = await createItem(formData);
 * handleActionResult(result, {
 *   successMessage: "สร้างสำเร็จ",
 *   onSuccess: (data) => router.push(`/items/${data.id}`),
 * });
 */
export function handleActionResult<T>(
  result: ActionResult<T>,
  options: {
    successMessage?: string;
    errorMessage?: string;
    onSuccess?: (data?: T) => void;
    onError?: (error: string) => void;
    showToast?: boolean;
  } = {}
): boolean {
  const {
    successMessage,
    errorMessage = "เกิดข้อผิดพลาด",
    onSuccess,
    onError,
    showToast = true,
  } = options;

  if (result.success) {
    if (showToast && successMessage) {
      toast.success(successMessage);
    }
    onSuccess?.(result.data);
    return true;
  } else {
    const error = result.error || errorMessage;
    if (showToast) {
      toast.error(error);
    }
    onError?.(error);
    return false;
  }
}
