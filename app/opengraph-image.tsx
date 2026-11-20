import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const alt = `${site.name}. ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "radial-gradient(120% 90% at 80% 10%, #2b2014 0%, #131210 45%, #0b0a09 80%)",
        color: "#ede7db",
        fontFamily: "serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 22,
          letterSpacing: 6,
          color: "#b9b1a2",
        }}
      >
        <span>HANDYMAN &amp; RENOVATIONS</span>
        <span>ARIZONA</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 150, lineHeight: 1, letterSpacing: -4 }}>Sal Dana</div>
        <div style={{ fontSize: 46, marginTop: 20, color: "#c8a46a" }}>Your home, finished properly.</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: "#b9b1a2" }}>
        <span>{site.phoneDisplay}</span>
        <span>{site.region}</span>
      </div>
    </div>,
    size,
  );
}
