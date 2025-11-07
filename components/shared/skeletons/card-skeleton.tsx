import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";

interface CardSkeletonProps {
  /** Show header section */
  showHeader?: boolean;
  /** Show footer section */
  showFooter?: boolean;
  /** Number of content lines to show */
  contentLines?: number;
}

/**
 * Generic card skeleton that can be configured for different card layouts
 * Used for subjects, groups, and other card-based displays
 */
export function CardSkeleton({
  showHeader = true,
  showFooter = false,
  contentLines = 3
}: CardSkeletonProps) {
  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
      )}
      <CardContent className="space-y-2">
        {Array.from({ length: contentLines }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </CardContent>
      {showFooter && (
        <CardFooter>
          <Skeleton className="h-10 w-full" />
        </CardFooter>
      )}
    </Card>
  );
}
