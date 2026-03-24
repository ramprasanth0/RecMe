"use client";

import { useState, useCallback, useRef } from "react";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface UseChatOptions {
  sessionId?: string | null;
}

interface UseChatReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  error: string | null;
  sendMessage: (message: string) => Promise<void>;
  setMessages: (messages: ChatMessage[]) => void;
}

export function useChat(options?: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim() || isStreaming) return;

      setError(null);
      const userMsg: ChatMessage = {
        role: "user",
        content: message.trim(),
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsStreaming(true);

      // Prepare assistant placeholder
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      try {
        abortRef.current = new AbortController();

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: message.trim(),
            history: messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) throw new Error("Failed to get response");
        if (!res.body) throw new Error("No response body");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") break;

              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  accumulated += parsed.text;
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                      ...updated[updated.length - 1],
                      content: accumulated,
                    };
                    return updated;
                  });
                }
                if (parsed.error) {
                  setError(parsed.error);
                }
              } catch {
                // Incomplete chunk
              }
            }
          }
        }

        // Persist to session if we have one
        if (options?.sessionId && accumulated) {
          const allMessages = [
            ...messages,
            userMsg,
            { ...assistantMsg, content: accumulated },
          ];
          fetch(`/api/chat/sessions/${options.sessionId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: allMessages.map((m) => ({
                role: m.role,
                content: m.content,
                timestamp: m.timestamp,
              })),
            }),
          }).catch(console.error);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        console.error("Chat error:", err);
        setError(err instanceof Error ? err.message : "Something went wrong");
        // Remove empty assistant message on error
        setMessages((prev) => {
          if (prev[prev.length - 1]?.content === "") {
            return prev.slice(0, -1);
          }
          return prev;
        });
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, isStreaming, options?.sessionId]
  );

  return { messages, isStreaming, error, sendMessage, setMessages };
}
