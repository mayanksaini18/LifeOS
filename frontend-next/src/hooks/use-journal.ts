"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import type { JournalEntry, JournalAnalysis } from "@/types/journal";

export function useJournalEntries(limit = 30) {
  return useQuery<JournalEntry[]>({
    queryKey: ["journal", limit],
    queryFn: () => fetchApi(`/journal?limit=${limit}`),
  });
}

export function useJournalByDate(date: string) {
  return useQuery<JournalEntry>({
    queryKey: ["journal", "date", date],
    queryFn: () => fetchApi(`/journal/${date}`),
    retry: false,
  });
}

export function useSaveJournal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { content: string; date?: string }) =>
      fetchApi<JournalEntry>("/journal", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal"] });
      queryClient.invalidateQueries({ queryKey: ["challenges"] });
    },
  });
}

export function useAnalyzeJournal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<JournalAnalysis>(`/journal/${id}/analyze`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal"] });
    },
  });
}

export function useDeleteJournal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchApi(`/journal/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal"] });
    },
  });
}
