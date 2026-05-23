import { ImageResponse } from "next/og";

export const dynamic = "force-static";
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
          background: "#14130F",
        }}
      >
        <svg width="148" height="148" viewBox="-130 -130 260 260">
          <circle r="124" fill="#F6C414" />
          <circle r="124" fill="none" stroke="#C48A05" strokeWidth="10" />
          <path
            d="M0 -78 L23 -24 L81 -20 L36 17 L50 74 L0 43 L-50 74 L-36 17 L-81 -20 L-23 -24 Z"
            fill="#14130F"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
