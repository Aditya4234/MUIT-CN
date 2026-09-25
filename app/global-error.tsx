"use client";

import { logger } from "@/utils/logger";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  logger.error("Global error boundary caught a fatal exception", {
    message: error.message,
    digest: error.digest,
  });

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
          <h2 className="text-xl font-semibold">Application crashed</h2>
          <button
            onClick={reset}
            className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white"
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
