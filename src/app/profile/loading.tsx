export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-background pt-20 px-4 sm:px-6 max-w-3xl mx-auto animate-pulse">
      {/* Header */}
      <div className="mb-8 space-y-2">
        <div className="h-7 w-36 bg-muted rounded-lg" />
        <div className="h-4 w-56 bg-muted/60 rounded" />
      </div>

      {/* Account section */}
      <div className="rounded-xl bg-surface border border-border p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-muted shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-muted rounded w-32" />
            <div className="h-3.5 bg-muted/60 rounded w-48" />
          </div>
          <div className="h-8 w-32 bg-muted rounded-full" />
        </div>
      </div>

      {/* Genre preferences section */}
      <div className="rounded-xl bg-surface border border-border p-6 mb-6 space-y-4">
        <div className="h-5 w-36 bg-muted rounded" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-8 w-16 bg-muted rounded-full" />
          ))}
        </div>
        <div className="h-5 w-32 bg-muted rounded mt-2" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-8 w-16 bg-muted rounded-full" />
          ))}
        </div>
        <div className="h-10 w-36 bg-muted rounded-lg mt-2" />
      </div>

      {/* Saved recs section */}
      <div className="rounded-xl bg-surface border border-border p-6 space-y-3">
        <div className="h-5 w-48 bg-muted rounded" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface-light">
            <div className="w-8 h-8 rounded-lg bg-muted shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 bg-muted rounded w-1/2" />
              <div className="h-3 bg-muted/60 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
