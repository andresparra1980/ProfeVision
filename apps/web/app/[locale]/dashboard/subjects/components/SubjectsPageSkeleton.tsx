import { Skeleton } from "@/components/ui/skeleton";
import { CardSkeleton } from "@/components/shared/skeletons";

/**
 * Loading skeleton for Subjects page
 * Mimics the grid structure with subject cards
 */
export function SubjectsPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Title and description skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>

      {/* Grid of card skeletons */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <CardSkeleton key={i} showHeader={true} contentLines={2} showFooter={false} />
        ))}
      </div>
    </div>
  );
}
