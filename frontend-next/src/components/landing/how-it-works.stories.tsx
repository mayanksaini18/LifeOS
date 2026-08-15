import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
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
 * inside a step (the old connector), and that the row renders visible rather
 * than behind a JS-gated reveal.
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

    // The numeral, heading, and blurb are direct children of the step row
    // (mirrors section.stories.tsx's `getWrapper` pattern).
    const row = heading.parentElement as HTMLElement;
    await expect(row.className).toContain('border-t');

    // Structural regression guard: the old boxed-card layout drew an
    // absolute-positioned hairline connecting each step; the editorial pass
    // replaced it with a plain top border on each row. If that connector
    // ever comes back, this fails.
    const absoluteDescendant = row.querySelector('[class*="absolute"]');
    await expect(absoluteDescendant).toBeNull();

    // Rows render visible. The former `MaskReveal` wrapper held each row at
    // `opacity-0` until an IntersectionObserver fired; if it never did, the
    // steps stayed blank. No reveal class may gate them again.
    await expect(row.className).not.toContain('opacity-0');
    await expect(getComputedStyle(row).opacity).toBe('1');
  },
};

/**
 * All three steps render, each paired with its own icon, in source order.
 * Asserts visibility directly: with the reveal removed, the rows are visible
 * on first paint, so there is no longer anything to wait for.
 */
export const AllThreeStepsRender: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('01')).toBeVisible();
    await expect(canvas.getByText('02')).toBeVisible();
    await expect(canvas.getByText('03')).toBeVisible();
    await expect(canvas.getByRole('heading', { name: /track it/i })).toBeVisible();
    await expect(canvas.getByRole('heading', { name: /understand it/i })).toBeVisible();
    await expect(canvas.getByRole('heading', { name: /keep going/i })).toBeVisible();
  },
};
