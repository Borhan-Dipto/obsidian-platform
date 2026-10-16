"use client";

/* Last-resort screen if the root layout itself fails. */
export default function GlobalError({ retry }) {
  return (
    <html lang="en-BD">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f1ece4",
          color: "#0b0b0b",
          fontFamily: "Georgia, 'Times New Roman', serif",
          padding: "24px",
        }}
      >
        <title>Something went wrong | OBSIDIAN</title>

        <div style={{ maxWidth: 560 }}>
          <p style={{ letterSpacing: "0.4em", fontSize: 12, textTransform: "uppercase", color: "#737373" }}>
            OBSIDIAN
          </p>

          <h1 style={{ fontWeight: 300, fontSize: 44, lineHeight: 1, margin: "20px 0" }}>
            Something went wrong.
          </h1>

          <p style={{ fontFamily: "system-ui, sans-serif", lineHeight: 1.7, color: "#525252" }}>
            Please try again in a moment.
          </p>

          <button
            type="button"
            onClick={() => retry()}
            style={{
              marginTop: 24,
              minHeight: 52,
              padding: "0 28px",
              background: "#0b0b0b",
              color: "#f1ece4",
              border: 0,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              fontSize: 12,
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
