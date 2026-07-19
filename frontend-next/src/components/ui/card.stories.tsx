import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './card';
import { Button } from './button';

const meta = {
  component: Card,
  tags: ['ai-generated'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

// Smoke check — proves the composed title slot renders.
export const Default: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Hydration</CardTitle>
        <CardDescription>Today&apos;s water intake</CardDescription>
      </CardHeader>
      <CardContent>1.8L of 2.5L goal</CardContent>
    </Card>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Hydration')).toBeVisible();
  },
};

export const WithFooter: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Morning run</CardTitle>
        <CardDescription>5.2 km · 28 min</CardDescription>
      </CardHeader>
      <CardContent>Nice pace — 12s faster than last week.</CardContent>
      <CardFooter>
        <Button size="sm">View details</Button>
      </CardFooter>
    </Card>
  ),
};

export const Small: Story = {
  render: () => (
    <Card size="sm" className="w-64">
      <CardHeader>
        <CardTitle>Mood</CardTitle>
      </CardHeader>
      <CardContent>Feeling good today 🙂</CardContent>
    </Card>
  ),
};
