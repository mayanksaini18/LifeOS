/**
 * "Email verified" confirmation banner shown on the login form after a
 * successful verification-link click. Extracted from `login-form.tsx` as its
 * own presentational component (no Firebase import in its module graph) so
 * it can be mounted directly in Storybook tests without pulling in
 * `GoogleLogin` -> `@/lib/firebase`, which calls `getAuth()` at module load
 * and crashes in the test environment (no Firebase env vars configured).
 */
export function VerifiedBanner() {
  return (
    <div className="rounded-lg border border-success/30 bg-success/8 px-4 py-3">
      <p className="text-sm text-foreground">Email verified. Sign in to continue.</p>
    </div>
  );
}
