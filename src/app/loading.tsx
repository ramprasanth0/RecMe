export default function RootLoading() {
  return (
    <div className="min-h-screen bg-background pt-20 px-4 sm:px-6 max-w-7xl mx-auto animate-pulse">
      {/* Greeting skeleton */}
      <div className="mb-8 space-y-3">
        <div className="h-8 w-48 bg-muted rounded-lg" />
        <div className="h-4 w-72 bg-muted/60 rounded" />
      </div>

      {/* Tab switcher skeleton */}
      <div className="flex justify-center mb-8">
        <div className="h-11 w-48 bg-muted rounded-full" />
      </div>

      {/* Mood input skeleton */}
      <div className="h-14 w-full max-w-2xl mx-auto bg-muted rounded-xl mb-10" />

      {/* Cards grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-10">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-muted overflow-hidden">
            <div className="aspect-square bg-muted-foreground/10" />
            <div className="p-3 space-y-2">
              <div className="h-3.5 bg-muted-foreground/20 rounded w-3/4" />
              <div className="h-3 bg-muted-foreground/10 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>

      {/* Trending row skeleton */}
      <div className="space-y-3">
        <div className="h-5 w-40 bg-muted rounded" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="shrink-0 w-[160px] rounded-xl bg-muted overflow-hidden">
              <div className="aspect-square bg-muted-foreground/10" />
              <div className="p-2 space-y-1.5">
                <div className="h-3 bg-muted-foreground/20 rounded w-3/4" />
                <div className="h-2.5 bg-muted-foreground/10 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
