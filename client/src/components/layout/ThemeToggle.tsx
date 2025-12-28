import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  const getTitle = () => {
    if (theme === "light") return "Switch to dark mode";
    if (theme === "dark") return "Switch to system preference";
    return "Switch to light mode";
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      title={getTitle()}
      aria-label={`Theme: ${theme || "system"}. Click to toggle theme.`}
      className="relative rounded-full w-10 h-10 transition-colors duration-200"
    >
      {/* Sun icon - visible in light mode */}
      <Sun
        className="absolute h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all duration-300 text-yellow-500 dark:hidden"
        aria-hidden="true"
      />

      {/* Moon icon - visible in dark mode */}
      <Moon
        className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all duration-300 text-blue-400 dark:rotate-0 dark:scale-100"
        aria-hidden="true"
      />

      {/* System icon - visible when system preference is selected */}
      {theme === "system" && (
        <div
          className="absolute h-[1.2rem] w-[1.2rem] rounded-sm bg-gradient-to-br from-yellow-500 to-blue-400 animate-pulse"
          aria-hidden="true"
        />
      )}
    </Button>
  );
}
