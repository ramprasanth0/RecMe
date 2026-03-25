export default function ChatLoading() {
  return (
    <div className="flex h-[100dvh] pt-16 bg-background animate-pulse">
      {/* Sidebar skeleton */}
      <div className="hidden lg:flex flex-col w-64 border-r border-border p-4 gap-3">
        <div className="h-10 bg-muted rounded-lg" />
        <div className="space-y-2 mt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted/60 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Chat area skeleton */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-4 space-y-4">
          {/* AI message */}
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
            <div className="space-y-2 flex-1 max-w-[70%]">
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-4/5" />
              <div className="h-4 bg-muted rounded w-3/5" />
            </div>
          </div>
          {/* User message */}
          <div className="flex gap-3 justify-end">
            <div className="space-y-2 max-w-[60%]">
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-4/5" />
            </div>
          </div>
        </div>
        {/* Input skeleton */}
        <div className="p-4 border-t border-border">
          <div className="h-12 bg-muted rounded-xl" />
        </div>
      </div>
    </div>
  );
}
