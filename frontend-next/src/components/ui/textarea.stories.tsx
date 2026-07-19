import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { Textarea } from './textarea';

const meta = {
  component: Textarea,
  tags: ['ai-generated'],
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

// Play proves the textarea accepts multi-line input.
export const Default: Story = {
  args: { placeholder: 'How was your day?' },
  play: async ({ canvas, userEvent }) => {
    const textarea = canvas.getByRole('textbox');
    await userEvent.type(textarea, 'Grateful for a calm morning.');
    await expect(textarea).toHaveValue('Grateful for a calm morning.');
  },
};

export const Disabled: Story = { args: { placeholder: 'Read only', disabled: true } };
