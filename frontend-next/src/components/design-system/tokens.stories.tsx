import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';

/**
 * Token contract tests. These assert the *computed* result of the token layer,
 * so a broken variable chain (a token pointing at something undefined) fails
 * loudly rather than silently falling back.
 */
function TokenSpecimen() {
  return (
    <div>
      <h1 data-testid="token-heading" className="font-heading">Heading</h1>
      <p data-testid="token-body" className="font-sans">Body</p>
      <span data-testid="token-mono" className="font-mono">LABEL</span>
    </div>
  );
}

const meta = {
  component: TokenSpecimen,
  tags: ['ai-generated'],
} satisfies Meta<typeof TokenSpecimen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FontTokens: Story = {
  play: async ({ canvas }) => {
    const heading = canvas.getByTestId('token-heading');
    await expect(getComputedStyle(heading).fontFamily).toMatch(/Fraunces/i);

    const body = canvas.getByTestId('token-body');
    await expect(getComputedStyle(body).fontFamily).toMatch(/Inter/i);

    // Regression guard: --font-mono previously pointed at an undefined
    // --font-geist-mono and silently fell back to the browser default.
    const mono = canvas.getByTestId('token-mono');
    await expect(getComputedStyle(mono).fontFamily).toMatch(/JetBrains/i);
  },
};
