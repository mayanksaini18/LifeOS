import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { VerifiedBanner } from './verified-banner';

/**
 * Mounts the real `VerifiedBanner` production component (the same one
 * `login-form.tsx` renders for `?verified=1`), plus a reference swatch used
 * to prove *which* token the banner resolves to.
 *
 * We can't mount `LoginForm` itself here: it imports `GoogleLogin`, which
 * calls Firebase's `getAuth()` at module load and throws `auth/invalid-api-key`
 * in the Storybook test environment (no Firebase env vars configured for
 * tests). That's an unrelated import-time failure, not a router-mock problem.
 * `VerifiedBanner` was extracted into its own file specifically so it has no
 * Firebase import in its module graph and can be mounted directly here — so a
 * regression to the banner's className in production code (e.g. reverting
 * `border-success/30` back to `border-emerald-500/30`) is caught by this test.
 *
 * Tailwind v4's opacity modifier (`/30`) resolves via `color-mix(in oklab, ...)`,
 * so `getComputedStyle` returns an `oklab(...)` string here, not `rgb(...)`.
 * Comparing that to a hardcoded oklab literal would be unreadable and brittle,
 * so instead we compare the banner's computed border color against a
 * same-opacity reference swatch bound to `--success`. The "must differ from
 * --module-habits" half of the "two families, never aliased" contract is
 * already covered by `SuccessIsNotHabits` in
 * `src/components/design-system/tokens.stories.tsx`, so it isn't duplicated
 * here.
 */
function VerifiedBannerSpecimen() {
  return (
    <div>
      <VerifiedBanner />
      <div data-testid="success-reference" className="border border-success/30" />
    </div>
  );
}

const meta = {
  component: VerifiedBannerSpecimen,
  tags: ['ai-generated'],
} satisfies Meta<typeof VerifiedBannerSpecimen>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The "Email verified" banner means success — it must reference the
 * `--success` status token. Mounts the actual `VerifiedBanner` component that
 * `login-form.tsx` renders, so a regression to its className is caught here,
 * not just asserted by construction.
 */
export const VerifiedBannerUsesSuccessToken: Story = {
  play: async ({ canvas }) => {
    const banner = await canvas.findByText(/email verified/i);
    const box = banner.closest('div')!;
    const bannerColor = getComputedStyle(box).borderColor;

    const successColor = getComputedStyle(canvas.getByTestId('success-reference')).borderColor;

    await expect(bannerColor).toBe(successColor);
  },
};
