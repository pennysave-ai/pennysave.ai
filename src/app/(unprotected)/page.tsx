"use server";

import { Suspense, lazy } from "react";
import { Image } from "@heroui/image";
import dashboardMobile from "@/app/public/dashboard_mobile.avif";
import dashboardTablet from "@/app/public/dashboard_tablet.avif";
import dashboardDesktop from "@/app/public/dashboard_desktop.avif";
import dashboardMobileWebp from "@/app/public/dashboard_mobile.webp";
import dashboardTabletWebp from "@/app/public/dashboard_tablet.webp";
import dashboardDesktopWebp from "@/app/public/dashboard_desktop.webp";

const Features = lazy(() => import("@/components/features"));
const HowTo = lazy(() => import("@/components/how-to"));
const HeroButtons = lazy(() => import("@/components/hero-buttons"));
const TestimonialsSection = lazy(() => import("@/components/testimonials"));

export default async function HomePage() {
  return (
    <div className="flex justify-center max-w-6xl mx-auto">
      <div className="my-20">
        <div className="flex flex-col items-center justify-center px-6">
          <div className="text-center text-6xl max-w-4xl font-semibold leading-snug">
            Take{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
              Control
            </span>{" "}
            of Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
              Finances
            </span>{" "}
            with Ease!
          </div>
          <div className="text-lg text-default-500 text-center">
            A Free convenient Tool for managing your finances.
          </div>
          <div className="flex gap-4 mt-8">
            <Suspense fallback={<div>Loading CTA buttons...</div>}>
              <HeroButtons />
            </Suspense>
          </div>
        </div>
        <section
          id="home"
          className="relative w-full flex justify-center mt-10 px-6 xl:px-0"
        >
          <picture>
            {/* AVIF (best compression) */}
            <source
              type="image/avif"
              srcSet={`${dashboardMobile.src} 640w, ${dashboardTablet.src} 900w, ${dashboardDesktop.src} 1280w`}
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 1280px"
            />
            {/* WebP fallback */}
            <source
              type="image/webp"
              srcSet={`${dashboardMobileWebp.src} 640w, ${dashboardTabletWebp.src} 900w, ${dashboardDesktopWebp.src} 1280w`}
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 1280px"
            />
            {/* Fallback */}
            <Image
              src={dashboardDesktopWebp.src}
              alt="PennySave Dashboard - Financial Management Interface"
              loading="eager"
              fetchPriority="high"
              width={1280}
              height={877}
              className="w-full max-w-[1152px] !h-auto object-contain"
            />
          </picture>
          <div className="blur-background blur-1 absolute top-[-380px] left-[-320px]" />
        </section>
        <Suspense fallback={<div>Loading Features section...</div>}>
          <Features />
        </Suspense>
        <Suspense fallback={<div>Loading Testimonials section...</div>}>
          <TestimonialsSection />
        </Suspense>
        <Suspense fallback={<div>Loading How to section...</div>}>
          <HowTo />
        </Suspense>
        <div className="triangle absolute left-0 bottom-0" />
      </div>
    </div>
  );
}
