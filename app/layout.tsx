// app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ส.เจริญหลังคาเหล็ก",
  description:
    "ลงทะเบียนลุ้นรางวัล",
  manifest: "/manifest.json",
  icons: {
    // ไอคอนหลักของเว็บ + PWA
    icon: [
      {
        url: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    // ไอคอนสำหรับ iOS (Add to Home Screen)
    apple: [
      {
        url: "/icons/apple-icon-180.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

// theme color สำหรับ status bar / PWA
export const viewport: Viewport = {
  themeColor: "#29b2e3ff",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
