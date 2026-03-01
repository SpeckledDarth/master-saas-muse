'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DSCard, DSCardContent, DSCardDescription, DSCardHeader, DSCardTitle } from '@/components/ui/ds-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { User, Mail, Lock, CreditCard, Loader2, Crown, Users, Sparkles, LogOut, Camera, MapPin, Phone, Building, Link2, Unlink, Bell, Save } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { SiGoogle, SiGithub, SiApple, SiX } from 'react-icons/si'
import { useToast } from '@/hooks/use-toast'

interface SubscriptionInfo {
  status: 'free' | 'active' | 'canceled' | 'past_due' | 'trialing'
  tier: 'free' | 'pro' | 'team'
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}

const tierConfig = {
  free: { name: 'Free', icon: Sparkles, color: 'bg-muted' },
  pro: { name: 'Pro', icon: Crown, color: 'bg-[hsl(var(--info)/0.1)]' },
  team: { name: 'Team', icon: Users, color: 'bg-accent-100 dark:bg-accent-900' },
}

const oauthProviders = [
  { id: 'google', name: 'Google', icon: SiGoogle },
  { id: 'github', name: 'GitHub', icon: SiGithub },
  { id: 'apple', name: 'Apple', icon: SiApple },
  { id: 'twitter', name: 'X', icon: SiX },
] as const

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [company, setCompany] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [country, setCountry] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [linkingProvider, setLinkingProvider] = useState<string | null>(null)
  const [unlinkingProvider, setUnlinkingProvider] = useState<string | null>(null)
  const [emailPrefs, setEmailPrefs] = useState({
    marketing_emails: true,
    product_updates: true,
    billing_alerts: true,
    security_alerts: true,
    weekly_digest: false,
    monthly_report: true,
    affiliate_updates: true,
    support_responses: true,
  })
  const [emailPrefsLoading, setEmailPrefsLoading] = useState(true)
  const [savingEmailPrefs, setSavingEmailPrefs] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
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
      setDisplayName(currentUser.user_metadata?.full_name || '')
      setEmail(currentUser.email || '')
      setPhone(currentUser.user_metadata?.phone || '')
      setCompany(currentUser.user_metadata?.company || '')
      setAddress(currentUser.user_metadata?.address || '')
      setCity(currentUser.user_metadata?.city || '')
      setState(currentUser.user_metadata?.state || '')
      setZipCode(currentUser.user_metadata?.zip_code || '')
      setCountry(currentUser.user_metadata?.country || '')
      setAvatarUrl(currentUser.user_metadata?.avatar_url || '')

      try {
        const response = await fetch('/api/stripe/subscription')
        if (response.ok && mounted) {
          const data = await response.json()
          setSubscription(data)
        }
      } catch (error) {
        console.error('Failed to fetch subscription:', error)
      }

      try {
        const prefsRes = await fetch('/api/user/email-preferences')
        if (prefsRes.ok && mounted) {
          const prefsData = await prefsRes.json()
          if (prefsData.preferences) setEmailPrefs(prefsData.preferences)
        }
      } catch {
      } finally {
        if (mounted) setEmailPrefsLoading(false)
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

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!supabase) return
    
    setIsUpdatingProfile(true)
    
    const { error } = await supabase.auth.updateUser({
      data: { 
        full_name: displayName.trim(),
        phone: phone.trim(),
        company: company.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        zip_code: zipCode.trim(),
        country: country.trim(),
      }
    })
    
    if (error) {
      toast({
        title: 'Failed to update profile',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated.',
      })
      setUser((prev: any) => ({
        ...prev,
        user_metadata: {
          ...prev?.user_metadata,
          full_name: displayName.trim(),
          phone: phone.trim(),
          company: company.trim(),
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          zip_code: zipCode.trim(),
          country: country.trim(),
        }
      }))
    }
    
    setIsUpdatingProfile(false)
  }

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!supabase || !email.trim() || email === user?.email) return
    
    setIsUpdatingEmail(true)
    
    const { error } = await supabase.auth.updateUser({
      email: email.trim()
    })
    
    if (error) {
      toast({
        title: 'Failed to update email',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Confirmation email sent',
        description: 'Please check your new email address to confirm the change.',
      })
    }
    
    setIsUpdatingEmail(false)
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !supabase) return

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file.',
        variant: 'destructive',
      })
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 2MB.',
        variant: 'destructive',
      })
      return
    }

    setIsUploadingAvatar(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        if (uploadError.message?.includes('bucket') || uploadError.message?.includes('not found')) {
          throw new Error('Avatar storage is not configured. Please contact your administrator to set up the avatars storage bucket in Supabase.')
        }
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      })

      if (updateError) {
        throw updateError
      }

      setAvatarUrl(publicUrl)
      setUser((prev: any) => ({
        ...prev,
        user_metadata: {
          ...prev?.user_metadata,
          avatar_url: publicUrl
        }
      }))

      toast({
        title: 'Avatar updated',
        description: 'Your profile picture has been updated.',
      })
    } catch (error: any) {
      toast({
        title: 'Failed to upload avatar',
        description: error.message || 'An error occurred while uploading.',
        variant: 'destructive',
      })
    }

    setIsUploadingAvatar(false)
  }

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

  const handleSaveEmailPrefs = async () => {
    setSavingEmailPrefs(true)
    try {
      const res = await fetch('/api/user/email-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPrefs),
      })
      if (res.ok) {
        toast({ title: 'Email preferences saved', description: 'Your notification settings have been updated.' })
      } else {
        toast({ title: 'Error', description: 'Failed to save preferences', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to save preferences', variant: 'destructive' })
    } finally {
      setSavingEmailPrefs(false)
    }
  }

  const getConnectedProviders = useCallback(() => {
    if (!user?.identities || !Array.isArray(user.identities)) return []
    return user.identities.map((identity: any) => identity.provider)
  }, [user])

  const hasIdentitiesData = useCallback(() => {
    // Check if we have reliable identity data to make unlink decisions
    return user?.identities && Array.isArray(user.identities) && user.identities.length > 0
  }, [user])

  const hasPasswordAuth = useCallback(() => {
    // In Supabase, email/password users have an identity with provider === 'email'
    if (!user?.identities || !Array.isArray(user.identities)) return false
    return user.identities.some((identity: any) => identity.provider === 'email')
  }, [user])

  const canUnlinkProvider = useCallback((provider: string) => {
    // If we don't have identity data, be conservative and don't allow unlink
    if (!hasIdentitiesData()) return false
    
    const connectedProviders = getConnectedProviders()
    const hasPassword = hasPasswordAuth()
    
    // Count all available auth methods from identities
    // All providers in identities count as valid auth methods
    const totalMethods = connectedProviders.length
    
    // Can only unlink if there will be at least 1 method remaining
    // Note: email identity also counts as a method, so this works for both
    // OAuth-only users and email+OAuth users
    return totalMethods > 1
  }, [getConnectedProviders, hasPasswordAuth, hasIdentitiesData])

  const handleLinkProvider = async (provider: 'google' | 'github' | 'apple' | 'twitter') => {
    if (!supabase) return
    setLinkingProvider(provider)
    
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/profile`,
        },
      })
      
      if (error) {
        toast({
          title: 'Failed to link account',
          description: error.message,
          variant: 'destructive',
        })
        setLinkingProvider(null)
      }
      // Note: On success, the user is redirected to the OAuth provider,
      // so we don't need to reset linkingProvider here
    } catch (err: any) {
      toast({
        title: 'Failed to link account',
        description: err?.message || 'An unexpected error occurred',
        variant: 'destructive',
      })
      setLinkingProvider(null)
    }
  }

  const handleUnlinkProvider = async (provider: string) => {
    if (!supabase || !user?.identities) return
    
    // Double-check safety before attempting unlink
    if (!canUnlinkProvider(provider)) {
      toast({
        title: 'Cannot unlink',
        description: 'You need at least one sign-in method. Add another provider or set a password first.',
        variant: 'destructive',
      })
      return
    }
    
    const identity = user.identities.find((id: any) => id.provider === provider)
    if (!identity) {
      toast({
        title: 'Provider not found',
        description: 'This provider is not linked to your account.',
        variant: 'destructive',
      })
      return
    }
    
    setUnlinkingProvider(provider)
    
    try {
      const { error } = await supabase.auth.unlinkIdentity(identity)
      
      if (error) {
        toast({
          title: 'Failed to unlink account',
          description: error.message,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Account unlinked',
          description: `${provider.charAt(0).toUpperCase() + provider.slice(1)} has been disconnected from your account.`,
        })
        setUser((prev: any) => ({
          ...prev,
          identities: prev.identities.filter((id: any) => id.provider !== provider)
        }))
      }
    } catch (err: any) {
      toast({
        title: 'Failed to unlink account',
        description: err?.message || 'An unexpected error occurred',
        variant: 'destructive',
      })
    }
    
    setUnlinkingProvider(null)
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

      <div className="space-y-[var(--content-density-gap,1rem)]">
        <DSCard data-testid="card-profile-info">
          <DSCardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <DSCardTitle>Profile Information</DSCardTitle>
            </div>
            <DSCardDescription>Your account details and avatar</DSCardDescription>
          </DSCardHeader>
          <DSCardContent className="space-y-[var(--content-density-gap,1rem)]">
            <div className="flex items-center gap-[var(--content-density-gap,1rem)]">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarUrl || user?.user_metadata?.avatar_url} alt={user?.email} />
                  <AvatarFallback className="text-xl">{initials}</AvatarFallback>
                </Avatar>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  onChange={handleAvatarUpload}
                  className="hidden"
                  data-testid="input-avatar"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="absolute -bottom-1 -right-1 rounded-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  data-testid="button-upload-avatar"
                >
                  {isUploadingAvatar ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div>
                <p className="font-medium" data-testid="text-user-name">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                </p>
                <p className="text-sm text-muted-foreground" data-testid="text-user-email">
                  {user?.email}
                </p>
              </div>
            </div>

            <form onSubmit={handleProfileUpdate} className="pt-4 border-t space-y-[var(--content-density-gap,1rem)]">
              <div className="grid md:grid-cols-2 gap-[var(--content-density-gap,1rem)]">
                <div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="displayName" className="text-sm">Display Name</Label>
                  </div>
                  <Input 
                    id="displayName"
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your display name"
                    className="mt-2"
                    data-testid="input-display-name"
                  />
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="phone" className="text-sm">Phone Number</Label>
                  </div>
                  <Input 
                    id="phone"
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="mt-2"
                    data-testid="input-phone"
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="company" className="text-sm">Company</Label>
                </div>
                <Input 
                  id="company"
                  value={company} 
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Your company name"
                  className="mt-2"
                  data-testid="input-company"
                />
              </div>
              
              <div className="pt-2">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm">Address</Label>
                </div>
                <div className="space-y-3">
                  <Input 
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street address"
                    data-testid="input-address"
                  />
                  <div className="grid grid-cols-2 gap-[var(--content-density-gap,1rem)]">
                    <Input 
                      value={city} 
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                      data-testid="input-city"
                    />
                    <Input 
                      value={state} 
                      onChange={(e) => setState(e.target.value)}
                      placeholder="State/Province"
                      data-testid="input-state"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-[var(--content-density-gap,1rem)]">
                    <Input 
                      value={zipCode} 
                      onChange={(e) => setZipCode(e.target.value)}
                      placeholder="ZIP/Postal code"
                      data-testid="input-zip"
                    />
                    <Input 
                      value={country} 
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Country"
                      data-testid="input-country"
                    />
                  </div>
                </div>
              </div>
              
              <Button 
                type="submit" 
                disabled={isUpdatingProfile}
                data-testid="button-update-profile"
              >
                {isUpdatingProfile && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Profile
              </Button>
            </form>
          </DSCardContent>
        </DSCard>

        <DSCard data-testid="card-email">
          <DSCardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <DSCardTitle>Email Address</DSCardTitle>
            </div>
            <DSCardDescription>Change your email address</DSCardDescription>
          </DSCardHeader>
          <DSCardContent>
            <form onSubmit={handleEmailUpdate} className="space-y-[var(--content-density-gap,1rem)]">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="mt-2"
                  data-testid="input-change-email"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  A confirmation email will be sent to verify the new address.
                </p>
              </div>
              <Button 
                type="submit" 
                disabled={isUpdatingEmail || !email.trim() || email === user?.email}
                data-testid="button-update-email"
              >
                {isUpdatingEmail && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Update Email
              </Button>
            </form>
          </DSCardContent>
        </DSCard>

        <DSCard data-testid="card-connected-accounts">
          <DSCardHeader>
            <div className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              <DSCardTitle>Connected Accounts</DSCardTitle>
            </div>
            <DSCardDescription>Manage your sign-in methods and linked accounts</DSCardDescription>
          </DSCardHeader>
          <DSCardContent className="space-y-3">
            {hasPasswordAuth() && (
              <div className="flex items-center justify-between p-3 rounded-[var(--card-radius,0.75rem)] border" data-testid="provider-email">
                <div className="flex items-center gap-[var(--content-density-gap,1rem)]">
                  <div className="p-2 rounded-[var(--card-radius,0.75rem)] bg-muted">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Email & Password</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                <Badge variant="secondary" data-testid="badge-email-connected">Connected</Badge>
              </div>
            )}
            
            {oauthProviders.map((provider) => {
              const isConnected = getConnectedProviders().includes(provider.id)
              const ProviderIcon = provider.icon
              const isLinking = linkingProvider === provider.id
              const isUnlinking = unlinkingProvider === provider.id
              const canUnlink = canUnlinkProvider(provider.id)
              
              return (
                <div 
                  key={provider.id}
                  className="flex items-center justify-between p-3 rounded-[var(--card-radius,0.75rem)] border"
                  data-testid={`provider-${provider.id}`}
                >
                  <div className="flex items-center gap-[var(--content-density-gap,1rem)]">
                    <div className="p-2 rounded-[var(--card-radius,0.75rem)] bg-muted">
                      <ProviderIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{provider.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {isConnected ? 'Connected to your account' : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  
                  {isConnected ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnlinkProvider(provider.id)}
                      disabled={isUnlinking || !canUnlink}
                      title={!canUnlink ? 'You need at least one sign-in method' : undefined}
                      data-testid={`button-unlink-${provider.id}`}
                    >
                      {isUnlinking ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Unlink className="h-4 w-4 mr-1" />
                          Unlink
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLinkProvider(provider.id)}
                      disabled={isLinking}
                      data-testid={`button-link-${provider.id}`}
                    >
                      {isLinking ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Link2 className="h-4 w-4 mr-1" />
                          Link
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )
            })}
            
            <p className="text-xs text-muted-foreground pt-2" data-testid="text-connected-accounts-help">
              Linking multiple accounts lets you sign in with any of them.
            </p>
          </DSCardContent>
        </DSCard>

        <DSCard data-testid="card-subscription">
          <DSCardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <DSCardTitle>Subscription</DSCardTitle>
            </div>
            <DSCardDescription>Your current plan and billing</DSCardDescription>
          </DSCardHeader>
          <DSCardContent>
            <div className="flex items-center justify-between gap-[var(--content-density-gap,1rem)] flex-wrap">
              <div className="flex items-center gap-[var(--content-density-gap,1rem)]">
                <div className={`p-2 rounded-[var(--card-radius,0.75rem)] ${tierInfo.color}`}>
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
          </DSCardContent>
        </DSCard>

        <DSCard data-testid="card-email-preferences">
          <DSCardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <DSCardTitle>Email Preferences</DSCardTitle>
            </div>
            <DSCardDescription>Choose which emails you&apos;d like to receive</DSCardDescription>
          </DSCardHeader>
          <DSCardContent className="space-y-[var(--content-density-gap,1rem)]">
            {emailPrefsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {[
                  { key: 'billing_alerts', label: 'Billing Alerts', desc: 'Payment confirmations, upcoming charges, and billing issues' },
                  { key: 'security_alerts', label: 'Security Alerts', desc: 'Login notifications, password changes, and security warnings' },
                  { key: 'product_updates', label: 'Product Updates', desc: 'New features, improvements, and platform changes' },
                  { key: 'marketing_emails', label: 'Marketing Emails', desc: 'Promotions, tips, and special offers' },
                  { key: 'weekly_digest', label: 'Weekly Digest', desc: 'Weekly summary of your activity and stats' },
                  { key: 'monthly_report', label: 'Monthly Report', desc: 'Monthly performance report and insights' },
                  { key: 'affiliate_updates', label: 'Affiliate Updates', desc: 'Commission notifications, tier changes, and program news' },
                  { key: 'support_responses', label: 'Support Responses', desc: 'Replies to your support tickets' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between gap-[var(--content-density-gap,1rem)]">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <Switch
                      checked={emailPrefs[key as keyof typeof emailPrefs]}
                      onCheckedChange={(checked) => setEmailPrefs(prev => ({ ...prev, [key]: checked }))}
                      data-testid={`switch-email-${key}`}
                    />
                  </div>
                ))}
                <Button
                  onClick={handleSaveEmailPrefs}
                  disabled={savingEmailPrefs}
                  className="mt-2"
                  data-testid="button-save-email-prefs"
                >
                  {savingEmailPrefs ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Preferences
                </Button>
              </>
            )}
          </DSCardContent>
        </DSCard>

        <DSCard data-testid="card-password">
          <DSCardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              <DSCardTitle>Change Password</DSCardTitle>
            </div>
            <DSCardDescription>Update your password to keep your account secure</DSCardDescription>
          </DSCardHeader>
          <DSCardContent>
            <form onSubmit={handlePasswordUpdate} className="space-y-[var(--content-density-gap,1rem)]">
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
          </DSCardContent>
        </DSCard>

        <DSCard data-testid="card-signout">
          <DSCardContent className="py-[var(--card-padding,1.25rem)]">
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
          </DSCardContent>
        </DSCard>
      </div>
    </div>
  )
}
