import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Two Paths",
  description:
    "Daily audio-led spiritual reflections across Judaism and Buddhism.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Two Paths",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
