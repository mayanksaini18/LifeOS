import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { LandingNav } from './landing-nav';

const meta = {
  component: LandingNav,
  tags: ['ai-generated'],
} satisfies Meta<typeof LandingNav>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The nav CTAs are composed as `<Button size="sm" className="...">`. `cva`
 * appends the incoming `className` *after* `size="sm"`'s own
 * `rounded-[min(var(--radius-md),12px)]`/`text-[0.8rem]` utilities in the
 * string `cn()` receives, so `twMerge` (which recognizes literal Tailwind
 * class syntax) drops the earlier conflicting `size="sm"` utilities in favor
 * of the later ones — but only if the override is itself written as literal
 * Tailwind utility classes. Routing the same properties through a custom
 * `@layer components` class (the previous `pill-cta`) does NOT work: that
 * class's declarations land in the `components` layer, which Tailwind v4's
 * fixed layer order always ranks below `utilities`, so `size="sm"`'s plain
 * utility classes silently win regardless of source order in the class
 * string. This asserts the actual rendered geometry, not a className string,
 * so it fails for either broken form (the old custom class, or dropping the
 * override entirely).
 */
export const CtaIsPillShaped: Story = {
  play: async ({ canvas }) => {
    // Base UI's Button forces role="button" on whatever it renders once
    // `nativeButton={false}` (see hero.tsx's own comment on the same
    // mechanic), so these render as `<a role="button">`, not `role="link"`.
    const getStarted = canvas.getByRole('button', { name: /get started/i });
    const signIn = canvas.getByRole('button', { name: /sign in/i });

    for (const btn of [getStarted, signIn]) {
      const style = getComputedStyle(btn);
      const height = btn.getBoundingClientRect().height;
      const radius = parseFloat(style.borderRadius);

      // A real pill's corner radius is at least half its own height — the
      // `sm` size variant's own radius (8px against a 28px-tall button)
      // fails this by a wide margin, which is exactly the bug this guards.
      await expect(radius).toBeGreaterThanOrEqual(height / 2 - 0.5);

      // The editorial micro-caption size the class name promises. The
      // `sm` size variant's own `text-[0.8rem]` (12.8px) is what silently
      // wins if the override isn't written as a literal utility class.
      await expect(style.fontSize).toBe('10px');
      await expect(style.textTransform).toBe('uppercase');
    }
  },
};
