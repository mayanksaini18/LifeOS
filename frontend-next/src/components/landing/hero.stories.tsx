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
    await expect(canvas.getByRole('link', { name: /create an account/i })).toBeVisible();
    await expect(canvas.queryByText(/continue with phone/i)).toBeNull();
    await expect(canvas.queryByText(/google/i)).toBeNull();
  },
};

export const HeadlineAnnouncedOnce: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  },
};
