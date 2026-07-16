/**
 * Shared scroll-triggered motion primitives. No dependencies, no React — the
 * whole in-view system is one IntersectionObserver per group.
 *
 * The grouping is the important part: passing several elements means they
 * animate *in unison* the moment any one of them is in view, rather than
 * trickling in individually as each crosses the threshold.
 */

export interface WhenSomeInViewOptions {
  onEnter: (el: Element) => void;
  onLeave?: (el: Element) => void;
  /** Disconnect after the first enter. Default false. */
  once?: boolean;
  /** Fraction of the element that must be visible. Default 0.7. */
  threshold?: number;
}

/** True when the user has asked for reduced motion. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Calls `onEnter` for every element in the group once *any* of them is in
 * view, and `onLeave` once none are. Returns a cleanup function.
 */
export function whenSomeInView(
  elements: Element[],
  { onEnter, onLeave, once = false, threshold = 0.7 }: WhenSomeInViewOptions
): () => void {
  if (elements.length === 0) return () => {};

  const inViewByEl = new Map<Element, boolean>(elements.map((el) => [el, false]));
  let wasIntersecting = false;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        inViewByEl.set(entry.target, entry.isIntersecting);
      }
      const someIntersecting = [...inViewByEl.values()].some(Boolean);

      // Only act on transitions, not on every scroll tick.
      if (wasIntersecting === someIntersecting) return;
      wasIntersecting = someIntersecting;

      const handler = someIntersecting ? onEnter : onLeave;
      if (!handler) return;
      for (const el of elements) handler(el);
      if (someIntersecting && once) observer.disconnect();
    },
    { threshold }
  );

  for (const el of elements) observer.observe(el);
  return () => observer.disconnect();
}
