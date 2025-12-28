import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Settings,
  CreditCard,
  HelpCircle,
  Shield,
  Menu,
  LogOut,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role?: "admin" | "user";
  } | null;
  onLogout?: () => void;
}

export function Sidebar({ user = null, onLogout }: SidebarProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const navigationItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
    { href: "/help", label: "Help", icon: HelpCircle },
    ...(user?.role === "admin"
      ? [{ href: "/admin", label: "Admin", icon: Shield }]
      : []),
  ];

  const handleLogout = () => {
    setMobileMenuOpen(false);
    onLogout?.();
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 group p-4 mb-8">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold font-display text-lg shadow-lg shadow-primary/25 group-hover:scale-110 transition-transform duration-200">
          M
        </div>
        <span className="font-display font-bold text-base tracking-tight hidden sm:inline">
          Muse
        </span>
      </Link>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1 px-3">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || location.startsWith(item.href);

          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 transition-all",
                  isActive && "shadow-sm"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      {user && (
        <div className="border-t border-border/50 p-3 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <Avatar className="h-9 w-9 shrink-0">
              {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
              <AvatarFallback className="text-xs font-medium">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-destructive hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Log out</span>
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-16 bottom-0 w-64 border-r border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-col z-40">
        <SidebarContent />
      </aside>

      {/* Mobile Menu Trigger */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden fixed bottom-4 left-4 z-40"
            data-testid="button-mobile-sidebar"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  );
}
