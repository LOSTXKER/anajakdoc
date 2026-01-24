"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Check } from "lucide-react";
import { Button, buttonVariants } from "./button";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";

interface SubmitButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  /** Text to show while loading */
  loadingText?: string;
  /** Icon to show when not loading (defaults to Check) */
  icon?: React.ReactNode;
  /** Whether to show the success icon */
  showIcon?: boolean;
  /** External pending state (use when not inside a form with useFormStatus) */
  isPending?: boolean;
}

/**
 * Submit button that automatically shows loading state during form submission.
 * 
 * Uses `useFormStatus` internally to detect pending state when used inside
 * a form with a server action. Can also accept external `isPending` prop.
 * 
 * @example
 * // Inside a form with server action (auto-detects pending)
 * <form action={submitForm}>
 *   <SubmitButton>บันทึก</SubmitButton>
 * </form>
 * 
 * @example
 * // With external pending state
 * <SubmitButton isPending={isPending} loadingText="กำลังบันทึก...">
 *   บันทึก
 * </SubmitButton>
 * 
 * @example
 * // With custom icon
 * <SubmitButton icon={<Send className="h-4 w-4" />}>
 *   ส่ง
 * </SubmitButton>
 */
export function SubmitButton({
  children,
  loadingText,
  icon,
  showIcon = true,
  isPending: externalPending,
  disabled,
  className,
  variant = "default",
  size = "default",
  ...props
}: SubmitButtonProps) {
  const { pending: formPending } = useFormStatus();
  const isPending = externalPending ?? formPending;

  return (
    <Button
      type="submit"
      disabled={disabled || isPending}
      variant={variant}
      size={size}
      className={className}
      {...props}
    >
      {isPending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingText || children}
        </>
      ) : (
        <>
          {showIcon && (icon || <Check className="h-4 w-4" />)}
          {children}
        </>
      )}
    </Button>
  );
}

/**
 * Simple loading button without useFormStatus.
 * Use when you need manual control over loading state.
 * 
 * @example
 * <LoadingButton loading={isLoading} onClick={handleClick}>
 *   ดำเนินการ
 * </LoadingButton>
 */
export function LoadingButton({
  children,
  loading = false,
  loadingText,
  icon,
  showIcon = false,
  disabled,
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean;
    loadingText?: string;
    icon?: React.ReactNode;
    showIcon?: boolean;
  }) {
  return (
    <Button
      disabled={disabled || loading}
      variant={variant}
      size={size}
      className={className}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingText || children}
        </>
      ) : (
        <>
          {showIcon && icon}
          {children}
        </>
      )}
    </Button>
  );
}
