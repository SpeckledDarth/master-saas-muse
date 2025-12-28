import { Link } from "wouter";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold font-display text-xl shadow-lg shadow-primary/25 group-hover:scale-110 transition-transform duration-200">
            M
          </div>
          <span className="font-display font-bold text-lg tracking-tight hidden sm:inline">
            Muse
          </span>
        </Link>

        {/* Dark Mode Toggle */}
        <ThemeToggle />
      </div>
    </header>
  );
}
