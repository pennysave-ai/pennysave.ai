"use client";
import Hero from "@/components/hero";
import HowTo from "@/components/how-to";
import Features from "@/components/features";
import { Image } from "@heroui/image";
import dashboardLight_1800 from "@/app/public/dashboard_light_1800.webp";
import dashboardLight_900 from "@/app/public/dashboard_light_900.webp";

export default function HomePage() {
  return (
    <div className="flex justify-center max-w-6xl mx-auto">
      <div className="my-20">
        <Hero />
        <section
          id="home"
          className="relative w-full flex justify-center mt-10"
        >
          <Image
            src={dashboardLight_1800.src}
            alt="hero-bg"
            srcSet={`${dashboardLight_900.src} 1280w, ${dashboardLight_1800.src} 1400w`}
          />
          <div className="blur-background blur-1 absolute top-[-380px] left-[-320px]" />
        </section>
        <Features />
        <HowTo />
        <div className="triangle absolute left-0 bottom-0" />
      </div>
    </div>
  );
}
