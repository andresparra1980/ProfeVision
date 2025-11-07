import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TableSkeleton } from "@/components/shared/skeletons";

/**
 * Loading skeleton for Students page
 * Mimics the structure of the students table page with search and table
 */
export function StudentsPageSkeleton() {
  return (
    <div className="space-y-4">
      {/* Title and description skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>

      {/* Main card with search and table */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full max-w-md" />
          {/* Search bar skeleton */}
          <div className="mt-4 flex items-center justify-between">
            <Skeleton className="h-10 w-full max-w-sm" />
            <Skeleton className="h-10 w-32 ml-2" />
          </div>
        </CardHeader>
        <CardContent>
          {/* Table skeleton */}
          <TableSkeleton rows={5} columns={5} />
        </CardContent>
      </Card>
    </div>
  );
}
