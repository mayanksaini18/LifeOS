"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/** Movement past this many px counts as a drag, not a click. */
const DRAG_THRESHOLD = 5;

/**
 * HorizontalScroll — a draggable, snapping gallery built on native scrolling.
 * No carousel library: the browser already does momentum, keyboard, and
 * touch correctly.
 *
 * Two details make drag feel right, both borrowed from the reference:
 * snap is disabled mid-drag (otherwise it fights the pointer), and a drag
 * past DRAG_THRESHOLD swallows the click so releasing over a link doesn't
 * navigate.
 */
export function HorizontalScroll({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startX: number; initialScrollLeft: number; walk: number } | null>(null);

  useEffect(() => {
    const track = ref.current;
    if (!track) return;

    const onPointerDown = (e: PointerEvent) => {
      drag.current = {
        startX: e.pageX - track.offsetLeft,
        initialScrollLeft: track.scrollLeft,
        walk: 0,
      };
      track.classList.remove("snap-x", "snap-mandatory");
    };

    const onPointerMove = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      e.preventDefault();
      d.walk = e.pageX - track.offsetLeft - d.startX;
      track.scrollLeft = d.initialScrollLeft - d.walk;
      track.classList.toggle("cursor-grabbing", Math.abs(d.walk) > DRAG_THRESHOLD);
    };

    const onPointerUp = () => {
      if (!drag.current) return;
      track.classList.add("snap-x", "snap-mandatory");
      track.classList.remove("cursor-grabbing");
      // Keep the drag record alive one frame past pointerup: `click` fires
      // before the next rAF, so the handler below can still read `walk` and
      // decide whether to swallow it.
      requestAnimationFrame(() => {
        drag.current = null;
      });
    };

    const onClick = (e: MouseEvent) => {
      if (drag.current && Math.abs(drag.current.walk) > DRAG_THRESHOLD) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const onDragStart = (e: Event) => e.preventDefault();

    track.addEventListener("pointerdown", onPointerDown);
    track.addEventListener("pointermove", onPointerMove);
    track.addEventListener("pointerup", onPointerUp);
    track.addEventListener("pointerleave", onPointerUp);
    track.addEventListener("click", onClick);
    track.addEventListener("dragstart", onDragStart);

    return () => {
      track.removeEventListener("pointerdown", onPointerDown);
      track.removeEventListener("pointermove", onPointerMove);
      track.removeEventListener("pointerup", onPointerUp);
      track.removeEventListener("pointerleave", onPointerUp);
      track.removeEventListener("click", onClick);
      track.removeEventListener("dragstart", onDragStart);
    };
  }, []);

  return (
    <div
      ref={ref}
      data-testid="hscroll-track"
      className={cn(
        "flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain",
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      {children}
    </div>
  );
}
