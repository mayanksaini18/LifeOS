import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { Checkbox } from './checkbox';

const meta = {
  component: Checkbox,
  tags: ['ai-generated'],
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

// Play proves the checked state toggles (aria-checked reflects interaction).
export const Default: Story = {
  args: { 'aria-label': 'Drink 2L of water' },
  play: async ({ canvas, userEvent }) => {
    const checkbox = canvas.getByRole('checkbox', { name: /drink 2l of water/i });
    await expect(checkbox).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(checkbox);
    await expect(checkbox).toHaveAttribute('aria-checked', 'true');
  },
};

export const Checked: Story = { args: { 'aria-label': 'Completed', defaultChecked: true } };
export const Disabled: Story = { args: { 'aria-label': 'Locked', disabled: true } };
