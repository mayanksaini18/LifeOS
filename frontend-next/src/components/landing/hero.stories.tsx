import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { Hero } from './hero';

const meta = {
  component: Hero,
  tags: ['ai-generated'],
} satisfies Meta<typeof Hero>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The hero is a marketing surface, not a signup form. Exactly one call to
 * action; the three auth methods live on /register.
 */
export const SingleCta: Story = {
  play: async ({ canvas }) => {
    const cta = canvas.getByRole('link', { name: /create an account/i });
    await expect(cta).toBeVisible();
    // The whole point of routing all auth through one destination is that
    // this link actually goes there. Role + accessible name alone pass even
    // if the href points at a dead or wrong route, so assert it explicitly.
    await expect(cta).toHaveAttribute('href', '/register');
    await expect(canvas.queryByText(/continue with phone/i)).toBeNull();
    await expect(canvas.queryByText(/google/i)).toBeNull();
  },
};

export const HeadlineAnnouncedOnce: Story = {
  play: async ({ canvas }) => {
    // getByRole (singular) throws if 0 or >1 <h1> match, preserving the
    // original structural guarantee. toHaveAccessibleName then goes further:
    // MorphHeadline stacks a visible serif span and a decorative sans span
    // inside that one <h1>. If the sans span's aria-hidden is ever dropped,
    // its text is folded into the accessible name too, so the name no longer
    // equals the single sentence — the element count alone would stay 1 and
    // miss that defect entirely.
    const heading = canvas.getByRole('heading', { level: 1 });
    await expect(heading).toHaveAccessibleName('A better way to take care of yourself.');
  },
};
