import React from "react";
import type { Metadata, Viewport } from "vinext/shims/metadata";
import "./globals.css";

const siteUrl = "https://ps2-startup-screen.yamadaasuma.workers.dev";

export const metadata: Metadata = {
  title: "PS2 Startup Screen",
  description:
    "PlayStation 2 の起動画面（タワーシーン）を Three.js でリアルタイム再現。React Three Fiber によるインタラクティブ 3D デモ。",
  metadataBase: new URL(siteUrl),
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "PS2 Startup Screen",
    description: "PlayStation 2 の起動画面を Three.js で完全再現したインタラクティブ 3D デモ",
    siteName: "PS2 Startup Screen",
    locale: "ja_JP",
    type: "website",
    images: [
      {
        url: "/opengraph-image.jpg",
        width: 1200,
        height: 630,
        alt: "PS2 Startup Screen - Tower Scene",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PS2 Startup Screen",
    description: "PlayStation 2 の起動画面を Three.js で完全再現したインタラクティブ 3D デモ",
    images: ["/twitter-image.jpg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  minimumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
