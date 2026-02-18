'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle, XCircle, Mail } from 'lucide-react'

interface InvitationDetails {
  email: string
  role: string
  organizationName: string
  expiresAt: string
  valid: boolean
  error?: string
}

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null)
  const [user, setUser] = useState<any>(null)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkInvitation() {
      try {
        const supabase = createClient()
        
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        setUser(currentUser)
        
        const response = await fetch(`/api/invite/${token}`)
        const data = await response.json()
        
        if (!response.ok) {
          setError(data.error || 'Invalid invitation')
          setInvitation({ valid: false, error: data.error } as InvitationDetails)
          setLoading(false)
          return
        }
        
        setInvitation({ ...data, valid: true })
        
        // Auto-accept if user is logged in and came from auth flow
        const pendingToken = localStorage.getItem('pendingInviteToken')
        if (currentUser && pendingToken === token) {
          localStorage.removeItem('pendingInviteToken')
          // Auto-accept the invitation
          setLoading(false)
          await autoAcceptInvitation()
          return
        }
        
        setLoading(false)
      } catch (err) {
        setError('Failed to verify invitation')
        setLoading(false)
      }
    }
    
    async function autoAcceptInvitation() {
      setAccepting(true)
      try {
        const response = await fetch(`/api/invite/${token}/accept`, {
          method: 'POST',
        })
        
        const data = await response.json()
        
        if (!response.ok) {
          setError(data.error || 'Failed to accept invitation')
        } else {
          setSuccess(true)
          setTimeout(() => {
            router.push('/admin')
          }, 2000)
        }
      } catch (err) {
        setError('Failed to accept invitation')
      } finally {
        setAccepting(false)
      }
    }
    
    checkInvitation()
  }, [token, router])

  const handleAccept = async () => {
    if (!user) {
      localStorage.setItem('pendingInviteToken', token)
      router.push(`/login?redirectTo=/invite/${token}`)
      return
    }

    setAccepting(true)
    try {
      const response = await fetch(`/api/invite/${token}/accept`, {
        method: 'POST',
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        setError(data.error || 'Failed to accept invitation')
      } else {
        setSuccess(true)
        setTimeout(() => {
          router.push('/admin')
        }, 2000)
      }
    } catch (err) {
      setError('Failed to accept invitation')
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Verifying invitation...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <h2 className="mt-4 text-xl font-semibold">Welcome to the team!</h2>
            <p className="mt-2 text-muted-foreground">Redirecting to dashboard...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!invitation?.valid || error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-12">
            <XCircle className="h-12 w-12 text-destructive" />
            <h2 className="mt-4 text-xl font-semibold">Invalid Invitation</h2>
            <p className="mt-2 text-muted-foreground text-center">
              {error || invitation?.error || 'This invitation is invalid or has expired.'}
            </p>
            <Button className="mt-6" onClick={() => router.push('/')}>
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
            <Mail className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <CardTitle>You&apos;re Invited!</CardTitle>
          <CardDescription>
            You&apos;ve been invited to join as a {invitation.role}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{invitation.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Role:</span>
              <span className="font-medium capitalize">{invitation.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expires:</span>
              <span className="font-medium">
                {new Date(invitation.expiresAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {!user && (
            <p className="text-sm text-muted-foreground text-center">
              You&apos;ll need to sign in or create an account to accept this invitation.
            </p>
          )}

          <Button 
            className="w-full" 
            onClick={handleAccept}
            disabled={accepting}
          >
            {accepting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {user ? 'Accept Invitation' : 'Sign In to Accept'}
          </Button>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
