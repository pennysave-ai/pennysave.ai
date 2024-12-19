"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function Hero() {
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
    <div className="sticky top-16 px-4 py-8 pb-36 bg-gradient-to-b dark:from-purple-600 dark:to-purple-400 from-blue-600 to-blue-400">
      <h1
        className="text-3xl font-bold leading-9 text-white"
        style={{ fontSize: `${fontSize}rem`, opacity }}
      >
        {currentPageName}
      </h1>
    </div>
  );
}
