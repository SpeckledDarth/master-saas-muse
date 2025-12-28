import { Sidebar } from "@/components/layout/Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role?: "admin" | "user";
  } | null;
  onLogout?: () => void;
}

export function DashboardLayout({ children, user = null, onLogout }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-muted/20">
      <Sidebar user={user} onLogout={onLogout} />

      {/* Main Content - Offset for desktop sidebar */}
      <main className="md:ml-64 pt-16 min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
