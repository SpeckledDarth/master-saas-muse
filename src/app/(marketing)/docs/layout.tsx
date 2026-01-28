import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Documentation | SaaS Muse',
  description: 'Everything you need to get started with our platform. Quick start guides, API reference, FAQ, and support resources.',
  openGraph: {
    title: 'Documentation | SaaS Muse',
    description: 'Everything you need to get started with our platform.',
    type: 'website',
  },
}

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
