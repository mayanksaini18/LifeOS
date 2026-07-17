import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, waitFor } from 'storybook/test';
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
 * The whole stat card is one `MaskReveal` instance wrapping the heatmap and
 * the three tiles. Confirms it actually reveals via the real intersection
 * mechanic, not the retired `Reveal`'s different animation class.
 */
export const CardReveals: Story = {
  play: async ({ canvas }) => {
    const card = canvas.getByText('Habit consistency').closest('.rounded-2xl')
      ?.parentElement as HTMLElement;
    await waitFor(() => expect(card.className).toContain('animate-mask-in'), { timeout: 2000 });
    await expect(card.className).not.toContain('animate-fade-in-up');
  },
};
