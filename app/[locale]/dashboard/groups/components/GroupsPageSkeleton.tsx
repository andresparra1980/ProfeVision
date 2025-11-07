import { CardSkeleton } from "@/components/shared/skeletons";

/**
 * Loading skeleton for Groups page content
 * Shows loading state for the groups grid only (title loads immediately)
 */
export function GroupsPageSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <CardSkeleton key={i} showHeader={true} contentLines={3} showFooter={true} />
      ))}
    </div>
  );
}
