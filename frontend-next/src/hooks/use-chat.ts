"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { API_URL } from "@/lib/constants";
import type { ChatMessage } from "@/types/chat";

export function useChatHistory() {
  return useQuery({
    queryKey: ["chat-history"],
    queryFn: () => fetchApi<{ messages: ChatMessage[] }>("/chat"),
  });
}

export function useClearChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => fetchApi<{ message: string }>("/chat", { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat-history"] }),
  });
}

export async function streamChatMessage(
  message: string,
  onDelta: (text: string) => void,
): Promise<void> {
  const res = await fetch(`${API_URL}/chat`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  if (!res.ok || !res.body) {
    const body = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(body.message || "Chat failed");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const events = buffer.split("\n\n");
    buffer = events.pop() || "";

    for (const evt of events) {
      const line = evt.split("\n").find((l) => l.startsWith("data: "));
      if (!line) continue;
      let payload: { type?: string; text?: string; message?: string };
      try {
        payload = JSON.parse(line.slice(6));
      } catch {
        continue; // malformed event — skip
      }
      // Handle the parsed payload OUTSIDE the parse try/catch, so a backend
      // {type:"error"} event actually surfaces to the caller instead of being
      // swallowed as if it were a malformed line (which froze the chat bubble).
      if (payload.type === "delta") onDelta(payload.text ?? "");
      else if (payload.type === "error") throw new Error(payload.message || "Stream error");
    }
  }
}
