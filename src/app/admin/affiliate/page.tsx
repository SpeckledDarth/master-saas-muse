'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function AdminAffiliateRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/admin/setup/affiliate')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-[50vh]" data-testid="redirect-admin-affiliate">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
}
