"use client";

import Image from "next/image";
import { FileText, File as FileIcon, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileThumbnailProps {
  /** Preview URL (from URL.createObjectURL or fileUrl) */
  src?: string;
  /** MIME type for detecting if image/pdf */
  mimeType?: string;
  /** File name for alt text */
  fileName?: string;
  /** Thumbnail size */
  size?: "xs" | "sm" | "md" | "lg";
  /** Additional class names */
  className?: string;
  /** Use Next.js Image component (true) or native img (false) */
  useNextImage?: boolean;
  /** Show rounded corners */
  rounded?: boolean;
  /** Show border */
  bordered?: boolean;
}

const sizeClasses = {
  xs: "w-10 h-10",
  sm: "w-12 h-12",
  md: "w-20 h-20",
  lg: "w-32 h-32",
};

const iconSizeClasses = {
  xs: "h-5 w-5",
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

/**
 * FileThumbnail - Displays file preview/thumbnail with fallback icon
 * 
 * @example
 * // Image with preview URL
 * <FileThumbnail 
 *   src={previewUrl} 
 *   mimeType="image/jpeg" 
 *   fileName="photo.jpg" 
 * />
 * 
 * @example
 * // PDF file (shows FileText icon)
 * <FileThumbnail 
 *   mimeType="application/pdf" 
 *   fileName="document.pdf" 
 * />
 * 
 * @example
 * // With Next.js Image for optimized loading
 * <FileThumbnail 
 *   src={fileUrl} 
 *   mimeType="image/png" 
 *   useNextImage 
 *   size="lg"
 * />
 */
export function FileThumbnail({
  src,
  mimeType,
  fileName,
  size = "md",
  className,
  useNextImage = false,
  rounded = true,
  bordered = true,
}: FileThumbnailProps) {
  const isImage = mimeType?.startsWith("image/");
  const isPdf = mimeType === "application/pdf" || mimeType?.includes("pdf");

  // Render image preview
  if (isImage && src) {
    const containerClasses = cn(
      sizeClasses[size],
      "relative overflow-hidden",
      rounded && "rounded-lg",
      bordered && "border",
      className
    );

    if (useNextImage) {
      return (
        <div className={containerClasses}>
          <Image 
            src={src} 
            fill 
            alt={fileName || "File preview"} 
            className="object-cover"
            unoptimized={src.startsWith("blob:")}
          />
        </div>
      );
    }

    return (
      <div className={containerClasses}>
        <img 
          src={src} 
          alt={fileName || "File preview"} 
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  // Render fallback icon
  const IconComponent = isPdf ? FileText : isImage ? ImageIcon : FileIcon;
  const iconColor = isPdf ? "text-red-500" : "text-muted-foreground";
  const fileTypeLabel = isPdf ? "PDF document" : isImage ? "Image" : "File";

  return (
    <div 
      role="img"
      aria-label={fileName || fileTypeLabel}
      className={cn(
        sizeClasses[size],
        "flex items-center justify-center bg-muted",
        rounded && "rounded-lg",
        bordered && "border",
        className
      )}
    >
      <IconComponent className={cn(iconSizeClasses[size], iconColor)} aria-hidden="true" />
    </div>
  );
}

/**
 * Helper function to get file icon based on MIME type
 */
export function getFileIcon(mimeType?: string) {
  if (mimeType?.startsWith("image/")) return ImageIcon;
  if (mimeType === "application/pdf" || mimeType?.includes("pdf")) return FileText;
  return FileIcon;
}

/**
 * Helper function to get icon color based on MIME type
 */
export function getFileIconColor(mimeType?: string) {
  if (mimeType === "application/pdf" || mimeType?.includes("pdf")) return "text-red-500";
  return "text-muted-foreground";
}
