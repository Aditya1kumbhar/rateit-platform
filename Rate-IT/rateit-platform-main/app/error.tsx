'use client';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Oops! Something went wrong
        </h1>
        <p className="text-gray-600 mb-8">
          {error.message || 'An unexpected error occurred'}
        </p>
        <button
          onClick={reset}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
