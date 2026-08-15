"use client";

import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SentIcon, Delete01Icon, BubbleChatIcon } from "hugeicons-react";
import { Button } from "@/components/ui/button";
import { useChatHistory, useClearChat, streamChatMessage } from "@/hooks/use-chat";
import type { ChatMessage } from "@/types/chat";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "How am I doing this week?",
  "What's one thing I could improve?",
  "Any patterns in my mood lately?",
  "Give me a small win for today.",
];

export default function ChatPage() {
  const { data, isLoading } = useChatHistory();
  const clearMutation = useClearChat();
  const qc = useQueryClient();

  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [optimisticUser, setOptimisticUser] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const messages = data?.messages ?? [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, streamText, optimisticUser]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    setInput("");
    setOptimisticUser(trimmed);
    setStreamText("");
    setStreaming(true);

    try {
      await streamChatMessage(trimmed, (delta) => {
        setStreamText((s) => s + delta);
      });
      await qc.invalidateQueries({ queryKey: ["chat-history"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Chat failed");
    } finally {
      setStreaming(false);
      setOptimisticUser(null);
      setStreamText("");
      inputRef.current?.focus();
    }
  }

  async function handleClear() {
    if (!confirm("Clear all chat history?")) return;
    try {
      await clearMutation.mutateAsync();
      toast.success("Chat cleared");
    } catch {
      toast.error("Failed to clear");
    }
  }

  const isEmpty = !isLoading && messages.length === 0 && !optimisticUser;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-3xl mx-auto">
      <div className="flex items-center justify-between pb-4 border-b">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Coach</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Grounded in your last 7 days of data
          </p>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClear} className="gap-1.5">
            <Delete01Icon className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto py-6 space-y-6">
        {isEmpty && (
          <div className="text-center pt-12 space-y-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <BubbleChatIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Ask your coach anything</p>
              <p className="text-xs text-muted-foreground mt-1">
                It can see your tracked data: mood, sleep, water, exercise, habits, journal.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left text-sm border rounded-lg px-3 py-2.5 hover:bg-accent transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m: ChatMessage) => (
          <MessageBubble key={m._id} role={m.role} content={m.content} />
        ))}

        {optimisticUser && <MessageBubble role="user" content={optimisticUser} />}
        {streaming && (
          <MessageBubble
            role="assistant"
            content={streamText || "…"}
            pulse={!streamText}
          />
        )}
      </div>

      <div className="border-t pt-4 pb-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-end gap-2"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Ask anything..."
            rows={1}
            disabled={streaming}
            className="flex-1 resize-none bg-muted/50 border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring max-h-40"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || streaming}
            className="shrink-0 rounded-xl"
          >
            <SentIcon className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

function MessageBubble({
  role,
  content,
  pulse,
}: {
  role: "user" | "assistant";
  content: string;
  pulse?: boolean;
}) {
  return (
    <div className={cn("flex", role === "user" ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
          role === "user"
            ? "bg-foreground text-background"
            : "bg-muted",
          pulse && "animate-pulse",
        )}
      >
        {content}
      </div>
    </div>
  );
}
