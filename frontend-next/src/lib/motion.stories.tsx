import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, waitFor } from 'storybook/test';
import { useEffect, useRef, useState } from 'react';
import { whenSomeInView } from './motion';

/**
 * Two elements in one group. Only the second is scrolled into view — both must
 * still fire, because the group enters together. That grouping behavior is the
 * whole point of the helper.
 */
function GroupHarness() {
  const a = useRef<HTMLDivElement>(null);
  const b = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState<string[]>([]);

  useEffect(() => {
    if (!a.current || !b.current) return;
    return whenSomeInView([a.current, b.current], {
      onEnter: (el) => setEntered((p) => [...p, (el as HTMLElement).dataset.name!]),
      once: true,
      threshold: 0.1,
    });
  }, []);

  return (
    <div>
      <div ref={a} data-name="a" data-testid="a">A</div>
      <div ref={b} data-name="b" data-testid="b">B</div>
      <output data-testid="entered">{[...entered].sort().join(',')}</output>
    </div>
  );
}

const meta = {
  component: GroupHarness,
  tags: ['ai-generated'],
} satisfies Meta<typeof GroupHarness>;

export default meta;
type Story = StoryObj<typeof meta>;

export const GroupEntersTogether: Story = {
  play: async ({ canvas }) => {
    // `storybook/test`'s bundled `expect` (Storybook 10.5) doesn't carry
    // `expect.poll` — it's a minimal chai + Jest-matchers build, not the
    // full vitest `expect`. `waitFor` (already used elsewhere in this repo,
    // see chart-theme.stories.tsx) polls the same way.
    await waitFor(() => {
      expect(canvas.getByTestId('entered').textContent).toBe('a,b');
    });
  },
};
