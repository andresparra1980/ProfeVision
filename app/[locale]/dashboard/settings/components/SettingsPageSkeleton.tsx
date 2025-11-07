import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FormSkeleton } from "@/components/shared/skeletons";

/**
 * Loading skeleton for Settings page
 * Mimics the structure of the profile form with multiple cards
 */
export function SettingsPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-full max-w-md mt-2" />
      </div>

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
    </div>
  );
}
