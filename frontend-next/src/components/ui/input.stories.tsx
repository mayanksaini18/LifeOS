import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { Input } from './input';

const meta = {
  component: Input,
  tags: ['ai-generated'],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

// Play proves the input is actually editable (a non-trivial interaction).
export const Default: Story = {
  args: { placeholder: 'you@example.com', type: 'email' },
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole('textbox');
    await userEvent.type(input, 'sayzo@example.com');
    await expect(input).toHaveValue('sayzo@example.com');
  },
};

export const Disabled: Story = { args: { placeholder: 'Disabled', disabled: true } };
export const Prefilled: Story = { args: { defaultValue: 'LifeOS user' } };
