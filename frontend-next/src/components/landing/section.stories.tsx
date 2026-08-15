import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { SectionHeading } from './section';

const meta = {
  component: SectionHeading,
  tags: ['ai-generated'],
} satisfies Meta<typeof SectionHeading>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * SectionHeading renders a plain `<div className={...}>` as its own root
 * element (eyebrow/title/subtitle are direct children, no extra wrapper), so
 * the title's `parentElement` IS the wrapper carrying the alignment classes.
 */
function getWrapper(canvas: { getByRole: (role: string, opts: { name: RegExp }) => HTMLElement }) {
  const title = canvas.getByRole('heading', { name: /everything in one place/i });
  return title.parentElement as HTMLElement;
}

export const EditorialHeading: Story = {
  args: { eyebrow: 'Modules', title: 'Everything in one place' },
  play: async ({ canvas }) => {
    const title = canvas.getByRole('heading', { name: /everything in one place/i });
    await expect(getComputedStyle(title).fontFamily).toMatch(/Fraunces/i);

    const eyebrow = canvas.getByText('Modules');
    await expect(getComputedStyle(eyebrow).fontFamily).toMatch(/JetBrains/i);
    await expect(getComputedStyle(eyebrow).textTransform).toBe('uppercase');

    // Headline claim: "Left-aligned by default" — `align` defaults to
    // "start", not the old "center". A regression back to "center" must
    // fail this: the wrapper must carry neither centering class.
    const wrapper = getWrapper(canvas);
    await expect(wrapper.className).not.toContain('text-center');
    await expect(wrapper.className).not.toContain('mx-auto');

    // Renders statically. The former `MaskReveal` root held its children at
    // `opacity-0` until an IntersectionObserver fired, which put the copy
    // behind client JS — if the observer never ran, the section stayed
    // invisible. Assert the wrapper is visible on first paint, so no
    // JS-gated reveal can be reintroduced without failing here.
    await expect(wrapper.className).not.toContain('opacity-0');
    await expect(getComputedStyle(wrapper).opacity).toBe('1');
  },
};

/**
 * Contrasts with `EditorialHeading`: pins the *other* branch of `align` so
 * both values of the prop are exercised, not just the default.
 */
export const EditorialHeadingCentered: Story = {
  args: { eyebrow: 'Modules', title: 'Everything in one place', align: 'center' },
  play: async ({ canvas }) => {
    const wrapper = getWrapper(canvas);
    await expect(wrapper.className).toContain('text-center');
    await expect(wrapper.className).toContain('mx-auto');
  },
};
