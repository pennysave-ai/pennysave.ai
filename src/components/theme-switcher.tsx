"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Switch } from "@nextui-org/switch";
import { Moon, Sun } from "@/app/icons";

const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Switch
      isSelected={theme === "dark"}
      onChange={(e) => setTheme(e.target.checked ? "dark" : "light")}
      color="secondary"
      startContent={<Moon />}
      endContent={<Sun />}
      aria-label="toggle theme"
    />
  );
};

export default ThemeSwitcher;
