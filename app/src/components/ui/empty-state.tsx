import { cn } from "@/lib/utils";
import { Package, type LucideIcon } from "lucide-react";

/**
 * Props for the EmptyState component
 */
interface EmptyStateProps {
  /** Lucide icon to display (defaults to Package) */
  icon?: LucideIcon;
  /** Main title text */
  title: string;
  /** Optional description text below the title */
  description?: string;
  /** Optional action button/element to display */
  action?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Empty State - Displays a centered placeholder when there's no data.
 * 
 * Use this component to provide visual feedback and actions when a list
 * or section has no items to display.
 * 
 * @example
 * // Basic usage
 * <EmptyState
 *   title="ยังไม่มีข้อมูล"
 *   description="เริ่มต้นโดยการเพิ่มรายการแรก"
 * />
 * 
 * @example
 * // With custom icon and action
 * <EmptyState
 *   icon={FileText}
 *   title="ยังไม่มีเอกสาร"
 *   description="อัปโหลดเอกสารเพื่อเริ่มต้น"
 *   action={
 *     <Button onClick={handleUpload}>
 *       <Upload className="mr-2 h-4 w-4" />
 *       อัปโหลด
 *     </Button>
 *   }
 * />
 * 
 * @example
 * // With custom padding
 * <EmptyState
 *   title="ไม่พบผลลัพธ์"
 *   className="py-8"
 * />
 */
export function EmptyState({
  icon: Icon = Package,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div 
      role="status"
      aria-label={title}
      className={cn("flex flex-col items-center py-16 animate-fade-in", className)}
    >
      <div 
        className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4"
        aria-hidden="true"
      >
        <Icon className="w-8 h-8 text-primary" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="text-muted-foreground mt-1 text-center max-w-sm">{description}</p>
      )}
      {action && <div className="mt-6" role="group" aria-label="Actions">{action}</div>}
    </div>
  );
}
