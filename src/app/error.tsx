"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ivory px-6 text-center text-ink">
        <h1 className="section-title text-3xl">Something went wrong</h1>
        <p className="max-w-md text-warm-gray">
          {error.digest
            ? `Reference ${error.digest}. Please try again.`
            : "Please try again. If it keeps happening, contact support."}
        </p>
        <button
          type="button"
          onClick={reset}
          className="btn-primary"
        >
          Try again
        </button>
    </div>
  );
}
