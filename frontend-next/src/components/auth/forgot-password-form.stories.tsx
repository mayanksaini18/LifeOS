import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';
import { ForgotPasswordForm } from './forgot-password-form';

/**
 * `fetchApi` calls global `fetch`, and NEXT_PUBLIC_API_URL is unset in this
 * suite — so an unstubbed submit would hit the deployed PRODUCTION backend and
 * really request a password reset. Stub it, and restore afterwards.
 */
function stubFetchOk() {
  const original = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })) as typeof fetch;
  return () => {
    globalThis.fetch = original;
  };
}

const meta = {
  component: ForgotPasswordForm,
  tags: ['ai-generated'],
  parameters: { nextjs: { appDirectory: true } },
  beforeEach: () => stubFetchOk(),
} satisfies Meta<typeof ForgotPasswordForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/**
 * The backend answers `/auth/forgot-password` identically for registered and
 * unregistered addresses so the endpoint can't be used to enumerate accounts.
 * That protection only holds if the UI is equally uninformative, so the
 * confirmation must stay conditional ("if an account exists") and must never
 * confirm the address was actually found.
 */
export const ConfirmationDoesNotRevealWhetherTheAccountExists: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(
      canvas.getByPlaceholderText('you@example.com'),
      'someone@example.com',
    );
    await userEvent.click(canvas.getByRole('button', { name: /send reset link/i }));

    await expect(await canvas.findByText(/if an account exists/i)).toBeInTheDocument();
    await expect(canvas.queryByText(/no account|not found|isn't registered/i)).toBeNull();
  },
};
