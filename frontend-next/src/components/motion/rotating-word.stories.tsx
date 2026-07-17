import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, waitFor } from 'storybook/test';
import { RotatingWord } from './rotating-word';

const meta = {
  component: RotatingWord,
  tags: ['ai-generated'],
} satisfies Meta<typeof RotatingWord>;

export default meta;
type Story = StoryObj<typeof meta>;

// `interval` must exceed the 1s wipe-out, or the swap timers stack. 1400 is the
// shortest value that respects that while keeping the test quick.
export const Rotates: Story = {
  args: { words: ['yourself', 'your sleep', 'your mood'], interval: 1400 },
  play: async ({ canvas }) => {
    await waitFor(
      () => expect(canvas.getByTestId('rotating-current').textContent).toBe('your sleep'),
      { timeout: 5000 }
    );
  },
};

/**
 * The rotator swaps text on a timer. Screen readers must not be spammed with
 * every change, and the full phrase must remain readable.
 */
export const HasAccessibleLabel: Story = {
  args: { words: ['yourself', 'your sleep'] },
  play: async ({ canvas }) => {
    const root = canvas.getByTestId('rotating-root');
    await expect(root).toHaveAttribute('aria-label', 'yourself');
  },
};
