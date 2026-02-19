'use client'

import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { SocialSidebar } from '@/components/social/social-sidebar'
import { SocialUpgradeBanner } from '@/components/social-upgrade-banner'

export default function SocialDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const style = {
    '--sidebar-width': '15rem',
    '--sidebar-width-icon': '3rem',
  }

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex min-h-screen w-full">
        <SocialSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <SocialUpgradeBanner />
          <header className="flex items-center gap-2 border-b px-4 py-2 md:hidden">
            <SidebarTrigger data-testid="button-social-sidebar-toggle" />
            <span className="text-sm font-medium">PassivePost</span>
          </header>
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
