import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';
import { ResetPasswordForm } from './reset-password-form';

const meta = {
  component: ResetPasswordForm,
  tags: ['ai-generated'],
  parameters: { nextjs: { appDirectory: true } },
} satisfies Meta<typeof ResetPasswordForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * With no `?token=` in the URL there is nothing to reset against, so the form
 * must not render — offering password fields that are guaranteed to 400 just
 * wastes the user's time and hides the real problem (a mangled email link).
 */
export const WithoutATokenTheFormIsReplacedByRecovery: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.queryByLabelText(/new password/i)).toBeNull();
    await expect(canvas.getByText(/link incomplete/i)).toBeInTheDocument();

    // Base UI's Button applies role="button" to the anchor it renders, so this
    // is matched by role rather than as a link — the href is the real assertion.
    await expect(
      canvas.getByRole('button', { name: /request a new link/i }),
    ).toHaveAttribute('href', '/forgot-password');
  },
};

/**
 * A mismatch is caught client-side and reported without a network round trip —
 * the token is single-use, so a request that was always going to fail would
 * still be a wasted one.
 */
export const MismatchedPasswordsAreRejectedBeforeSubmitting: Story = {
  parameters: {
    nextjs: { appDirectory: true, navigation: { query: { token: 'test-token' } } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const [password, confirm] = canvas.getAllByPlaceholderText('••••••••');
    await userEvent.type(password, 'correct-horse');
    await userEvent.type(confirm, 'battery-staple');
    await userEvent.click(canvas.getByRole('button', { name: /update password/i }));

    await expect(await canvas.findByText(/passwords don't match/i)).toBeInTheDocument();
  },
};
