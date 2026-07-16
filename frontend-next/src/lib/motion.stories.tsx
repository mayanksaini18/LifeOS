import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, waitFor } from 'storybook/test';
import { useEffect, useRef, useState } from 'react';
import { whenSomeInView } from './motion';

/**
 * Two elements in one group. `a` is pinned far below the fold
 * (`position: fixed; top: 150vh`) so it is *never* individually intersecting
 * — it can only fire via the group. `b` sits in the normal flow and is in
 * the viewport at mount. If `a` still ends up in `entered`, that's only
 * explicable by `b`'s enter transition propagating to the whole group —
 * which is the whole point of the helper. A naive per-element observer
 * (each element firing its own `onEnter` off its own `isIntersecting`)
 * would never fire for `a` here, so this fails under a non-grouped
 * implementation.
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
      <div
        ref={a}
        data-name="a"
        data-testid="a"
        style={{ position: 'fixed', top: '150vh', left: 0 }}
      >
        A
      </div>
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
