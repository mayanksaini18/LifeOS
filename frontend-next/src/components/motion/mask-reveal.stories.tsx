import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, waitFor } from 'storybook/test';
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
 * The wipe must be a one-shot: `whenSomeInView` is called with `once`, so the
 * class is added exactly once and never removed. If a later refactor drops
 * `once`, content would re-wipe every time it re-enters the viewport, which
 * reads as a glitch on scroll-up.
 */
export const RevealIsOneShot: Story = {
  args: { children: 'One shot' },
  play: async ({ canvas }) => {
    const el = canvas.getByText('One shot');
    await waitFor(() => expect(el.className).toContain('animate-mask-in'), { timeout: 2000 });
    // Still applied — and still only once — after the observer would have
    // fired again.
    await expect(el.className).not.toContain('opacity-0');
    await expect(el.className.match(/animate-mask-in/g)).toHaveLength(1);
  },
};
