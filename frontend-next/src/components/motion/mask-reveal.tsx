"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { prefersReducedMotion, whenSomeInView } from "@/lib/motion";

type RevealState = "hidden" | "in" | "instant";

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
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
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

    return whenSomeInView([el], {
      onEnter: () => setState("in"),
      once: true,
      threshold: 0.7,
    });
  }, []);

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
