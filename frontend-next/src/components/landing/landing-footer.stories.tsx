import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { LandingFooter } from './landing-footer';

const meta = {
  component: LandingFooter,
  tags: ['ai-generated'],
} satisfies Meta<typeof LandingFooter>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Column headings and the bottom-bar copyright/tagline lines switched to
 * `label-mono`. Asserts the actual computed uppercase transform + mono font
 * stack, not just the className string, per this repo's established pattern
 * (see section.stories.tsx / tokens.stories.tsx).
 */
export const HeadingsAndBottomBarUseLabelMono: Story = {
  play: async ({ canvas }) => {
    for (const heading of ['Product', 'Account', 'Legal']) {
      const el = canvas.getByText(heading);
      await expect(el.className).toContain('label-mono');
      await expect(getComputedStyle(el).fontFamily).toMatch(/JetBrains/i);
      await expect(getComputedStyle(el).textTransform).toBe('uppercase');
    }

    const year = new Date().getFullYear();
    const copyright = canvas.getByText(`© ${year} LifeOS`);
    await expect(copyright.className).toContain('label-mono');
    await expect(getComputedStyle(copyright).fontFamily).toMatch(/JetBrains/i);

    const tagline = canvas.getByText('Made for your well-being.');
    await expect(tagline.className).toContain('label-mono');
    await expect(getComputedStyle(tagline).fontFamily).toMatch(/JetBrains/i);
  },
};

/**
 * Behavioral fact the diff didn't touch but is cheap to lock down while
 * adding this file: each footer column renders the correct hrefs, in the
 * correct column, not just the correct link text.
 *
 * The Product anchors are absolute (`/welcome#modules`, not `#modules`)
 * because this footer also renders on /privacy and /terms, where those
 * sections don't exist and a bare hash would just jump to the top.
 */
export const LinkColumnsHaveCorrectHrefs: Story = {
  play: async ({ canvas }) => {
    const expectations: [string, string][] = [
      ['Features', '/welcome#modules'],
      ['How it works', '/welcome#how'],
      ['Insights', '/welcome#insights'],
      ['Sign in', '/login'],
      ['Create account', '/register'],
      ['Privacy', '/privacy'],
      ['Terms', '/terms'],
    ];
    for (const [label, href] of expectations) {
      await expect(canvas.getByRole('link', { name: label })).toHaveAttribute('href', href);
    }
  },
};

/**
 * The Legal column shipped for months as two `href="#"` placeholders that
 * silently jumped to the top of the page. Assert they point at real routes so
 * a future edit can't quietly regress them back to dead links.
 */
export const LegalLinksAreNotPlaceholders: Story = {
  play: async ({ canvas }) => {
    for (const label of ['Privacy', 'Terms']) {
      const href = canvas.getByRole('link', { name: label }).getAttribute('href');
      await expect(href).not.toBe('#');
      await expect(href).toMatch(/^\/\w/);
    }
  },
};
