import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { OnboardingWizard } from './onboarding-wizard';

const meta = {
  component: OnboardingWizard,
  tags: ['ai-generated'],
  args: { onFinish: fn(), onSkip: fn() },
} satisfies Meta<typeof OnboardingWizard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Advancing through all three steps calls onFinish with the default goal values.
export const CompletesWithDefaults: Story = {
  play: async ({ canvas, args }) => {
    // Step 1 (Sleep)
    await expect(canvas.getByText(/sleep/i)).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: /next/i }));
    // Step 2 (Water)
    await expect(canvas.getByText(/water/i)).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: /next/i }));
    // Step 3 (Exercise) — primary button becomes "Finish"
    await expect(canvas.getByText(/exercise/i)).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: /finish/i }));

    await expect(args.onFinish).toHaveBeenCalledWith({ sleep: 7, water: 8, exercise: 4 });
  },
};

// "Skip for now" is available on the first step and calls onSkip.
export const SkipsFromFirstStep: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: /skip for now/i }));
    await expect(args.onSkip).toHaveBeenCalled();
  },
};

// Increment then complete: onFinish reflects the adjusted sleep value.
export const AdjustsThenCompletes: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: /increase/i })); // sleep 7 -> 8
    await userEvent.click(canvas.getByRole('button', { name: /next/i }));
    await userEvent.click(canvas.getByRole('button', { name: /next/i }));
    await userEvent.click(canvas.getByRole('button', { name: /finish/i }));
    await expect(args.onFinish).toHaveBeenCalledWith({ sleep: 8, water: 8, exercise: 4 });
  },
};
