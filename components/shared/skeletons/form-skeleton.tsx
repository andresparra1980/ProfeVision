import { Skeleton } from "@/components/ui/skeleton";

interface FormSkeletonProps {
  /** Number of form fields to show */
  fields?: number;
  /** Show submit button */
  showButton?: boolean;
}

/**
 * Form skeleton that mimics form structure with labels and input fields
 * Used for settings and other form-based displays
 */
export function FormSkeleton({ fields = 5, showButton = true }: FormSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          {/* Label skeleton */}
          <Skeleton className="h-4 w-24" />
          {/* Input skeleton */}
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      {showButton && (
        <Skeleton className="h-10 w-32 mt-6" />
      )}
    </div>
  );
}
