"use client";

/**
 * Last-resort boundary for errors thrown by the root layout itself. It has
 * to render its own <html>/<body> and cannot rely on the app's fonts or
 * Tailwind theme being loaded, so the styling is inline and self-contained.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f7f6f2",
          color: "#1f2723",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div style={{ maxWidth: 480, padding: "0 24px", textAlign: "center" }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#8a968f",
            }}
          >
            Grand Tulip
          </p>
          <h1
            style={{
              margin: "8px 0 0",
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: 32,
              fontWeight: 400,
              color: "#16302b",
            }}
          >
            We hit a snag behind the desk
          </h1>
          <p style={{ marginTop: 12, fontSize: 14, color: "#5c6b66" }}>
            The site could not be loaded. Please try again in a moment.
          </p>
          {error.digest && (
            <p style={{ marginTop: 8, fontSize: 12, color: "#8a968f", fontFamily: "monospace" }}>
              Reference {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              marginTop: 24,
              padding: "10px 20px",
              borderRadius: 6,
              border: 0,
              background: "#1d4a43",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
