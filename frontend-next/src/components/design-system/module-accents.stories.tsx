import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { LANDING_MODULES } from '@/lib/landing-data';

function ModuleAccents() {
  return (
    <ul>
      {LANDING_MODULES.map((m) => (
        <li key={m.key} data-testid={`mod-${m.key}`} className={m.bar}>
          {m.label}
        </li>
      ))}
    </ul>
  );
}

const meta = {
  component: ModuleAccents,
  tags: ['ai-generated'],
} satisfies Meta<typeof ModuleAccents>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Every module's solid accent must resolve through the token layer. A leftover
 * Tailwind literal still renders a color, so asserting "not transparent" is not
 * enough — we assert the exact token value.
 */
export const AccentsResolveToTokens: Story = {
  play: async ({ canvas }) => {
    // These are the light-theme token values; a prior story in the shared
    // browser context may have left `.dark` on the root, so pin light mode for
    // a deterministic assertion.
    document.documentElement.classList.remove('dark');
    const expected: Record<string, string> = {
      mood: 'rgb(141, 132, 179)',
      sleep: 'rgb(95, 135, 166)',
      water: 'rgb(79, 148, 144)',
      habits: 'rgb(109, 143, 90)',
      fitness: 'rgb(184, 112, 63)',
    };
    for (const [key, rgb] of Object.entries(expected)) {
      const el = canvas.getByTestId(`mod-${key}`);
      await expect(getComputedStyle(el).backgroundColor).toBe(rgb);
    }
  },
};
