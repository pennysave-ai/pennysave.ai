import type { Metadata } from "next";
import Script from "next/script";
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
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, shrink-to-fit=no"
        />
      </head>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=AW-17082312814"
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){ dataLayer?.push(arguments); }
            gtag('js', new Date());
            gtag('config', 'AW-17082312814');
          `}
      </Script>
      <Script>
        {`(function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "rwywkz1jir");
        `}
      </Script>
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
