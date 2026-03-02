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
import { ScrollToTop } from "@/components/scroll-to-top"
import { getSettingsServer } from "@/lib/get-settings-server"
import { computeDesignSystemCSS, computeDataAttributes } from "@/lib/compute-css-vars"

export const dynamic = 'force-dynamic'

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "SaaS Muse - Build Your SaaS Faster",
  description: "A production-ready SaaS template with authentication, payments, and everything you need to launch.",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  let designSystemCSS = ''
  let dataAttrs: Record<string, string> = {}

  try {
    const settings = await getSettingsServer()
    designSystemCSS = computeDesignSystemCSS(settings.branding)
    dataAttrs = computeDataAttributes(settings.branding)
  } catch (err) {
    console.error('[RootLayout] Failed to compute server-side CSS vars:', err)
  }

  return (
    <html lang="en" suppressHydrationWarning {...dataAttrs}>
      <head>
        <PlausibleAnalytics />
        {designSystemCSS && (
          <style
            id="design-system-vars"
            dangerouslySetInnerHTML={{ __html: designSystemCSS }}
          />
        )}
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
      <body className={inter.variable} suppressHydrationWarning>
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
            <ScrollToTop />
          </ThemeSettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
