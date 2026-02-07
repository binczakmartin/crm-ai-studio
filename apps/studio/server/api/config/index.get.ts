/**
 * @file Config Endpoint
 * @description GET /api/config — Exposes safe runtime config values to the client.
 * @remarks Only expose non-sensitive values. Never expose database URLs, secrets, or internal details.
 */

export default defineEventHandler(async () => {
  const config = useRuntimeConfig();

  return {
    maxChatHistory: config.maxChatHistory ?? 20,
  };
});
