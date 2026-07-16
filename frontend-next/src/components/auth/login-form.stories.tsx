import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';

/**
 * Specimen mirrors the "Email verified" banner markup in login-form.tsx, plus
 * two reference swatches used to prove *which* token the banner resolves to.
 *
 * Mounting `LoginForm` directly pulls in `GoogleLogin`, which calls Firebase's
 * `getAuth()` at module load and throws `auth/invalid-api-key` in the
 * Storybook test environment (no Firebase env vars configured for tests).
 * That's an unrelated import-time failure, not a router-mock problem, so per
 * the task brief we render the same banner markup directly instead of
 * mounting the full form. Keep this specimen's className in sync with the
 * banner in login-form.tsx.
 *
 * Tailwind v4's opacity modifier (`/30`) resolves via `color-mix(in oklab, ...)`,
 * so `getComputedStyle` returns an `oklab(...)` string here, not `rgb(...)`.
 * Comparing that to a hardcoded oklab literal would be unreadable and brittle,
 * so instead we compare the banner's computed border color against two
 * same-opacity reference swatches: one bound to `--success`, one to
 * `--module-habits`. The banner must match the former and differ from the
 * latter — the actual "two families, never aliased" contract this task exists
 * to enforce.
 */
function VerifiedBannerSpecimen() {
  return (
    <div>
      <div className="rounded-lg border border-success/30 bg-success/8 px-4 py-3">
        <p className="text-sm text-foreground">Email verified. Sign in to continue.</p>
      </div>
      <div data-testid="success-reference" className="border border-success/30" />
      <div data-testid="habits-reference" className="border border-module-habits/30" />
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
 * The "Email verified" banner means success — it must reference the status
 * family, not module-habits, even though both are green. Retuning the habits
 * accent must never repaint this banner.
 */
export const VerifiedBannerUsesSuccessToken: Story = {
  play: async ({ canvas }) => {
    const banner = await canvas.findByText(/email verified/i);
    const box = banner.closest('div')!;
    const bannerColor = getComputedStyle(box).borderColor;

    const successColor = getComputedStyle(canvas.getByTestId('success-reference')).borderColor;
    const habitsColor = getComputedStyle(canvas.getByTestId('habits-reference')).borderColor;

    await expect(bannerColor).toBe(successColor);
    await expect(bannerColor).not.toBe(habitsColor);
  },
};
