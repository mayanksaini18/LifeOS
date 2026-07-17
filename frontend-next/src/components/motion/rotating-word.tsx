"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { prefersReducedMotion, whenSomeInView } from "@/lib/motion";

/** Must match --duration-wipe-out in globals.css (1s). */
const WIPE_OUT_MS = 1000;

/**
 * RotatingWord — cycles a word in place. Stops while off-screen so a page
 * left open in a background tab isn't animating forever.
 *
 * Accessibility: the live text is aria-hidden and the root carries a static
 * aria-label of the first word, so assistive tech reads one stable phrase
 * rather than an endlessly-changing one.
 */
export function RotatingWord({
  words,
  interval = 4000,
  className,
}: {
  words: string[];
  /** ms between swaps. Must be greater than WIPE_OUT_MS or the timers stack. */
  interval?: number;
  className?: string;
}) {
  if (process.env.NODE_ENV !== "production" && interval <= WIPE_OUT_MS) {
    console.warn(
      `[RotatingWord] interval (${interval}ms) must exceed the ${WIPE_OUT_MS}ms wipe-out, ` +
        `or a new rotation starts before the previous swap lands.`
    );
  }

  const ref = useRef<HTMLSpanElement>(null);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"in" | "out">("in");

  useEffect(() => {
    const el = ref.current;
    if (!el || words.length < 2 || prefersReducedMotion()) return;

    let cycle: ReturnType<typeof setInterval> | null = null;
    let swap: ReturnType<typeof setTimeout> | null = null;

    const start = () => {
      if (cycle) return;
      cycle = setInterval(() => {
        // Wipe the current word out, swap the text at the end of that wipe,
        // then wipe the next one in. A hard swap would read as a glitch.
        setPhase("out");
        swap = setTimeout(() => {
          setIndex((i) => (i + 1) % words.length);
          setPhase("in");
        }, WIPE_OUT_MS);
      }, interval);
    };

    const stop = () => {
      if (cycle) clearInterval(cycle);
      if (swap) clearTimeout(swap);
      cycle = null;
      swap = null;
    };

    const cleanup = whenSomeInView([el], {
      onEnter: start,
      onLeave: stop,
      threshold: 0.5,
    });

    return () => {
      stop();
      cleanup();
    };
  }, [words, interval]);

  return (
    <span
      ref={ref}
      data-testid="rotating-root"
      aria-label={words[0]}
      className={cn("relative inline-block", className)}
    >
      <span
        key={index}
        data-testid="rotating-current"
        aria-hidden="true"
        className={cn("block", phase === "in" ? "animate-word-in" : "animate-word-out")}
      >
        {words[index]}
      </span>
    </span>
  );
}
