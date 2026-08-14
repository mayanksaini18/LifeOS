import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { LegalShell, LegalSection } from './legal-shell';
import { LEGAL_LAST_UPDATED } from '@/lib/legal';

const meta = {
  component: LegalShell,
  tags: ['ai-generated'],
  args: {
    title: 'Privacy Policy',
    summary: 'What the app stores, who it goes to, and what you can do about it.',
    children: (
      <>
        <LegalSection heading="What we collect">
          <p>
            Your <strong>name</strong> and email, plus everything you choose to track.
          </p>
          <ul>
            <li>Mood ratings and notes</li>
            <li>Sleep, water and workouts</li>
          </ul>
        </LegalSection>
        <LegalSection heading="Contact">
          <p>
            Reach us at <a href="mailto:test@example.com">test@example.com</a>.
          </p>
        </LegalSection>
      </>
    ),
  },
} satisfies Meta<typeof LegalShell>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The document title is the page's only `h1` and section headings sit below it
 * as `h2`s — legal pages are read with screen readers and skimmed by outline,
 * so the heading ladder is load-bearing rather than cosmetic.
 */
export const HeadingLadderIsSemantic: Story = {
  play: async ({ canvas }) => {
    const h1s = canvas.getAllByRole('heading', { level: 1 });
    await expect(h1s).toHaveLength(1);
    await expect(h1s[0]).toHaveTextContent('Privacy Policy');

    const h2s = canvas.getAllByRole('heading', { level: 2 });
    await expect(h2s.map((h) => h.textContent)).toEqual([
      'What we collect',
      'Contact',
    ]);
  },
};

/**
 * The "last updated" stamp is what tells a returning reader whether the terms
 * changed under them, so assert it renders from the shared constant rather
 * than being hardcoded per page and silently drifting between the two.
 */
export const ShowsSharedLastUpdatedDate: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText(`Last updated ${LEGAL_LAST_UPDATED}`),
    ).toBeInTheDocument();
  },
};

/**
 * The brand mark is the way back out of a legal page — there is no other
 * navigation in this shell besides it and the footer.
 */
export const BrandLinksBackToLanding: Story = {
  play: async ({ canvas }) => {
    const links = canvas.getAllByRole('link', { name: /lifeos/i });
    await expect(links[0]).toHaveAttribute('href', '/welcome');
  },
};
