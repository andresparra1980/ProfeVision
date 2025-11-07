import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FormSkeleton } from "@/components/shared/skeletons";

/**
 * Loading skeleton for Settings page content
 * Shows loading state for form cards only (title loads immediately)
 */
export function SettingsPageSkeleton() {
  return (
    <>
      {/* Profile form card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full max-w-md" />
        </CardHeader>
        <CardContent>
          <FormSkeleton fields={5} showButton={true} />
        </CardContent>
      </Card>

      {/* Password card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full max-w-md" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>

      {/* Notifications card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full max-w-md" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full max-w-xs" />
        </CardContent>
      </Card>
    </>
  );
}
