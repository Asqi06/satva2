import { ImageResponse } from "next/og";

export const alt = "SatvaStones — everyday jewellery";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function SocialImage() {
  return new ImageResponse(
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: 90, width: "100%", height: "100%", background: "#f8f4ed", color: "#251d19" }}>
      <div style={{ fontSize: 80 }}>SatvaStones</div>
      <div style={{ fontSize: 32, marginTop: 28 }}>Everyday jewellery · India</div>
      <div style={{ fontSize: 24, marginTop: 80, color: "#775050" }}>www.satvastones.in</div>
    </div>, size,
  );
}
