"use client";

import { useState, useCallback } from "react";
import { Menu, X } from "lucide-react";
import { ChatSidebar } from "./ChatSidebar";
import { StreamingChat } from "./StreamingChat";
import type { ChatMessage } from "@/hooks/useChat";
import { cn } from "@/lib/utils";

interface SessionData {
  id: string;
  type: "music" | "movie";
  messages: { role: string; content: string; timestamp: string }[];
  created_at: string;
}

export function ChatPageClient() {
  const [activeSession, setActiveSession] = useState<SessionData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSelectSession = useCallback((session: SessionData) => {
    setActiveSession(session);
    setSidebarOpen(false);
  }, []);

  const handleNewSession = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "music" }),
      });

      if (res.ok) {
        const data = await res.json();
        setActiveSession(data.session);
        setSidebarOpen(false);
      }
    } catch (err) {
      console.error("Failed to create session:", err);
    }
  }, []);

  const initialMessages: ChatMessage[] | undefined = activeSession?.messages
    ?.filter((m): m is ChatMessage & { role: "user" | "assistant" } =>
      m.role === "user" || m.role === "assistant"
    )
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
      timestamp: m.timestamp,
    }));

  return (
    <div className="flex h-full">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-[72px] left-4 z-30 lg:hidden w-11 h-11 rounded-lg bg-surface border border-border flex items-center justify-center"
      >
        {sidebarOpen ? (
          <X className="w-4 h-4 text-muted-foreground" />
        ) : (
          <Menu className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-20 w-[80vw] max-w-[288px] bg-surface border-r border-border pt-16 lg:pt-0 transition-transform lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <ChatSidebar
          activeSessionId={activeSession?.id ?? null}
          onSelectSession={handleSelectSession}
          onNewSession={handleNewSession}
        />
      </div>

      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-10 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Chat area */}
      <div className="flex-1 min-w-0">
        {activeSession ? (
          <StreamingChat
            key={activeSession.id}
            sessionId={activeSession.id}
            initialMessages={initialMessages}
          />
        ) : (
          <StreamingChat />
        )}
      </div>
    </div>
  );
}
