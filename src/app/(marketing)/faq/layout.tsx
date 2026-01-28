import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Find answers to frequently asked questions about our product and services.',
}

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
