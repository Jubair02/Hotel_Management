import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * Home-screen icon — the same brass key tag with a tulip as icon.svg,
 * rendered to PNG at 180×180 for iOS, which ignores SVG favicons.
 */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f7f6f2",
        }}
      >
        <svg viewBox="0 0 64 64" width="164" height="164">
          <defs>
            <linearGradient id="brass" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f0c66e" />
              <stop offset="1" stopColor="#e3a32c" />
            </linearGradient>
          </defs>
          <rect x="3" y="3" width="58" height="58" rx="15" fill="url(#brass)" stroke="#c98a1b" strokeOpacity="0.7" strokeWidth="2" />
          <rect x="5.5" y="5.5" width="53" height="53" rx="13" fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="1" />
          <circle cx="49" cy="15" r="4" fill="#f7f6f2" stroke="#c98a1b" strokeWidth="1.5" />
          <g fill="#16302b">
            <path d="M19 24c0-7 4-11 8-8 2 1.6 3.5 4 5 7 1.5-3 3-5.4 5-7 4-3 8 1 8 8 0 10-5.5 17-13 17S19 34 19 24Z" />
            <path d="M30.6 41h2.8v13h-2.8z" />
            <path d="M31 50c-4-4-10-5-14-2 3 4 9 5 14 2Z" />
          </g>
          <path d="M26.5 19.5 32 29.5 37.5 19.5" fill="none" stroke="#e3a32c" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
        </svg>
      </div>
    ),
    size
  );
}
