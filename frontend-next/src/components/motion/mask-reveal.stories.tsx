import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, waitFor } from 'storybook/test';
import { vi } from 'vitest';
import { useState } from 'react';
import { MaskReveal } from './mask-reveal';

const meta = {
  component: MaskReveal,
  tags: ['ai-generated'],
} satisfies Meta<typeof MaskReveal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RevealsOnEnter: Story = {
  args: { children: 'A better way to take care of yourself.' },
  play: async ({ canvas }) => {
    const el = canvas.getByText(/a better way/i);
    await waitFor(() => expect(el.className).toContain('animate-mask-in'), { timeout: 2000 });
  },
};

/**
 * Harness for `RevealIsOneShot`. Starts the reveal off-screen
 * (`position: fixed; top: 150vh`, the same off-screen technique used in
 * `src/lib/motion.stories.tsx`) so its `IntersectionObserver` is created but
 * has not fired yet, then a button toggles it in and out of the viewport on
 * demand — a real scroll-out/scroll-in cycle, not a simulated one.
 */
function ScrollHarness() {
  const [offscreen, setOffscreen] = useState(true);
  return (
    <div>
      <button data-testid="toggle" onClick={() => setOffscreen((v) => !v)}>
        toggle
      </button>
      <div style={offscreen ? { position: 'fixed', top: '150vh', left: 0 } : undefined}>
        <MaskReveal>One shot</MaskReveal>
      </div>
    </div>
  );
}

/**
 * The wipe must be a one-shot: `MaskReveal` calls `whenSomeInView` with
 * `once: true`, which disconnects the underlying `IntersectionObserver` the
 * instant the element first enters view, so a later scroll-out/scroll-in
 * cannot re-trigger it.
 *
 * This can't be verified by re-inspecting the rendered class list after a
 * second entry: `onEnter` just calls `setState("in")` again, and `cn()`
 * recomputes the class string from the current state rather than
 * accumulating tokens, so the DOM is byte-identical whether `onEnter` fired
 * once or five times. What actually prevents a re-fire is the observer
 * tearing itself down, so this test spies on
 * `IntersectionObserver.prototype.disconnect`, scrolls the element into
 * view, asserts `disconnect` fired immediately (proving no live observer
 * remains), then scrolls it out and back in twice more and confirms nothing
 * changes.
 */
export const RevealIsOneShot: Story = {
  render: () => <ScrollHarness />,
  play: async ({ canvas, userEvent }) => {
    const disconnectSpy = vi.spyOn(IntersectionObserver.prototype, 'disconnect');
    try {
      const el = canvas.getByText('One shot');
      const toggle = canvas.getByTestId('toggle');

      // Still off-screen: not revealed yet.
      expect(el.className).toContain('opacity-0');

      // Scroll into view.
      await userEvent.click(toggle);
      await waitFor(() => expect(el.className).toContain('animate-mask-in'), { timeout: 2000 });
      await waitFor(() => expect(disconnectSpy).toHaveBeenCalledTimes(1), { timeout: 2000 });

      // Scroll out and back in, twice more, well after the observer
      // disconnected.
      await userEvent.click(toggle); // out
      await userEvent.click(toggle); // in
      await userEvent.click(toggle); // out
      await userEvent.click(toggle); // in

      // No re-fire: still exactly one disconnect call, exactly one
      // `animate-mask-in` token, and the hidden class never came back.
      await expect(disconnectSpy).toHaveBeenCalledTimes(1);
      await expect(el.className.match(/animate-mask-in/g)).toHaveLength(1);
      await expect(el.className).not.toContain('opacity-0');
    } finally {
      disconnectSpy.mockRestore();
    }
  },
};
