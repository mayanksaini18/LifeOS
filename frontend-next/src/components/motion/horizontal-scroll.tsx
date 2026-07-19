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
      // Capture the pointer: the track is content-sized (~120px cards) while
      // a real horizontal drag naturally arcs, so the cursor routinely drifts
      // outside its box mid-drag. Capture keeps pointermove/pointerup
      // targeting the track regardless of where the pointer physically is;
      // the browser releases it implicitly on pointerup/pointercancel.
      track.setPointerCapture(e.pointerId);
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
    // No `pointerleave` here: with the pointer captured, boundary events
    // (pointerleave/pointerout) still fire from the pointer's real screen
    // position regardless of capture — treating pointerleave as drag-end
    // would end the drag the instant the cursor drifts outside the track's
    // box, defeating the point of capturing in the first place.
    // `pointercancel` is the correct "gesture stolen" signal under capture
    // (e.g. the browser hands the gesture to a scroll/back-navigation), so
    // it gets the same drag-end handling as pointerup.
    track.addEventListener("pointercancel", onPointerUp);
    track.addEventListener("click", onClick);
    track.addEventListener("dragstart", onDragStart);

    return () => {
      track.removeEventListener("pointerdown", onPointerDown);
      track.removeEventListener("pointermove", onPointerMove);
      track.removeEventListener("pointerup", onPointerUp);
      track.removeEventListener("pointercancel", onPointerUp);
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
