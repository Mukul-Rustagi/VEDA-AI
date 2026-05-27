"use client";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): JSX.Element {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        background: "#ececec",
        color: "#151821",
        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
      }}
    >
      <div
        style={{
          width: "min(520px, 100%)",
          background: "#fff",
          border: "1px solid #e0e0e0",
          borderRadius: "16px",
          padding: "24px"
        }}
      >
        <h2 style={{ margin: 0, fontSize: "24px", fontWeight: 700 }}>
          Something went wrong
        </h2>
        <p style={{ marginTop: "10px", marginBottom: "0", color: "#5f6775" }}>
          {error.message || "An unexpected error occurred."}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            marginTop: "18px",
            border: "1px solid #ff6b3d",
            borderRadius: "999px",
            background: "#101218",
            color: "#fff",
            height: "38px",
            padding: "0 16px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
