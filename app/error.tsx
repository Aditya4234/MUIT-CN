"use client";

import { useEffect } from "react";
import { logger } from "@/utils/logger";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("Route error boundary caught an exception", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="max-w-md text-sm opacity-70">
        The navigation view hit an unexpected error. Your destination selection is safe — try again.
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-400"
      >
        Try again
      </button>
    </div>
  );
}
