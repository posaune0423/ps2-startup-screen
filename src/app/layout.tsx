import React from "react";
import type { Viewport } from "vinext/shims/metadata";
import "./globals.css";

export const metadata = {
  title: "PS2 Startup Screen",
  description: "PS2 Startup Screen built with vinext",
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
