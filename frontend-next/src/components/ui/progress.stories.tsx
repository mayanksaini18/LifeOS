import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { Progress, ProgressLabel, ProgressValue } from './progress';

const meta = {
  component: Progress,
  tags: ['ai-generated'],
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

// Play proves the value is exposed to assistive tech via aria-valuenow.
export const Half: Story = {
  args: { value: 50, className: 'w-72', 'aria-label': 'Daily goal' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
  },
};

export const Full: Story = { args: { value: 100, className: 'w-72', 'aria-label': 'Complete' } };

export const WithLabel: Story = {
  args: { value: 72, className: 'w-72' },
  render: (args) => (
    <Progress {...args}>
      <ProgressLabel>Steps</ProgressLabel>
      <ProgressValue />
    </Progress>
  ),
};
