export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
    const { validateServerEnv } = await import("@/utils/env");
    validateServerEnv();
    const { logger } = await import("@/utils/logger");
    logger.info("Server startup: environment validated");
  }
}
