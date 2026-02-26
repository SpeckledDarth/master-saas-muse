'use client'

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useSettings } from "@/hooks/use-settings"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { settings } = useSettings()

  const darkModeOption = settings?.branding?.darkModeOption || 'user-choice'

  useEffect(() => {
    if (darkModeOption === 'force-light') {
      setTheme('light')
    } else if (darkModeOption === 'force-dark') {
      setTheme('dark')
    }
  }, [darkModeOption, setTheme])

  if (darkModeOption === 'force-light' || darkModeOption === 'force-dark') {
    return null
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      data-testid="button-theme-toggle"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
