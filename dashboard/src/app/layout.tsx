import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "\u{1F33A} Chaba AI Dashboard",
  description: "Admin Dashboard for Chaba AI Bot",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
