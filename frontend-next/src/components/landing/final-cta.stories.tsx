import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, waitFor } from 'storybook/test';
import { FinalCta } from './final-cta';

const meta = {
  component: FinalCta,
  tags: ['ai-generated'],
} satisfies Meta<typeof FinalCta>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The eyebrow composes `label-mono` (which carries `text-muted-foreground`,
 * defined in `@layer components`) with the pre-existing `text-background/60`
 * (a plain Tailwind opacity-modifier utility). Task 13's own report reasoned
 * — but never screenshotted or asserted — that `text-background/60` wins
 * because Tailwind v4's fixed layer order always ranks `utilities` above
 * `components`, regardless of source order in the class string.
 *
 * This closes that gap. Per this repo's documented gotcha, Tailwind v4
 * opacity modifiers compile to `color-mix(in oklab, ...)` and Chromium
 * serializes that as `oklab(...)`, not `rgb(...)` — so rather than hardcode
 * a color string, this renders a reference element carrying only
 * `text-background/60` (no `label-mono`) and asserts the eyebrow's resolved
 * `color` matches it exactly, and — critically — does NOT match
 * `label-mono`'s `text-muted-foreground` resolved the same way. Either
 * failure mode (the override losing, or a `getComputedStyle` false-positive
 * from comparing incompatible formats) would be caught here.
 */
export const EyebrowColorWinsOverLabelMono: Story = {
  render: () => (
    <div>
      <FinalCta />
      <p data-testid="ref-background-60" className="text-background/60">
        reference
      </p>
      <p data-testid="ref-muted-foreground" className="text-muted-foreground">
        reference
      </p>
    </div>
  ),
  play: async ({ canvas }) => {
    const eyebrow = await waitFor(() => canvas.getByText('Start today'), { timeout: 2000 });
    await expect(eyebrow.className).toContain('label-mono');
    await expect(eyebrow.className).toContain('text-background/60');

    const eyebrowColor = getComputedStyle(eyebrow).color;
    const backgroundRefColor = getComputedStyle(canvas.getByTestId('ref-background-60')).color;
    const mutedRefColor = getComputedStyle(canvas.getByTestId('ref-muted-foreground')).color;

    // Sanity check: the two references must actually differ, or this test
    // can't distinguish "the override won" from "nothing happened to matter".
    await expect(backgroundRefColor).not.toBe(mutedRefColor);

    await expect(eyebrowColor).toBe(backgroundRefColor);
    await expect(eyebrowColor).not.toBe(mutedRefColor);
  },
};
