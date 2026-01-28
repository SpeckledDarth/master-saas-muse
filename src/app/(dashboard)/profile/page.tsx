'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { User, Mail, Lock, CreditCard, Loader2, Crown, Users, Sparkles, LogOut, Camera, MapPin, Phone, Building } from 'lucide-react'
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

            <form onSubmit={handleProfileUpdate} className="pt-4 border-t space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
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
                  <div className="grid grid-cols-2 gap-3">
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
                  <div className="grid grid-cols-2 gap-3">
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
          </CardContent>
        </Card>

        <Card data-testid="card-email">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <CardTitle>Email Address</CardTitle>
            </div>
            <CardDescription>Change your email address</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailUpdate} className="space-y-4">
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
