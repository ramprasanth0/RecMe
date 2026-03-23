import { User, Music, Film, Bookmark } from "lucide-react";

export default function ProfilePage() {
  return (
    <main className="min-h-screen px-6 py-12 max-w-4xl mx-auto">
      <h1 className="font-display text-3xl font-bold mb-2">Profile</h1>
      <p className="text-[var(--muted-text)] mb-8">
        Manage your preferences and connected accounts.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Connected Accounts */}
        <div className="rounded-xl bg-[var(--surface)] p-6 space-y-4">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[var(--muted-text)]" />
            <h2 className="font-display text-lg font-semibold">Connected Accounts</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-[var(--surface-light)]">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-[var(--music-accent)]" />
                <span className="text-sm">Spotify</span>
              </div>
              <span className="text-xs text-[var(--muted-text)]">Not connected</span>
            </div>
          </div>
        </div>

        {/* Genre Preferences */}
        <div className="rounded-xl bg-[var(--surface)] p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-[var(--muted-text)]" />
            <h2 className="font-display text-lg font-semibold">Genre Preferences</h2>
          </div>
          <p className="text-sm text-[var(--muted-text)]">
            Sign in to set your preferences.
          </p>
        </div>

        {/* Saved Recommendations */}
        <div className="rounded-xl bg-[var(--surface)] p-6 space-y-4 md:col-span-2">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-[var(--muted-text)]" />
            <h2 className="font-display text-lg font-semibold">Saved Recommendations</h2>
          </div>
          <p className="text-sm text-[var(--muted-text)]">
            Your saved music and movie recommendations will appear here.
          </p>
        </div>
      </div>
    </main>
  );
}
