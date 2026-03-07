import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default mergeConfig(
  defineConfig({
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "${fileURLToPath(new URL('./src/styles/_variables.scss', import.meta.url))}" as *;`,
        },
      },
    },
  }),
  defineConfig({
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
    },
  }),
)
