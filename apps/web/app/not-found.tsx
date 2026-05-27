import Link from "next/link";

export default function NotFound(): JSX.Element {
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
          Page not found
        </h2>
        <p style={{ marginTop: "10px", marginBottom: 0, color: "#5f6775" }}>
          The page you are looking for does not exist.
        </p>
        <Link
          href="/assignments"
          style={{
            marginTop: "18px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid #ff6b3d",
            borderRadius: "999px",
            background: "#101218",
            color: "#fff",
            height: "38px",
            padding: "0 16px",
            fontSize: "14px",
            fontWeight: 600,
            textDecoration: "none"
          }}
        >
          Back to Assignments
        </Link>
      </div>
    </div>
  );
}
