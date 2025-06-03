/* eslint-disable no-unused-vars */
import React from "react";
import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/components/theme-provider";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  const isDark = theme === "dark";

  const handleToggle = (checked) => {
    setTheme(checked ? "dark" : "light");
  };

  const iconVariants = {
    active: {
      scale: 1,
      opacity: 1,
      rotate: 0,
      transition: { duration: 0.3, ease: "easeInOut" },
    },
    inactive: {
      scale: 0.8,
      opacity: 0.4,
      rotate: isDark ? -180 : 180,
      transition: { duration: 0.3, ease: "easeInOut" },
    },
  };

  const switchVariants = {
    light: {
      backgroundColor: "rgb(254 240 138)", // yellow-200
      transition: { duration: 0.3, ease: "easeInOut" },
    },
    dark: {
      backgroundColor: "rgb(51 65 85)", // slate-600
      transition: { duration: 0.3, ease: "easeInOut" },
    },
  };

  return (
    <motion.div
      className="flex items-center space-x-3 p-2 rounded-full bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        variants={iconVariants}
        animate={isDark ? "inactive" : "active"}
        className="flex items-center justify-center"
      >
        <Sun
          className={`h-4 w-4 ${
            isDark ? "text-slate-400" : "text-yellow-500 drop-shadow-sm"
          }`}
        />
      </motion.div>

      <Switch
        checked={isDark}
        onCheckedChange={handleToggle}
        className={`
          relative transition-all duration-300 ease-in-out
          data-[state=checked]:bg-slate-600 
          data-[state=unchecked]:bg-yellow-200
          border-2 border-white/20 
          shadow-inner
          ${isDark ? "shadow-slate-800/50" : "shadow-yellow-400/20"}
        `}
        aria-label="Toggle between light and dark mode"
      />

      <motion.div
        variants={iconVariants}
        animate={isDark ? "active" : "inactive"}
        className="flex items-center justify-center"
      >
        <Moon
          className={`h-4 w-4 ${
            isDark ? "text-blue-400 drop-shadow-sm" : "text-slate-400"
          }`}
        />
      </motion.div>
    </motion.div>
  );
}

// Alternative version with custom switch styling
export function ModeToggleCustom() {
  const { theme, setTheme } = useTheme();

  const isDark = theme === "dark";

  const handleToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <motion.div
      className="flex items-center space-x-2"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        animate={{
          scale: isDark ? 0.8 : 1,
          opacity: isDark ? 0.4 : 1,
          rotate: isDark ? -30 : 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <Sun
          className={`h-4 w-4 ${isDark ? "text-slate-400" : "text-yellow-500"}`}
        />
      </motion.div>

      <motion.button
        onClick={handleToggle}
        className={`
          relative w-11 h-6 rounded-full transition-all duration-300 ease-in-out
          ${isDark ? "bg-slate-600" : "bg-yellow-200"}
          ${
            isDark
              ? "shadow-inner shadow-slate-800/50"
              : "shadow-inner shadow-yellow-400/20"
          }
          border-2 border-white/20
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        `}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Toggle theme"
      >
        <motion.div
          className={`
            absolute top-0.5 w-5 h-5 rounded-full shadow-lg
            ${isDark ? "bg-blue-400" : "bg-yellow-500"}
            flex items-center justify-center
          `}
          animate={{
            x: isDark ? 20 : 0,
            rotate: isDark ? 360 : 0,
          }}
          transition={{
            duration: 0.3,
            ease: "easeInOut",
            rotate: { duration: 0.6 },
          }}
        >
          <motion.div
            animate={{ scale: isDark ? 1 : 0.8 }}
            transition={{ duration: 0.2 }}
          >
            {isDark ? (
              <Moon className="h-3 w-3 text-white" />
            ) : (
              <Sun className="h-3 w-3 text-white" />
            )}
          </motion.div>
        </motion.div>
      </motion.button>

      <motion.div
        animate={{
          scale: isDark ? 1 : 0.8,
          opacity: isDark ? 1 : 0.4,
          rotate: isDark ? 0 : 30,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <Moon
          className={`h-4 w-4 ${isDark ? "text-blue-400" : "text-slate-400"}`}
        />
      </motion.div>
    </motion.div>
  );
}
