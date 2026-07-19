import { Skeleton } from "@/components/ui/skeleton";

export function ScanSkeleton() {
  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <Skeleton className="h-[176px] w-[176px] rounded-full" />
      <div className="w-full space-y-3">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
    </div>
  );
}
