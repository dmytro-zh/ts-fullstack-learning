"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main style={{ padding: 24 }}>
      <h1>Something went wrong</h1>
      <p style={{ color: "#b00" }}>{error.message}</p>
      <button onClick={() => reset()} style={{ marginTop: 12 }}>
        Try again
      </button>
    </main>
  );
}
