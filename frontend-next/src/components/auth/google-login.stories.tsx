import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { GoogleLogin } from './google-login';

const meta = {
  component: GoogleLogin,
  tags: ['ai-generated'],
  // The component calls useRouter() from next/navigation, which needs the App
  // Router context rather than the Pages Router one Storybook mocks by default.
  parameters: { nextjs: { appDirectory: true } },
} satisfies Meta<typeof GoogleLogin>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Google sign-in is optional, and this suite runs with no
 * `NEXT_PUBLIC_FIREBASE_*` variables set — the same state as a fresh clone.
 *
 * Before this was guarded, `@/lib/firebase` called `getAuth()` at module scope,
 * so merely *importing* this component threw `auth/invalid-api-key`. Because
 * both `login-form` and `register-form` import it, that throw took /login and
 * /register down entirely, including email+password sign-in, which needs no
 * Firebase at all. `next build` couldn't catch it: both routes are dynamic, so
 * the module is only evaluated on a real request.
 *
 * So this story asserts two things at once — that importing the module is
 * safe, and that an unconfigured Firebase hides the button instead of
 * rendering one that cannot work.
 */
export const HiddenWhenFirebaseIsUnconfigured: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.queryByRole('button', { name: /continue with google/i }),
    ).toBeNull();
  },
};

/**
 * The "or" divider is owned by this component rather than by the two auth
 * forms, so that hiding the button can't strand a divider above nothing.
 */
export const DividerIsHiddenAlongsideTheButton: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.queryByText('or')).toBeNull();
  },
};
