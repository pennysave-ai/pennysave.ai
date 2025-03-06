"use client";

import Hero from "@/components/hero";
import HowTo from "@/components/how-to";
import Features from "@/components/features";
import { Image } from "@heroui/image";
import dashboardImage from "@/app/public/dashboard_1280.png";

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
            src={dashboardImage.src}
            width="100%"
            alt="hero-bg"
            // srcSet={`image-300.jpg 300w, image-768.jpg 768w, ${dashboardImage.src} 1280w`}
            // sizes="(max-width: 600px) 300px, (max-width: 1200px) 600px, 1200px"
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
