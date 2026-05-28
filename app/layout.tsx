import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Xan Bill | Restaurant Billing System",
  description:
    "Xan Bill is a responsive restaurant billing, inventory, table, and reporting platform built with Next.js.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
