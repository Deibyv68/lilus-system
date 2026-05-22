import { ImageResponse } from "next/og";

export const dynamic = "force-static";

// Maskable icon: el contenido debe estar dentro del "safe zone" (80% central)
// para que no se corte cuando el OS lo recorta a círculo/cuadrado/etc.
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0a0a0a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            // 80% del tamaño total para safe zone
            width: "65%",
            height: "65%",
          }}
        >
          <div
            style={{
              fontSize: 110,
              fontWeight: 900,
              letterSpacing: "-5px",
              lineHeight: 1,
            }}
          >
            LILUS
          </div>
          <div
            style={{
              fontSize: 18,
              opacity: 0.7,
              fontStyle: "italic",
              marginTop: 10,
            }}
          >
            Ilumina tu belleza
          </div>
        </div>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
