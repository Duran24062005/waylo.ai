import { ImageResponse } from "next/og";
import { messages } from "@/i18n/messages";

export const alt = "Waylo";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// A link preview is fetched by a bot with no cookies, so it always shows the default language.
const { siteDescription } = messages.es.meta;

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 96px",
          background: "linear-gradient(135deg, #0d0d0d 0%, #262626 100%)",
          color: "#ffffff",
        }}
      >
        <div style={{ fontSize: 168, fontWeight: 700, letterSpacing: -4, lineHeight: 1 }}>Waylo</div>
        <div style={{ marginTop: 32, fontSize: 44, lineHeight: 1.3, color: "#d4d4d4", maxWidth: 900 }}>
          {siteDescription}
        </div>
      </div>
    ),
    size,
  );
}
