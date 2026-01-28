import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Features | SaaS Muse',
  description: 'Discover the powerful features that make our platform the best choice for your needs. Lightning fast, secure by default, and works everywhere.',
  openGraph: {
    title: 'Features | SaaS Muse',
    description: 'Discover the powerful features that make our platform the best choice for your needs.',
    type: 'website',
  },
}

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
