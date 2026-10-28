import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Waylo: orientación para saber a qué nivel de atención acudir";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// A link preview is fetched by a bot with no cookies, so it always shows the default language.
// Two fixed lines, so the break never leaves a lone word hanging on the second one.
const TAGLINE = ["Orientación clara para saber", "a qué nivel de atención acudir"];

// The image is drawn once at build time, so the fonts are read from the project folder.
const loadFont = (file: string) => readFile(path.join(process.cwd(), "src", "app", "_og-fonts", file));

/** The mascot, drawn with the same sphere and eyes as the app's icon. Scaled by the size it is given. */
function Mascot({ size: px }: { size: number }) {
  return (
    <svg width={px} height={px} viewBox="0 0 120 120">
      <defs>
        <radialGradient id="sphere" cx="36%" cy="28%" r="78%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.45" stopColor="#f0f0f0" />
          <stop offset="0.8" stopColor="#cfcfcf" />
          <stop offset="1" stopColor="#8f8f8f" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(#sphere)" />
      <g transform="translate(46 58) rotate(-6)">
        <rect x="-7" y="-14" width="14" height="28" rx="7" fill="#0d0d0d" />
      </g>
      <g transform="translate(74 58) rotate(-6)">
        <rect x="-7" y="-14" width="14" height="28" rx="7" fill="#0d0d0d" />
      </g>
    </svg>
  );
}

export default async function OpenGraphImage() {
  const [pacifico, poppinsMedium] = await Promise.all([loadFont("Pacifico-Regular.ttf"), loadFont("Poppins-Medium.ttf")]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 96px",
          position: "relative",
          background: "#0b0b0b",
          overflow: "hidden",
        }}
      >
        {/* Light pooling behind the mascot, so the sphere reads against the dark. */}
        <div
          style={{
            position: "absolute",
            right: -120,
            top: -150,
            width: 900,
            height: 900,
            borderRadius: 450,
            background: "radial-gradient(circle, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.05) 45%, rgba(11,11,11,0) 70%)",
          }}
        />
        {/* A thin frame, the way the app's cards sit on its surface. */}
        <div
          style={{
            position: "absolute",
            inset: 28,
            borderRadius: 36,
            border: "2px solid rgba(255,255,255,0.09)",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", width: 600 }}>
          <div
            style={{
              display: "flex",
              fontFamily: "Pacifico",
              fontSize: 172,
              lineHeight: 1.2,
              color: "#ffffff",
              letterSpacing: -2,
            }}
          >
            Waylo
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 50,
              fontFamily: "Poppins",
              fontWeight: 500,
              fontSize: 38,
              lineHeight: 1.3,
              color: "#c4c4c4",
            }}
          >
            {TAGLINE.map((line) => (
              <div key={line} style={{ display: "flex" }}>
                {line}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Mascot size={320} />
          {/* The sphere's contact shadow. */}
          <div
            style={{
              display: "flex",
              width: 250,
              height: 30,
              marginTop: 14,
              borderRadius: 125,
              background: "radial-gradient(ellipse, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 70%)",
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Pacifico", data: pacifico, weight: 400, style: "normal" },
        { name: "Poppins", data: poppinsMedium, weight: 500, style: "normal" },
      ],
    },
  );
}
