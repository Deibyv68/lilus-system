import { ImageResponse } from "next/og";

export const dynamic = "force-static";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0a0a0a",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 160,
            fontWeight: 900,
            letterSpacing: "-8px",
            lineHeight: 1,
          }}
        >
          LILUS
        </div>
        <div
          style={{
            fontSize: 28,
            opacity: 0.7,
            fontStyle: "italic",
            marginTop: 14,
          }}
        >
          Ilumina tu belleza
        </div>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
