"use client";

import { useState, useEffect } from "react";
import { Plus, MessageSquare, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatSession {
  id: string;
  type: "music" | "movie";
  messages: { role: string; content: string; timestamp: string }[];
  created_at: string;
}

interface ChatSidebarProps {
  activeSessionId: string | null;
  onSelectSession: (session: ChatSession) => void;
  onNewSession: () => void;
}

export function ChatSidebar({
  activeSessionId,
  onSelectSession,
  onNewSession,
}: ChatSidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  async function fetchSessions() {
    try {
      const res = await fetch("/api/chat/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteSession(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await fetch(`/api/chat/sessions/${id}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  }

  function getSessionPreview(session: ChatSession): string {
    const firstUserMsg = session.messages.find((m) => m.role === "user");
    if (firstUserMsg) {
      return firstUserMsg.content.length > 40
        ? firstUserMsg.content.slice(0, 40) + "..."
        : firstUserMsg.content;
    }
    return "New conversation";
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
    if (diffHours < 48) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <button
          onClick={onNewSession}
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--music-accent)] text-black text-sm font-medium hover:brightness-110 transition-all"
        >
          <Plus className="w-4 h-4" />
          New chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-xs">
            No conversations yet
          </div>
        ) : (
          <div className="space-y-1">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onSelectSession(session)}
                className={cn(
                  "w-full text-left rounded-lg px-3 py-2.5 group transition-colors",
                  activeSessionId === session.id
                    ? "bg-surface-light border border-border"
                    : "hover:bg-muted"
                )}
              >
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">
                      {getSessionPreview(session)}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={cn(
                          "text-[10px] font-mono px-1 rounded",
                          session.type === "music"
                            ? "bg-[var(--music-accent)]/10 text-[var(--music-accent)]"
                            : "bg-[var(--movie-accent)]/10 text-[var(--movie-accent)]"
                        )}
                      >
                        {session.type}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDate(session.created_at)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => deleteSession(session.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-400/10 transition-all"
                  >
                    <Trash2 className="w-3 h-3 text-muted-foreground hover:text-red-400" />
                  </button>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
