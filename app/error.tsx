'use client';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div className="flex items-center justify-center min-h-[70vh] bg-canvas text-fg px-4">
      <div className="text-center max-w-md p-8 rounded-[28px] bg-surface space-y-4">
        <h1 className="text-[28px] sm:text-[40px] font-semibold text-fg tracking-[-0.022em]">
          Something went wrong
        </h1>
        <p className="text-[14px] text-fg-muted leading-relaxed">
          {error.message || 'An unexpected error occurred while loading this view.'}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-full bg-accent hover:bg-accent-hover text-white text-[14px] font-semibold transition-[background-color,transform] duration-150 apple-press apple-focus cursor-pointer"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
