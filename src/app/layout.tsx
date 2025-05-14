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
      </head>
      <script
        async
        src="https://www.googletagmanager.com/gtag/js?id=AW-17082312814"
      ></script>
      <script>
        {`
  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer?.push(arguments); }
  gtag('js', new Date());
  gtag('config', 'AW-17082312814');
`}
      </script>
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
