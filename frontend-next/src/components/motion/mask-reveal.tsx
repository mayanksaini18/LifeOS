"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { prefersReducedMotion, whenSomeInView } from "@/lib/motion";

type RevealState = "hidden" | "in" | "instant";

/** Registry of group name → elements, so a cluster can animate in unison. */
const groups = new Map<string, Set<Element>>();

/**
 * MaskReveal — wipes its children in the first time they enter the viewport:
 * a clip-path reveal, a 40px drift, and a weight settle, all on the shared
 * editorial easing.
 *
 * Safe to render from a Server Component: only this wrapper is a client
 * component, and children can be server-rendered and passed through.
 *
 * Users who prefer reduced motion get the content immediately, unanimated.
 */
export function MaskReveal({
  children,
  className,
  group,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  /** Instances sharing a group name animate together. */
  group?: string;
  /** Stagger delay in ms. */
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<RevealState>("hidden");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      const id = requestAnimationFrame(() => setState("instant"));
      return () => cancelAnimationFrame(id);
    }

    // Collect same-group siblings mounted this tick, so the observer sees the
    // whole cluster rather than one element at a time.
    let members: Element[] = [el];
    if (group) {
      const set = groups.get(group) ?? new Set<Element>();
      set.add(el);
      groups.set(group, set);
      members = [...set];
    }

    const cleanup = whenSomeInView(members, {
      onEnter: () => setState("in"),
      once: true,
      threshold: 0.7,
    });

    return () => {
      cleanup();
      if (group) groups.get(group)?.delete(el);
    };
  }, [group]);

  return (
    <div
      ref={ref}
      className={cn(
        state === "hidden" && "opacity-0",
        state === "in" && "animate-mask-in",
        className
      )}
      style={state === "in" && delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
