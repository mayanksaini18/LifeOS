import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Skeleton } from './skeleton';

const meta = {
  component: Skeleton,
  tags: ['ai-generated'],
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

// Variant-only stories: the render is the assertion (a play would add nothing).
export const Line: Story = { args: { className: 'h-4 w-48' } };
export const Circle: Story = { args: { className: 'size-12 rounded-full' } };

export const Card: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Skeleton className="size-12 rounded-full" />
      <div className="grid gap-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  ),
};
