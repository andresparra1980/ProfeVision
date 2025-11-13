import { CardSkeleton } from "@/components/shared/skeletons";

/**
 * Loading skeleton for Exams page
 * Mimics the grid/accordion structure with exam cards
 * Note: Search bar is rendered separately in the parent component
 */
export function ExamsPageSkeleton() {
  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 items-start auto-rows-min">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <CardSkeleton
          key={i}
          showHeader={true}
          contentLines={4}
          showFooter={false}
        />
      ))}
    </div>
  );
}
