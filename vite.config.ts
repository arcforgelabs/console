/// <reference types="vitest/config" />
import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { playwright } from '@vitest/browser-playwright'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    silent: 'passed-only',
    unstubEnvs: true,
    projects: [
      {
        extends: true,
        test: {
          name: 'ui',
          include: ['src/**/*.test.{ts,tsx}'],
          browser: {
            enabled: true,
            // CHROMIUM_PATH lets a machine with its own Chromium run the tests.
            provider: playwright(
              process.env.CHROMIUM_PATH
                ? {
                    launchOptions: {
                      executablePath: process.env.CHROMIUM_PATH,
                    },
                  }
                : {}
            ),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      {
        test: {
          name: 'worker',
          include: ['worker/**/*.test.ts'],
          environment: 'node',
        },
      },
    ],
  },
})
