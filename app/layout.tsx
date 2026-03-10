import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GEUKROCK | Urban Fashion Commerce",
  description:
    "Minimal, editorial-first fashion commerce homepage built with Next.js, React, TypeScript, and Tailwind CSS.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
