import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeSettingsProvider } from "@/components/theme-settings-provider"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { PlausibleAnalytics } from "@/components/analytics/plausible"

const inter = Inter({
  subsets: ["latin"],
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
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ThemeSettingsProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </ThemeSettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
