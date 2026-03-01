'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DSCard, DSCardContent, DSCardDescription, DSCardHeader, DSCardTitle } from '@/components/ui/ds-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Shield, Lock, Smartphone, Clock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { User } from '@supabase/supabase-js'

export default function SecurityPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChanging, setIsChanging] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) {
        router.push('/login?redirect=/security')
        return
      }
      setUser(u)
      setIsLoading(false)
    })
  }, [router])

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({ title: 'Error', description: 'Please fill in all password fields', variant: 'destructive' })
      return
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' })
      return
    }
    if (newPassword.length < 8) {
      toast({ title: 'Error', description: 'Password must be at least 8 characters', variant: 'destructive' })
      return
    }

    setIsChanging(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' })
      } else {
        toast({ title: 'Password updated', description: 'Your password has been changed successfully.' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update password', variant: 'destructive' })
    } finally {
      setIsChanging(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" data-testid="loader-security" />
        </div>
      </div>
    )
  }

  const lastSignIn = user?.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Unknown'

  const authProvider = user?.app_metadata?.provider || 'email'
  const isOAuth = authProvider !== 'email'

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold" data-testid="text-security-title">Account Security</h1>
        <p className="text-muted-foreground mt-2">Manage your account security settings</p>
      </div>

      <div className="space-y-[var(--content-density-gap,1rem)]">
        <DSCard data-testid="card-change-password">
          <DSCardHeader>
            <div className="flex items-center gap-[var(--content-density-gap,1rem)]">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <div>
                <DSCardTitle className="text-lg">Change Password</DSCardTitle>
                <DSCardDescription>
                  {isOAuth
                    ? `You signed in with ${authProvider}. Password change may not apply.`
                    : 'Update your account password'}
                </DSCardDescription>
              </div>
            </div>
          </DSCardHeader>
          <DSCardContent className="space-y-[var(--content-density-gap,1rem)]">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                data-testid="input-new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                data-testid="input-confirm-password"
              />
            </div>
            <Button
              onClick={handleChangePassword}
              disabled={isChanging || !newPassword || !confirmPassword}
              data-testid="button-change-password"
            >
              {isChanging ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
              Update Password
            </Button>
          </DSCardContent>
        </DSCard>

        <DSCard data-testid="card-two-factor">
          <DSCardHeader>
            <div className="flex items-center justify-between gap-[var(--content-density-gap,1rem)] flex-wrap">
              <div className="flex items-center gap-[var(--content-density-gap,1rem)]">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <DSCardTitle className="text-lg">Two-Factor Authentication</DSCardTitle>
                  <DSCardDescription>Add an extra layer of security to your account</DSCardDescription>
                </div>
              </div>
              <Badge variant="secondary" data-testid="badge-2fa-status">Coming Soon</Badge>
            </div>
          </DSCardHeader>
          <DSCardContent>
            <p className="text-sm text-muted-foreground">
              Two-factor authentication adds an additional layer of security by requiring a verification code
              from your phone when signing in. This feature will be available soon.
            </p>
          </DSCardContent>
        </DSCard>

        <DSCard data-testid="card-login-activity">
          <DSCardHeader>
            <div className="flex items-center gap-[var(--content-density-gap,1rem)]">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <DSCardTitle className="text-lg">Login Activity</DSCardTitle>
                <DSCardDescription>Recent account access information</DSCardDescription>
              </div>
            </div>
          </DSCardHeader>
          <DSCardContent className="space-y-[var(--content-density-gap,1rem)]">
            <div className="flex items-center justify-between gap-[var(--content-density-gap,1rem)] py-2 border-b flex-wrap">
              <div>
                <p className="text-sm font-medium">Last Sign In</p>
                <p className="text-sm text-muted-foreground" data-testid="text-last-login">{lastSignIn}</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-[var(--content-density-gap,1rem)] py-2 border-b flex-wrap">
              <div>
                <p className="text-sm font-medium">Sign In Method</p>
                <p className="text-sm text-muted-foreground" data-testid="text-auth-provider">
                  {authProvider.charAt(0).toUpperCase() + authProvider.slice(1)}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-[var(--content-density-gap,1rem)] py-2 flex-wrap">
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground" data-testid="text-user-email">{user?.email}</p>
              </div>
              {user?.email_confirmed_at && (
                <Badge variant="secondary" data-testid="badge-email-verified">
                  <Shield className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
          </DSCardContent>
        </DSCard>
      </div>
    </div>
  )
}
