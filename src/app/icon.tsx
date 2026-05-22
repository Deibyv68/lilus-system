import { ImageResponse } from "next/og";

export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon() {
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
            fontSize: 58,
            fontWeight: 900,
            letterSpacing: "-3px",
            lineHeight: 1,
          }}
        >
          LILUS
        </div>
        <div
          style={{
            fontSize: 11,
            opacity: 0.7,
            fontStyle: "italic",
            marginTop: 6,
          }}
        >
          Ilumina tu belleza
        </div>
      </div>
    ),
    { ...size }
  );
}
