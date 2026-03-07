// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'node:url'

const srcDir = fileURLToPath(new URL('./src', import.meta.url))

export default defineNuxtConfig({
  devtools: { enabled: true },
  srcDir: 'src/',
  compatibilityDate: '2025-03-05',

  experimental: { appManifest: false },

  dir: {
    server: 'src/server',
  },

  alias: {
    '@': srcDir,
  },

  css: [`${srcDir}/styles/_variables.scss`],

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: (source: string, filename: string) => {
            const normalized = filename?.replace(/\\/g, '/') ?? ''
            if (normalized.endsWith('_variables.scss')) return source
            const path = srcDir.replace(/\\/g, '/')
            return `@use "${path}/styles/_variables.scss" as *;\n${source}`
          },
        },
      },
    },
  },

  runtimeConfig: {
    modelsPath: process.env.NUXT_MODELS_PATH || 'models',
    public: {
      engineApiUrl: process.env.NUXT_PUBLIC_ENGINE_API_URL || '',
    },
  },

  modules: ['@pinia/nuxt'],

  pinia: {
    storesDirs: ['./stores/**'],
  },

  nitro: {
    preset: 'node-server',
  },
})
