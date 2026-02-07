/**
 * @file Nuxt Configuration
 * @description Main Nuxt config for the CRM AI Studio app.
 * @remarks Configures runtime config, modules, and build settings.
 */

export default defineNuxtConfig({
  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  components: {
    dirs: [
      { path: '~/components', pathPrefix: false },
    ],
  },

  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || 'postgresql://crm_user:crm_pass@localhost:5433/crm_ai_studio',
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    chatModel: process.env.CHAT_MODEL || 'llama3.2',
    embeddingsModel: process.env.EMBEDDINGS_MODEL || 'nomic-embed-text',
    maxSqlRows: parseInt(process.env.MAX_SQL_ROWS || '200', 10),
    ragTopK: parseInt(process.env.RAG_TOP_K || '8', 10),
    toolTimeoutMs: parseInt(process.env.TOOL_TIMEOUT_MS || '30000', 10),
    plannerTemperature: parseFloat(process.env.PLANNER_TEMPERATURE || '0.1'),
    maxChatHistory: parseInt(process.env.MAX_CHAT_HISTORY || '20', 10),
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/api',
    },
  },

  vite: {
    plugins: [
      // @ts-expect-error - tailwindcss v4 vite plugin
      (await import('@tailwindcss/vite')).default(),
    ],
  },

  nitro: {
    experimental: {
      asyncContext: true,
    },
  },

  compatibilityDate: '2025-01-01',
});
