/**
 * "Email verified" confirmation banner shown on the login form after a
 * successful verification-link click. Extracted from `login-form.tsx` as its
 * own presentational component so it can be mounted directly in Storybook
 * tests. It was extracted because `GoogleLogin` -> `@/lib/firebase` used to
 * throw at module load without Firebase env vars; that is now guarded (see
 * `lib/firebase.ts`), but keeping this presentational split is still worth it.
 */
/**
 * The shared success-banner shell. `--success` is a status token and must stay
 * one — never alias it to a module accent (see tokens.stories.tsx).
 */
export function AuthSuccessBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-success/30 bg-success/8 px-4 py-3">
      <p className="text-sm text-foreground">{children}</p>
    </div>
  );
}

export function VerifiedBanner() {
  return <AuthSuccessBanner>Email verified. Sign in to continue.</AuthSuccessBanner>;
}
