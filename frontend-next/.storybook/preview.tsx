import type { Preview } from '@storybook/nextjs-vite'
import '../src/app/globals.css'
import { ThemeProvider } from '../src/components/providers/theme-provider'
import { QueryProvider } from '../src/components/providers/query-provider'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    }
  },
  // Real provider tree from src/app/layout.tsx so stories render like the app.
  decorators: [
    (Story) => (
      <ThemeProvider>
        <QueryProvider>
          <Story />
        </QueryProvider>
      </ThemeProvider>
    ),
  ],
};

export default preview;