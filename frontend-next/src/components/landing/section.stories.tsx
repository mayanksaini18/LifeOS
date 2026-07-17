import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { SectionHeading } from './section';

const meta = {
  component: SectionHeading,
  tags: ['ai-generated'],
} satisfies Meta<typeof SectionHeading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EditorialHeading: Story = {
  args: { eyebrow: 'Modules', title: 'Everything in one place' },
  play: async ({ canvas }) => {
    const title = canvas.getByRole('heading', { name: /everything in one place/i });
    await expect(getComputedStyle(title).fontFamily).toMatch(/Fraunces/i);

    const eyebrow = canvas.getByText('Modules');
    await expect(getComputedStyle(eyebrow).fontFamily).toMatch(/JetBrains/i);
    await expect(getComputedStyle(eyebrow).textTransform).toBe('uppercase');
  },
};
