import type { Metadata } from "next";
import Providers from "@/app/providers";
import { Analytics } from "@vercel/analytics/react";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "pennysave.ai",
  description:
    "Your personal AI financial advisor. Track your expenses, manage your budget, and achieve your financial goals.",
  keywords: [
    "finance tracking",
    "expense management",
    "budgeting",
    "financial goals",
    "pennysave.ai",
    "smart finance app",
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://api.iconify.design" />
        <link
          rel="preconnect"
          href="https://api.iconify.design"
          crossOrigin="anonymous"
        />
        <style>
          {`.text-center {
        text-align: center;
      }
      .text-6xl {
        font-size: 4rem;
      }
      .max-w-4xl {
        max-width: 64rem;
      }
      .font-semibold {
        font-weight: 600;
      }
      .leading-snug {
        line-height: 1.375;
      }
      .bg-clip-text {
        -webkit-background-clip: text;
        color: transparent;
      }
      .bg-gradient-to-r {
        background-image: linear-gradient(to right, #3b82f6, #9333ea);
      }
      `}
        </style>
      </head>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Analytics />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
