import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { Button } from './button';

const meta = {
  component: Button,
  tags: ['ai-generated'],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// Smoke check — proves the accessible button role/name is exposed.
export const Default: Story = {
  args: { children: 'Log water' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: /log water/i })).toBeVisible();
  },
};

// Variant-only stories: the render itself is the assertion.
export const Secondary: Story = { args: { children: 'Cancel', variant: 'secondary' } };
export const Outline: Story = { args: { children: 'Edit', variant: 'outline' } };
export const Ghost: Story = { args: { children: 'Dismiss', variant: 'ghost' } };
export const Destructive: Story = { args: { children: 'Delete', variant: 'destructive' } };
export const Link: Story = { args: { children: 'Learn more', variant: 'link' } };
export const Large: Story = { args: { children: 'Get started', size: 'lg' } };
export const Small: Story = { args: { children: 'Add', size: 'sm' } };
export const Disabled: Story = { args: { children: 'Saving…', disabled: true } };

// The single project-wide CssCheck: the default size maps to `h-8` (2rem = 32px).
// A wrong/absent Tailwind pipeline would leave the button at its content height,
// so this proves the app's CSS actually loaded into the preview.
export const CssCheck: Story = {
  args: { children: 'Submit' },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: /submit/i });
    await expect(getComputedStyle(button).height).toBe('32px');
  },
};
