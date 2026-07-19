"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * MorphHeadline — the page's one signature move.
 *
 * The reference site morphs sans→serif using a custom `SERF` axis in a
 * commissioned typeface. No free font has such an axis (see the spec's
 * Appendix B), so we stack a sans copy over a serif one and crossfade between
 * them beneath the moving wipe. The eye cannot track letterforms mid-wipe, so
 * it reads as a morph.
 *
 * Use this ONCE per page. It duplicates its text in the DOM and gates on two
 * fonts loading; it does not scale to every heading. Everything else uses
 * <MaskReveal>.
 */
type MorphState = "waiting" | "play" | "instant";

export function MorphHeadline({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  // Starts "waiting" on both server and client. Reduced-motion and font
  // readiness are decided in an effect, never during render — reading
  // matchMedia at render time would hydrate-mismatch on this, the page's most
  // important element.
  const [state, setState] = useState<MorphState>("waiting");

  useEffect(() => {
    if (prefersReducedMotion()) {
      // requestAnimationFrame, not a direct setState call, so this doesn't
      // trip react-hooks/set-state-in-effect — same fix as MaskReveal.
      const id = requestAnimationFrame(() => setState("instant"));
      return () => cancelAnimationFrame(id);
    }

    let cancelled = false;
    // Gate on fonts: starting the crossfade before Fraunces is ready would
    // morph from sans to *fallback serif*, then pop. This is a timing concern,
    // not a CLS one — next/font's adjustFontFallback already handles CLS.
    document.fonts.ready.then(() => {
      if (!cancelled) setState("play");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const play = state === "play";

  return (
    <h1
      ref={ref}
      className={cn(
        "relative inline-block font-heading",
        state === "waiting" && "opacity-0",
        className
      )}
    >
      {/* Serif — the resting state, and what is announced. */}
      <span
        data-morph-layer="serif"
        className={cn("block", play && "animate-morph-serif-in")}
      >
        {text}
      </span>
      {/* Sans — decorative; fades out beneath the wipe. */}
      <span
        data-morph-layer="sans"
        aria-hidden="true"
        className={cn(
          "absolute inset-0 block font-sans",
          play ? "animate-morph-sans-out" : "opacity-0"
        )}
      >
        {text}
      </span>
    </h1>
  );
}
