export default function PersonalizeLoading() {
  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8 animate-pulse">
        {/* Header */}
        <div className="space-y-2 pt-4">
          <div className="h-8 w-48 rounded-lg bg-surface-light" />
          <div className="h-4 w-80 rounded bg-surface-light" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Playlist generator skeleton */}
          <div className="rounded-xl bg-surface border border-border p-5 space-y-4 h-64" />

          {/* Top artists skeleton */}
          <div className="rounded-xl bg-surface border border-border p-5 space-y-4">
            <div className="h-4 w-32 rounded bg-surface-light" />
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="aspect-square rounded-xl bg-surface-light" />
                  <div className="h-3 w-3/4 rounded bg-surface-light" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top tracks skeleton */}
        <div className="rounded-xl bg-surface border border-border p-5 space-y-3">
          <div className="h-4 w-32 rounded bg-surface-light" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-light shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3 w-1/2 rounded bg-surface-light" />
                <div className="h-2.5 w-1/3 rounded bg-surface-light" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
