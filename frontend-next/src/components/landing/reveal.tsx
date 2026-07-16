"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { prefersReducedMotion, whenSomeInView } from "@/lib/motion";

type RevealState = "hidden" | "in" | "instant";

/**
 * Reveal — fades its children up into view the first time they enter the
 * viewport, reusing the app's `animate-fade-in-up` keyframe. Users who prefer
 * reduced motion get the content immediately with no animation ("instant").
 *
 * Safe to render from Server Components: only this wrapper is a Client
 * Component; the children can be server-rendered and passed through.
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  /** Stagger delay in ms, applied to the fade-up animation. */
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

    return whenSomeInView([el], {
      onEnter: () => setState("in"),
      once: true,
      threshold: 0.15,
    });
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        state === "hidden" && "opacity-0",
        state === "in" && "animate-fade-in-up",
        className
      )}
      style={state === "in" && delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
