"use client";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#fff9ee",
          color: "#17120c",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <main
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: 24,
          }}
        >
          <section
            style={{
              maxWidth: 620,
              border: "1px solid rgba(0, 29, 61, 0.14)",
              borderRadius: 12,
              background: "rgba(255, 255, 255, 0.76)",
              padding: 28,
              textAlign: "center",
              boxShadow: "0 18px 44px rgba(26, 18, 10, 0.12)",
            }}
          >
            <h1 style={{ margin: 0, fontSize: 34 }}>Something went quiet.</h1>
            <p style={{ fontSize: 20, lineHeight: 1.45 }}>
              The reflection could not open just now.
              {error.digest ? ` Reference: ${error.digest}.` : ""}
            </p>
            <button
              onClick={unstable_retry}
              style={{
                minHeight: 56,
                border: 0,
                borderRadius: 10,
                background: "#001d3d",
                color: "#fffaf0",
                cursor: "pointer",
                fontSize: 20,
                fontWeight: 700,
                padding: "12px 20px",
              }}
            >
              Try again
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
