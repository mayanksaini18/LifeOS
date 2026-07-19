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

function ColorSpecimen() {
  return (
    <div>
      <div data-testid="ground" className="bg-background">ground</div>
      <div data-testid="mood" className="bg-module-mood">mood</div>
      <div data-testid="sleep" className="bg-module-sleep">sleep</div>
      <div data-testid="water" className="bg-module-water">water</div>
      <div data-testid="habits" className="bg-module-habits">habits</div>
      <div data-testid="fitness" className="bg-module-fitness">fitness</div>
      <div data-testid="success" className="bg-success">success</div>
      <div data-testid="warning" className="bg-warning">warning</div>
    </div>
  );
}

export const ColorTokens: StoryObj<typeof ColorSpecimen> = {
  render: () => <ColorSpecimen />,
  play: async ({ canvas }) => {
    const bg = (id: string) =>
      getComputedStyle(canvas.getByTestId(id)).backgroundColor;

    await expect(bg('ground')).toBe('rgb(247, 248, 246)');   // #f7f8f6
    await expect(bg('mood')).toBe('rgb(141, 132, 179)');     // #8d84b3
    await expect(bg('sleep')).toBe('rgb(95, 135, 166)');     // #5f87a6
    await expect(bg('water')).toBe('rgb(79, 148, 144)');     // #4f9490
    await expect(bg('habits')).toBe('rgb(109, 143, 90)');    // #6d8f5a
    await expect(bg('fitness')).toBe('rgb(184, 112, 63)');   // #b8703f
    await expect(bg('success')).toBe('rgb(74, 124, 89)');    // #4a7c59
    await expect(bg('warning')).toBe('rgb(168, 118, 46)');   // #a8762e
  },
};

/**
 * Guards the "two families, never aliased" constraint: success and habits are
 * both green, and the whole point is that they are *different* greens that
 * change for unrelated reasons. If someone aliases one to the other, this fails.
 */
export const SuccessIsNotHabits: StoryObj<typeof ColorSpecimen> = {
  render: () => <ColorSpecimen />,
  play: async ({ canvas }) => {
    const bg = (id: string) =>
      getComputedStyle(canvas.getByTestId(id)).backgroundColor;
    await expect(bg('success')).not.toBe(bg('habits'));
  },
};
