import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");

    try {
      const { initializeWorker } = await import("@/lib/queue/worker-init");
      initializeWorker();
    } catch (err) {
      console.warn("[Queue] Worker initialization skipped:", (err as Error).message);
    }
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
