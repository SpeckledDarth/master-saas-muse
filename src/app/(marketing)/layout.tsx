'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

function ScrollToTopOnNavigate() {
  const pathname = usePathname()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <ScrollToTopOnNavigate />
      {children}
    </>
  )
}
