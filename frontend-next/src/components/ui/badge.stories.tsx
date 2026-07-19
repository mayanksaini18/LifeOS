import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { Badge } from './badge';

const meta = {
  component: Badge,
  tags: ['ai-generated'],
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

// Smoke check — proves the child content renders into the DOM.
export const Default: Story = {
  args: { children: 'Level 7' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Level 7')).toBeVisible();
  },
};

export const Secondary: Story = { args: { children: 'Streak', variant: 'secondary' } };
export const Destructive: Story = { args: { children: 'Overdue', variant: 'destructive' } };
export const Outline: Story = { args: { children: 'Draft', variant: 'outline' } };
export const Ghost: Story = { args: { children: 'Beta', variant: 'ghost' } };
