import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeSettingsProvider } from "@/components/theme-settings-provider"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { PlausibleAnalytics } from "@/components/analytics/plausible"
import { ImpersonationBanner } from "@/components/impersonation-banner"
import { CookieConsentWrapper } from "@/components/cookie-consent-wrapper"
import { UnifiedSupportWidget } from "@/components/unified-support-widget"
import { Toaster } from "@/components/ui/toaster"
import { Suspense } from "react"
import { ReferralTracker } from "@/components/referral-tracker"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "SaaS Muse - Build Your SaaS Faster",
  description: "A production-ready SaaS template with authentication, payments, and everything you need to launch.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <PlausibleAnalytics />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={inter.variable}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ThemeSettingsProvider>
            <div className="flex min-h-screen flex-col">
              <ImpersonationBanner />
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
              <CookieConsentWrapper />
              <UnifiedSupportWidget />
              <Suspense fallback={null}>
                <ReferralTracker />
              </Suspense>
            </div>
            <Toaster />
          </ThemeSettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
