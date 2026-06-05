import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0e0a14",
        }}
      >
        <div
          style={{
            width: 132,
            height: 132,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#4d1979",
            color: "#ffffff",
            fontSize: 92,
            fontWeight: 800,
            borderRadius: 32,
            boxShadow: "0 0 60px rgba(139,92,246,0.6)",
          }}
        >
          F
        </div>
      </div>
    ),
    size,
  );
}
