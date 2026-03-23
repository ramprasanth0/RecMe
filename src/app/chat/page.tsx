import { MessageSquare } from "lucide-react";

export default function ChatPage() {
  return (
    <main className="min-h-screen flex flex-col px-6 py-12 max-w-4xl mx-auto">
      <h1 className="font-display text-3xl font-bold mb-2">Chat with RecMe</h1>
      <p className="text-[var(--muted-text)] mb-8">
        Tell me your mood and I&apos;ll find something perfect.
      </p>

      {/* Chat placeholder */}
      <div className="flex-1 rounded-xl bg-[var(--surface)] p-6 min-h-[500px] flex flex-col">
        <div className="flex-1 flex items-center justify-center text-[var(--muted-text)]">
          <div className="text-center space-y-3">
            <MessageSquare className="w-10 h-10 mx-auto opacity-50" />
            <p>Start a conversation to get recommendations</p>
          </div>
        </div>

        {/* Input placeholder */}
        <div className="mt-4 flex gap-3">
          <input
            type="text"
            placeholder="How are you feeling right now?"
            className="flex-1 rounded-lg bg-[var(--surface-light)] border border-white/5 px-4 py-3 text-sm text-[var(--primary-text)] placeholder:text-[var(--muted-text)] focus:outline-none focus:ring-1 focus:ring-[var(--music-accent)]"
            disabled
          />
          <button
            className="px-4 py-3 rounded-lg bg-[var(--music-accent)] text-black text-sm font-semibold opacity-50 cursor-not-allowed"
            disabled
          >
            Send
          </button>
        </div>
      </div>
    </main>
  );
}
