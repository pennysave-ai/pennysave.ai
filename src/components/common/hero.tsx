"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface HeroProps {
  description?: string;
}

export function Hero({ description }: HeroProps) {
  const [opacity, setOpacity] = useState(1);

  const handleScroll = () => {
    const scrollY = window.scrollY;
    const newFontSize = Math.max(1.5, 3 - scrollY / 100);
    const newOpacity = Math.max(0, 1 - scrollY / 200);
    setFontSize(newFontSize);
    setOpacity(newOpacity);
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const [fontSize, setFontSize] = useState(3);
  const pathname = usePathname();
  const currentPageName = pathname.charAt(1).toUpperCase() + pathname.slice(2);
  return (
    <div className="sticky top-16 px-4 py-8 pb-36 bg-gradient-to-b dark:from-secondary-600 dark:to-secondary-400 from-primary-600 to-primary-400 -z-10">
      <h1
        className="text-3xl font-bold leading-9 text-white"
        style={{ fontSize: `${fontSize}rem`, opacity }}
      >
        {currentPageName}
      </h1>
      {description && (
        <h2 className="mt-4 text-small text-white" style={{ opacity }}>
          {description}
        </h2>
      )}
    </div>
  );
}
