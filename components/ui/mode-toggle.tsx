"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="w-[52px] h-7 rounded-full bg-bg-overlay border border-border-base" />;
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      className="relative w-[52px] h-7 rounded-full bg-bg-overlay border border-border-base cursor-pointer"
      style={{ transition: "background 400ms ease" }}
    >
      <motion.div
        className="absolute top-[3px] left-1 w-5 h-5 rounded-full bg-brand flex items-center justify-center"
        animate={{ x: isDark ? 0 : 24 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        {isDark ? (
          <Moon size={12} className="text-text-on-brand" />
        ) : (
          <Sun size={12} className="text-text-on-brand" />
        )}
      </motion.div>
    </button>
  );
}
