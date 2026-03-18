import React from "react";
import type { Metadata, Viewport } from "vinext/shims/metadata";
import Script from "vinext/shims/script";

import "./globals.css";
import AppShell from "../components/shared/app-shell";
import BackButton from "../components/shared/back-button";
import { gaMeasurementId, siteDescription, siteName, siteUrl } from "../constants/site";
import { LanguageProvider } from "../lib/language-context";

export const metadata: Metadata = {
  title: siteName,
  description: siteDescription,
  metadataBase: new URL(siteUrl),
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: siteName,
    description: siteDescription,
    siteName,
    locale: "en_US",
    type: "website",
    url: siteUrl,
    images: [
      {
        url: "/opengraph-image.jpg",
        width: 1200,
        height: 630,
        alt: siteName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
    images: [
      {
        url: "/twitter-image.jpg",
        alt: siteName,
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  minimumScale: 1,
};

const googleAnalyticsBootstrap = `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag("js", new Date());
  gtag("config", "${gaMeasurementId}");
`;

export default function RootLayout({
  children: _children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head />
      <body>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`} strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {googleAnalyticsBootstrap}
        </Script>
        <LanguageProvider>
          <AppShell />
          <BackButton />
        </LanguageProvider>
      </body>
    </html>
  );
}
