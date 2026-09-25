import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />;
}

export function BookGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      className="p-6 grid gap-4"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl border bg-card shadow-sm"
        >
          <Skeleton className="w-full h-60 rounded-none" />
          <div className="p-4 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}