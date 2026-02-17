export function BulletinSkeleton() {
  return (
    <div className="py-4 px-1 animate-pulse">
      <div className="flex gap-3">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-3 w-12 bg-muted/60 rounded" />
          </div>
          <div className="space-y-1.5">
            <div className="h-4 w-full bg-muted/80 rounded" />
            <div className="h-4 w-3/4 bg-muted/60 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
