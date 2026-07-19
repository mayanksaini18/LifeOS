import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { MorphHeadline } from './morph-headline';

const meta = {
  component: MorphHeadline,
  tags: ['ai-generated'],
} satisfies Meta<typeof MorphHeadline>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The headline text exists twice in the DOM. Screen readers must hear it once:
 * the sans copy is decorative and must be aria-hidden. This is the whole
 * accessibility cost of the crossfade and the thing most likely to regress.
 */
export const AnnouncedOnce: Story = {
  args: { text: 'A better way to take care of yourself.' },
  play: async ({ canvas }) => {
    const headings = canvas.getAllByRole('heading', { name: /a better way to take care of yourself/i });
    await expect(headings).toHaveLength(1);
  },
};

export const RendersBothLayers: Story = {
  args: { text: 'A better way to take care of yourself.' },
  play: async ({ canvas }) => {
    const h1 = canvas.getByRole('heading');
    await expect(h1.querySelectorAll('[data-morph-layer]')).toHaveLength(2);
    await expect(h1.querySelector('[data-morph-layer="sans"]')).toHaveAttribute('aria-hidden', 'true');
  },
};
