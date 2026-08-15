import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { GamificationSection } from './gamification-section';

const meta = {
  component: GamificationSection,
  tags: ['ai-generated'],
} satisfies Meta<typeof GamificationSection>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The three stat-tile captions ("Streak", "Level", "This week") switched
 * from ad hoc `text-xs text-muted-foreground` to `label-mono`. Asserts the
 * actual visual effect the class carries (mono font stack + uppercase
 * transform + the 10px editorial caption size), not just that the
 * className string is present — a className-only check would still pass if
 * `label-mono` were renamed to a no-op class.
 */
export const StatCaptionsUseLabelMono: Story = {
  play: async ({ canvas }) => {
    for (const label of ['Streak', 'Level', 'This week']) {
      const el = canvas.getByText(label);
      await expect(el.className).toContain('label-mono');
      await expect(getComputedStyle(el).fontFamily).toMatch(/JetBrains/i);
      await expect(getComputedStyle(el).textTransform).toBe('uppercase');
      await expect(getComputedStyle(el).fontSize).toBe('10px');
    }
  },
};

/**
 * The stat card wrapping the heatmap and the three tiles renders visible on
 * first paint. It was previously a `MaskReveal` instance that held the whole
 * card at `opacity-0` until an IntersectionObserver fired — this pins that it
 * cannot be put back behind a JS-gated reveal.
 */
export const CardRenders: Story = {
  play: async ({ canvas }) => {
    const card = canvas.getByText('Habit consistency').closest('.rounded-2xl')
      ?.parentElement as HTMLElement;
    await expect(card.className).not.toContain('opacity-0');
    await expect(getComputedStyle(card).opacity).toBe('1');
  },
};
