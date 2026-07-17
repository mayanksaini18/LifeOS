"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import type { Challenge } from "@/types/challenge";

export interface ChallengesResponse {
  challenges: Challenge[];
  weekStart: string;
  user?: { xp: number; level: number };
}

export function useChallenges() {
  return useQuery({
    queryKey: ["challenges"],
    queryFn: () => fetchApi<ChallengesResponse>("/challenges"),
  });
}
