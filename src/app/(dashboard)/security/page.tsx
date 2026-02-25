'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

      <div className="space-y-6">
        <Card data-testid="card-change-password">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-lg">Change Password</CardTitle>
                <CardDescription>
                  {isOAuth
                    ? `You signed in with ${authProvider}. Password change may not apply.`
                    : 'Update your account password'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

        <Card data-testid="card-two-factor">
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle className="text-lg">Two-Factor Authentication</CardTitle>
                  <CardDescription>Add an extra layer of security to your account</CardDescription>
                </div>
              </div>
              <Badge variant="secondary" data-testid="badge-2fa-status">Coming Soon</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Two-factor authentication adds an additional layer of security by requiring a verification code
              from your phone when signing in. This feature will be available soon.
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-login-activity">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-lg">Login Activity</CardTitle>
                <CardDescription>Recent account access information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4 py-2 border-b flex-wrap">
              <div>
                <p className="text-sm font-medium">Last Sign In</p>
                <p className="text-sm text-muted-foreground" data-testid="text-last-login">{lastSignIn}</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 py-2 border-b flex-wrap">
              <div>
                <p className="text-sm font-medium">Sign In Method</p>
                <p className="text-sm text-muted-foreground" data-testid="text-auth-provider">
                  {authProvider.charAt(0).toUpperCase() + authProvider.slice(1)}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 py-2 flex-wrap">
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
