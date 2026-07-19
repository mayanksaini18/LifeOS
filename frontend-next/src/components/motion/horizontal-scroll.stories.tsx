import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, waitFor } from 'storybook/test';
import { useState } from 'react';
import { HorizontalScroll } from './horizontal-scroll';

const meta = {
  component: HorizontalScroll,
  tags: ['ai-generated'],
} satisfies Meta<typeof HorizontalScroll>;

export default meta;
type Story = StoryObj<typeof meta>;

const cards = Array.from({ length: 6 }, (_, i) => (
  <div key={i} style={{ minWidth: 300, height: 120 }}>Card {i}</div>
));

export const ScrollsAndSnaps: Story = {
  args: { children: cards },
  play: async ({ canvas }) => {
    const track = canvas.getByTestId('hscroll-track');
    await expect(track.scrollWidth).toBeGreaterThan(track.clientWidth);
    await expect(track.className).toContain('snap-x');
  },
};

/**
 * Dispatches a real, native `PointerEvent` directly on `target` with `pageX`
 * pinned to an exact value. `userEvent.pointer` was tried first, but this
 * harness remaps `@testing-library/user-event` to drive the real Playwright
 * mouse, whose coordinate translation could not be pinned to precise pixel
 * deltas -- see `task-9-report.md` for the experiment. Dispatching the
 * PointerEvent directly is still a genuine, real-browser event: it runs
 * through the same native `addEventListener` listeners and DOM bubbling the
 * component relies on, with full control over the one field
 * (`e.pageX`) the drag math reads.
 */
function firePointer(target: Element, type: string, pageX: number, pageY = 60) {
  const event = new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    pointerId: 1,
    clientX: pageX,
    clientY: pageY,
  });
  Object.defineProperty(event, 'pageX', { value: pageX });
  target.dispatchEvent(event);
}

/**
 * The drag contract Task 12 depends on: snap disables the instant a press
 * starts (otherwise native scroll-snap fights the very first pointermove),
 * `scrollLeft` tracks the pointer 1:1 while dragging, `cursor-grabbing` only
 * appears once the movement passes `DRAG_THRESHOLD`, and snap re-enables the
 * moment the pointer is released.
 */
export const DragTogglesSnapAndScrolls: Story = {
  args: { children: cards },
  play: async ({ canvas }) => {
    const track = canvas.getByTestId('hscroll-track');
    expect(track.scrollLeft).toBe(0);
    expect(track.className).toContain('snap-x');

    firePointer(track, 'pointerdown', 250);
    // Snap must come off on press, not merely once a drag is detected.
    expect(track.className).not.toContain('snap-x');
    expect(track.className).not.toContain('snap-mandatory');

    firePointer(track, 'pointermove', 248); // 2px: under DRAG_THRESHOLD (5)
    expect(track.scrollLeft).toBe(2);
    expect(track.className).not.toContain('cursor-grabbing');

    firePointer(track, 'pointermove', 100); // 150px total: past DRAG_THRESHOLD
    expect(track.scrollLeft).toBe(150);
    expect(track.className).toContain('cursor-grabbing');

    firePointer(track, 'pointerup', 100);
    expect(track.className).toContain('snap-x');
    expect(track.className).toContain('snap-mandatory');
    expect(track.className).not.toContain('cursor-grabbing');
  },
};

/**
 * Regression test for the fix-wave-1 finding: without `setPointerCapture`,
 * a real drag where the cursor drifts outside the track's bounding box mid-
 * drag (very plausible here -- the track's height is content-sized to
 * ~120px cards, while a hand naturally arcs during a horizontal drag) fires
 * `pointerleave`, which was wired to the same drag-end handler as
 * `pointerup` -- ending the drag, restoring snap, and dropping every
 * `pointermove` that follows.
 *
 * The fix is two parts: (1) capture the pointer on `pointerdown`, and (2)
 * stop treating `pointerleave` as drag-end, since boundary events like
 * `pointerleave` fire from the pointer's *real* screen position regardless
 * of capture -- keeping the old wiring would reproduce this exact bug even
 * with capture active.
 *
 * This test cannot reproduce the geometry (dispatchEvent always invokes
 * listeners on the exact node it's called on, bypassing hit-testing, so
 * there's no way to synthesize "the pointer is physically outside the
 * track's box" -- see the `firePointer` doc comment above). What it *can*
 * do, faithfully, is test the wiring itself: dispatching `pointerleave`
 * directly on the track exercises exactly the listener (or absence of one)
 * that the fix touches, independent of geometry. Before the fix, the track
 * has a `pointerleave` listener bound to the drag-end handler, and firing it
 * here ends the drag and drops the next `pointermove`. After the fix, no
 * such listener exists, so the drag survives.
 */
export const PointerLeaveDoesNotEndDrag: Story = {
  args: { children: cards },
  play: async ({ canvas }) => {
    const track = canvas.getByTestId('hscroll-track');

    firePointer(track, 'pointerdown', 250);
    firePointer(track, 'pointermove', 100); // 150px: past DRAG_THRESHOLD
    expect(track.scrollLeft).toBe(150);
    expect(track.className).toContain('cursor-grabbing');

    // Simulates the cursor drifting outside the track's box mid-drag.
    firePointer(track, 'pointerleave', 100);

    // The drag must still be live: snap must not have been restored...
    expect(track.className).not.toContain('snap-x');
    expect(track.className).toContain('cursor-grabbing');

    // ...and a further pointermove must still be tracked.
    firePointer(track, 'pointermove', 50); // 200px total
    expect(track.scrollLeft).toBe(200);

    firePointer(track, 'pointerup', 50);
    expect(track.className).toContain('snap-x');
    expect(track.className).toContain('snap-mandatory');
  },
};

function ClickTrackerHarness() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <div data-testid="click-count">{count}</div>
      <HorizontalScroll>
        <button
          data-testid="card-link"
          style={{ minWidth: 300, height: 120 }}
          onClick={() => setCount((c) => c + 1)}
        >
          Card link
        </button>
        {cards}
      </HorizontalScroll>
    </div>
  );
}

/**
 * "A drag past 5px swallows the click so releasing over a link doesn't
 * navigate" -- the other half of the drag contract, and the one most likely
 * to silently regress since nothing else in this suite exercises it.
 *
 * Three phases: a plain tap (no movement) must fire the click normally; a
 * drag past `DRAG_THRESHOLD` followed immediately by a click on the element
 * released over must swallow it; and once the drag record clears (one rAF
 * after pointerup, per the component's own comment), an unrelated later
 * click must work again -- proving the swallow is a one-shot tied to the
 * drag that just happened, not a stuck flag.
 */
export const DragPastThresholdSwallowsClick: Story = {
  render: () => <ClickTrackerHarness />,
  play: async ({ canvas }) => {
    const link = canvas.getByTestId('card-link');
    const track = canvas.getByTestId('hscroll-track');
    const count = canvas.getByTestId('click-count');

    firePointer(link, 'pointerdown', 50);
    firePointer(link, 'pointerup', 50);
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await waitFor(() => expect(count.textContent).toBe('1'));

    firePointer(track, 'pointerdown', 250);
    firePointer(track, 'pointermove', 100); // 150px: well past DRAG_THRESHOLD
    firePointer(track, 'pointerup', 100);
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    // Give React a tick to prove this genuinely stays at 1, not just that it
    // hasn't caught up yet.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(count.textContent).toBe('1');

    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await waitFor(() => expect(count.textContent).toBe('2'));
  },
};
