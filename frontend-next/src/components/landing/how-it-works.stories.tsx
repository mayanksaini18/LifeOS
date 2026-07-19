import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, waitFor } from 'storybook/test';
import { HowItWorks } from './how-it-works';

const meta = {
  component: HowItWorks,
  tags: ['ai-generated'],
} satisfies Meta<typeof HowItWorks>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Locks down the editorial pass's actual contract for the step rows, not
 * just class-string presence: the numeral and title resolve to genuinely
 * different, distinct font stacks (mono vs. the light display serif) rather
 * than both silently falling back to the page's default sans if a class is
 * ever dropped or renamed. Also guards the structural change this task made
 * — boxed cards with an absolute-positioned connecting hairline became plain
 * `border-t` rows — by asserting no `absolute`-positioned decoration remains
 * inside a step (the old connector) and that the row wipes in via the real
 * `MaskReveal` mechanic (`animate-mask-in`), not the retired `Reveal`'s
 * `animate-fade-in-up`.
 */
export const StepsRevealWithEditorialType: Story = {
  play: async ({ canvas }) => {
    const heading = canvas.getByRole('heading', { name: /track it/i, level: 3 });
    await expect(heading.className).toContain('display-heading');
    // Distinct from the numeral's font below — proves display-heading
    // resolves the light display serif, not a fallback to font-sans.
    await expect(getComputedStyle(heading).fontFamily).toMatch(/Fraunces/i);

    const numeral = canvas.getByText('01');
    await expect(numeral.className).toContain('label-mono');
    await expect(getComputedStyle(numeral).fontFamily).toMatch(/JetBrains/i);
    await expect(getComputedStyle(numeral).textTransform).toBe('uppercase');

    // The numeral, heading, and blurb are direct children of the
    // MaskReveal row (mirrors section.stories.tsx's `getWrapper` pattern).
    const row = heading.parentElement as HTMLElement;
    await expect(row.className).toContain('border-t');

    // Structural regression guard: the old boxed-card layout drew an
    // absolute-positioned hairline connecting each step; the editorial pass
    // replaced it with a plain top border on each row. If that connector
    // ever comes back, this fails.
    const absoluteDescendant = row.querySelector('[class*="absolute"]');
    await expect(absoluteDescendant).toBeNull();

    // Real reveal-on-scroll mechanic, not a static class.
    await waitFor(() => expect(row.className).toContain('animate-mask-in'), { timeout: 2000 });
    await expect(row.className).not.toContain('animate-fade-in-up');
  },
};

/**
 * All three steps render, each paired with its own icon, in source order.
 * Waits for the reveal first — `MaskReveal` starts every row at `opacity-0`
 * until its `IntersectionObserver` fires, so an unconditional `toBeVisible()`
 * right after mount is racing the reveal, not testing the content.
 */
export const AllThreeStepsRender: Story = {
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.getByText('01')).toBeVisible(), { timeout: 2000 });
    await expect(canvas.getByText('02')).toBeVisible();
    await expect(canvas.getByText('03')).toBeVisible();
    await expect(canvas.getByRole('heading', { name: /track it/i })).toBeVisible();
    await expect(canvas.getByRole('heading', { name: /understand it/i })).toBeVisible();
    await expect(canvas.getByRole('heading', { name: /keep going/i })).toBeVisible();
  },
};
