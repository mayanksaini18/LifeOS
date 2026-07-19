import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from './avatar';

const meta = {
  component: Avatar,
  tags: ['ai-generated'],
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

// Play proves the fallback content renders when no image source resolves.
export const Fallback: Story = {
  render: () => (
    <Avatar>
      <AvatarFallback>MS</AvatarFallback>
    </Avatar>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('MS')).toBeVisible();
  },
};

export const Large: Story = {
  render: () => (
    <Avatar size="lg">
      <AvatarFallback>LG</AvatarFallback>
    </Avatar>
  ),
};

export const Group: Story = {
  render: () => (
    <AvatarGroup>
      <Avatar>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>CD</AvatarFallback>
      </Avatar>
      <AvatarGroupCount>+3</AvatarGroupCount>
    </AvatarGroup>
  ),
};
