import "./globals.css";

export const metadata = {
  title: "PS2 Startup Screen",
  description: "PS2 Startup Screen built with vinext",
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
