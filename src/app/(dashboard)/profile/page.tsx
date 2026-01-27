'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { User, Mail, Lock, CreditCard, Loader2, Crown, Users, Sparkles, LogOut } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface SubscriptionInfo {
  status: 'free' | 'active' | 'canceled' | 'past_due' | 'trialing'
  tier: 'free' | 'pro' | 'team'
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}

const tierConfig = {
  free: { name: 'Free', icon: Sparkles, color: 'bg-gray-100 dark:bg-gray-800' },
  pro: { name: 'Pro', icon: Crown, color: 'bg-blue-100 dark:bg-blue-900' },
  team: { name: 'Team', icon: Users, color: 'bg-purple-100 dark:bg-purple-900' },
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = useMemo(() => {
    if (typeof window === 'undefined') return null
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null
    return createClient()
  }, [])

  useEffect(() => {
    let mounted = true

    async function loadData() {
      if (!supabase) {
        setIsLoading(false)
        return
      }
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (!mounted) return
      
      if (!currentUser) {
        router.push('/login?redirect=/profile')
        return
      }
      
      setUser(currentUser)

      try {
        const response = await fetch('/api/stripe/subscription')
        if (response.ok && mounted) {
          const data = await response.json()
          setSubscription(data)
        }
      } catch (error) {
        console.error('Failed to fetch subscription:', error)
      }

      if (mounted) {
        setIsLoading(false)
      }
    }

    loadData()

    return () => {
      mounted = false
    }
  }, [router, supabase])

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure both passwords are the same.',
        variant: 'destructive',
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters.',
        variant: 'destructive',
      })
      return
    }

    setIsUpdatingPassword(true)
    
    if (!supabase) return
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    
    if (error) {
      toast({
        title: 'Failed to update password',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Password updated',
        description: 'Your password has been changed successfully.',
      })
      setNewPassword('')
      setConfirmPassword('')
    }
    
    setIsUpdatingPassword(false)
  }

  const handleSignOut = async () => {
    if (!supabase) return
    setIsSigningOut(true)
    await supabase.auth.signOut()
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" data-testid="loader-profile" />
        </div>
      </div>
    )
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() || 'U'
  const tierInfo = subscription ? tierConfig[subscription.tier] : tierConfig.free
  const TierIcon = tierInfo.icon

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8" data-testid="text-profile-title">Profile</h1>

      <div className="space-y-6">
        <Card data-testid="card-profile-info">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle>Profile Information</CardTitle>
            </div>
            <CardDescription>Your account details and avatar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email} />
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium" data-testid="text-user-name">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                </p>
                <p className="text-sm text-muted-foreground" data-testid="text-user-email">
                  {user?.email}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm">Email</Label>
              </div>
              <Input 
                value={user?.email || ''} 
                disabled 
                className="mt-2"
                data-testid="input-email"
              />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-subscription">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <CardTitle>Subscription</CardTitle>
            </div>
            <CardDescription>Your current plan and billing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${tierInfo.color}`}>
                  <TierIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium" data-testid="text-plan-name">{tierInfo.name} Plan</p>
                  {subscription?.status && subscription.status !== 'free' && (
                    <Badge variant="outline" className="mt-1" data-testid="badge-status">
                      {subscription.status === 'active' ? 'Active' : 
                       subscription.status === 'trialing' ? 'Trial' :
                       subscription.status === 'canceled' ? 'Canceled' : 'Past Due'}
                    </Badge>
                  )}
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={() => router.push('/billing')}
                data-testid="button-manage-subscription"
              >
                Manage Subscription
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-password">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              <CardTitle>Change Password</CardTitle>
            </div>
            <CardDescription>Update your password to keep your account secure</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div>
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password (min 6 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  data-testid="input-new-password"
                />
              </div>
              <div>
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
                type="submit" 
                disabled={isUpdatingPassword || !newPassword}
                data-testid="button-update-password"
              >
                {isUpdatingPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card data-testid="card-signout">
          <CardContent className="py-6">
            <Button 
              variant="destructive" 
              onClick={handleSignOut}
              disabled={isSigningOut}
              data-testid="button-sign-out"
            >
              {isSigningOut ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4 mr-2" />
              )}
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
