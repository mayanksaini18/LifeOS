import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, waitFor } from 'storybook/test';
import { InsightsSection } from './insights-section';

const meta = {
  component: InsightsSection,
  tags: ['ai-generated'],
} satisfies Meta<typeof InsightsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Guards the editorial pass's actual typographic contract for the copy
 * column — the eyebrow resolves the mono font stack and an uppercase
 * transform, the heading resolves the light display serif — rather than a
 * tautological "has class X" check that a rename or a dropped class would
 * still pass if it only checked class strings.
 */
export const CopyColumnUsesEditorialType: Story = {
  play: async ({ canvas }) => {
    const eyebrow = canvas.getByText('Insights & AI');
    await expect(eyebrow.className).toContain('label-mono');
    await expect(getComputedStyle(eyebrow).fontFamily).toMatch(/JetBrains/i);
    await expect(getComputedStyle(eyebrow).textTransform).toBe('uppercase');

    const heading = canvas.getByRole('heading', { name: /your data, gently understood/i });
    await expect(heading.className).toContain('display-heading');
    // Distinct from the eyebrow's font above — proves this isn't both
    // silently falling back to the same default sans stack.
    await expect(getComputedStyle(heading).fontFamily).toMatch(/Fraunces/i);
  },
};

/**
 * Both columns are independent `MaskReveal` instances (the product mock on
 * the left, the copy on the right, the right one carrying a stagger delay).
 * Both must actually reveal via the real intersection mechanic — a plain
 * `<div>` standing in for either `MaskReveal` would never gain
 * `animate-mask-in` and this would time out.
 */
export const BothColumnsReveal: Story = {
  play: async ({ canvas }) => {
    // The eyebrow is a direct child of the copy column's MaskReveal root.
    const eyebrow = canvas.getByText('Insights & AI');
    const copyColumn = eyebrow.parentElement as HTMLElement;

    // The product-mock card is a direct child of the mock column's
    // MaskReveal root.
    const mockCard = canvas.getByText('This week').closest('div.rounded-2xl') as HTMLElement;
    const mockColumn = mockCard.parentElement as HTMLElement;

    await waitFor(() => expect(copyColumn.className).toContain('animate-mask-in'), { timeout: 2000 });
    await waitFor(() => expect(mockColumn.className).toContain('animate-mask-in'), { timeout: 2000 });
  },
};
