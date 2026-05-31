import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'

export function WorksheetDetailSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10 space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="flex gap-8">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>
      <Separator />
      <div className="space-y-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-5 w-full" />
            <div className="pl-4 space-y-1.5">
              {i % 2 === 0 && Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-3/4" />
              ))}
              {i % 2 !== 0 && <Skeleton className="h-16 w-full rounded-lg" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
