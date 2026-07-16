import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { useTheme } from 'next-themes';
import { useModuleChartColors } from './chart-theme';

/**
 * Mounts a real `useModuleChartColors()` consumer nested under the app's
 * actual `ThemeProvider` (see .storybook/preview.tsx) and flips the theme
 * through the same `next-themes` `setTheme` API the app's toggle button
 * uses — exercising the real effect-ordering race, not a simulated one.
 */
function ChartColorProbe() {
  const colors = useModuleChartColors();
  const { setTheme } = useTheme();
  return (
    <div>
      <span data-testid="mood-line">{colors.mood.line}</span>
      <button onClick={() => setTheme('dark')}>go dark</button>
    </div>
  );
}

const meta = {
  component: ChartColorProbe,
  tags: ['ai-generated'],
} satisfies Meta<typeof ChartColorProbe>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Regression guard: `useModuleChartColors` used to key its DOM read on
 * `resolvedTheme`, which updates in the *same* React commit as — but before
 * — the `.dark` class next-themes applies in its own effect (child effects
 * fire before parent effects). That left the chart holding the *previous*
 * theme's color for one extra render after every toggle. If this hook
 * regresses to that pattern, `mood-line` will still read the light value
 * (`#8d84b3`) here instead of the dark one (`#a79ecc`).
 */
export const UpdatesToDarkTokenOnToggle: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId('mood-line')).toHaveTextContent('#8d84b3');

    await userEvent.click(canvas.getByRole('button', { name: /go dark/i }));

    await waitFor(() => {
      expect(canvas.getByTestId('mood-line')).toHaveTextContent('#a79ecc');
    });
  },
};
