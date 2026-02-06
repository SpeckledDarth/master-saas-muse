import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { CookieConsentWrapper } from '@/components/cookie-consent-wrapper'
import { HelpWidgetWrapper } from '@/components/help-widget-wrapper'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CookieConsentWrapper />
      <HelpWidgetWrapper />
    </div>
  )
}
