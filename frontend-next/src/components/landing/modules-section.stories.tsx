import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, waitFor } from 'storybook/test';
import { ModulesSection } from './modules-section';
import { LANDING_MODULES } from '@/lib/landing-data';

const meta = {
  component: ModulesSection,
  tags: ['ai-generated'],
} satisfies Meta<typeof ModulesSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const GalleryRendersEveryModule: Story = {
  play: async ({ canvas }) => {
    const track = canvas.getByTestId('hscroll-track');
    await expect(track).toBeVisible();
    for (const m of LANDING_MODULES) {
      await expect(canvas.getByText(m.label)).toBeVisible();
    }
  },
};

/**
 * Dispatches a real, native `PointerEvent` directly on `target` with `pageX`
 * pinned to an exact value — copied from horizontal-scroll.stories.tsx's own
 * helper (see that file's doc comment for why a raw PointerEvent is used
 * instead of `userEvent.pointer`).
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
 * Module cards are real `next/link`s (mocked in Storybook to a plain `<a>`
 * whose onClick calls `preventDefault` + a navigate action — see
 * `@storybook/nextjs-vite`'s `export-mocks/link`). HorizontalScroll's
 * drag-swallow works by calling a *native* `stopPropagation()` on the track
 * during the real bubble phase, before the event ever reaches the point
 * where React's delegated root dispatches the link's onClick. That gate sits
 * strictly between the card and every ancestor above the track — including
 * `document` — so a plain bubble-phase listener on `document` only fires
 * once the event has cleared that gate.
 *
 * A listener attached directly to the link itself would NOT prove this: DOM
 * target-phase listeners fire before any ancestor (the track) gets a chance
 * to call stopPropagation, so such a listener would fire regardless of
 * whether the swallow works — a test that cannot go red. Watching from
 * `document`, an ancestor beyond the track, avoids that trap.
 */
export const DragPastThresholdDoesNotReachModuleLink: Story = {
  play: async ({ canvas, canvasElement }) => {
    const track = canvas.getByTestId('hscroll-track');
    const firstModule = LANDING_MODULES[0];
    const link = canvasElement.querySelector(`a[href="${firstModule.href}"]`);
    if (!link) throw new Error(`expected a link to ${firstModule.href}`);

    let bubbledToDocument = 0;
    const onDocumentClick = () => {
      bubbledToDocument += 1;
    };
    document.addEventListener('click', onDocumentClick);

    try {
      // Drag the track well past DRAG_THRESHOLD, then release over the link.
      firePointer(track, 'pointerdown', 250);
      firePointer(track, 'pointermove', 100); // 150px: past DRAG_THRESHOLD (5)
      firePointer(track, 'pointerup', 100);
      link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      // Give React a tick to prove this genuinely never arrives, not just
      // that it hasn't caught up yet.
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(bubbledToDocument).toBe(0);

      // Control: once the drag record clears (one rAF after pointerup, per
      // HorizontalScroll's own comment), an ordinary undragged click on the
      // very same link must bubble through normally.
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      await waitFor(() => expect(bubbledToDocument).toBe(1));
    } finally {
      document.removeEventListener('click', onDocumentClick);
    }
  },
};
