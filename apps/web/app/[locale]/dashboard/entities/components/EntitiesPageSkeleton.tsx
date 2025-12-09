import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TableSkeleton } from "@/components/shared/skeletons";

/**
 * Loading skeleton for Entities page content
 * Shows loading state for the entities table only (title loads immediately)
 */
export function EntitiesPageSkeleton() {
  return (
    <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full max-w-md" />
          {/* Search bar skeleton */}
          <div className="mt-4">
            <Skeleton className="h-10 w-full max-w-sm" />
          </div>
        </CardHeader>
      <CardContent>
        {/* Table skeleton */}
        <TableSkeleton rows={5} columns={2} />
      </CardContent>
    </Card>
  );
}
