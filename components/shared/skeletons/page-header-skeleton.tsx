import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton for page header matching TitleCardWithDepth structure
 * Shows loading state for title, description, and action buttons
 */
export function PageHeaderSkeleton() {
  return (
    <div className="space-y-2">
      {/* Title skeleton */}
      <Skeleton className="h-10 w-64" />
      {/* Description skeleton */}
      <Skeleton className="h-4 w-full max-w-md" />
      {/* Actions skeleton (optional buttons area) */}
      <div className="flex gap-2 mt-4">
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}
