import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "PennySave.ai - Take control of your finances with ease",
  description:
    "How can I optimize my expences? Get personalized insights and recommendations to help you save money, reduce debt, and improve your financial health",
  keywords: [
    "money management tool",
    "personal finance software",
    "budget planner app",
    "budget tracker",
    "track expenses online",
    "online money managers",
    "personal accounting software",
    "best budgeting tools",
    "best personal finance software",
    "personal budget software",
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className="antialiased">
        <Analytics />
        {children}
      </body>
    </html>
  );
}
