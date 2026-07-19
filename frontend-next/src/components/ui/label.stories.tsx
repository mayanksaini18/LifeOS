import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { Label } from './label';
import { Input } from './input';

const meta = {
  component: Label,
  tags: ['ai-generated'],
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

// Play proves the label is wired to its control via htmlFor (clicking focuses it).
export const Default: Story = {
  render: () => (
    <div className="grid gap-1.5">
      <Label htmlFor="email">Email address</Label>
      <Input id="email" type="email" placeholder="you@example.com" />
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByText('Email address'));
    await expect(canvas.getByRole('textbox')).toHaveFocus();
  },
};
