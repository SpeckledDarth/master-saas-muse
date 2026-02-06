'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SiteSettings, defaultSettings } from '@/types/settings'
import type { FeatureCard, Testimonial, FAQItem, CTAContent, TeamMember, NavItem, AISettings, WebhookSettings } from '@/types/settings'

interface UseSetupSettingsReturn {
  loading: boolean
  saving: boolean
  saved: boolean
  settings: SiteSettings
  setSettings: React.Dispatch<React.SetStateAction<SiteSettings>>
  handleSave: () => Promise<void>
  aiProviders: { id: string; name: string; envKey: string; models: { id: string; name: string }[] }[]

  updateBranding: <K extends keyof SiteSettings['branding']>(key: K, value: SiteSettings['branding'][K]) => void
  updateSocial: <K extends keyof SiteSettings['social']>(key: K, value: SiteSettings['social'][K]) => void
  updateFeatures: <K extends keyof SiteSettings['features']>(key: K, value: SiteSettings['features'][K]) => void
  updateAI: <K extends keyof AISettings>(key: K, value: AISettings[K]) => void
  updateWebhooks: <K extends keyof WebhookSettings>(key: K, value: WebhookSettings[K]) => void
  updateWebhookEvent: <K extends keyof WebhookSettings['events']>(key: K, value: boolean) => void
  updatePricing: <K extends keyof SiteSettings['pricing']>(key: K, value: SiteSettings['pricing'][K]) => void
  updateContent: <K extends keyof SiteSettings['content']>(key: K, value: SiteSettings['content'][K]) => void
  updateCTA: <K extends keyof CTAContent>(key: K, value: CTAContent[K]) => void
  updateAbout: <K extends keyof SiteSettings['pages']['about']>(key: K, value: SiteSettings['pages']['about'][K]) => void
  updateContact: <K extends keyof SiteSettings['pages']['contact']>(key: K, value: SiteSettings['pages']['contact'][K]) => void
  updateLegal: <K extends keyof SiteSettings['pages']['legal']>(key: K, value: SiteSettings['pages']['legal'][K]) => void
  updatePricingPage: <K extends keyof SiteSettings['pages']['pricing']>(key: K, value: SiteSettings['pages']['pricing'][K]) => void
  updateFAQPage: <K extends keyof SiteSettings['pages']['faq']>(key: K, value: SiteSettings['pages']['faq'][K]) => void
  updateCustomPage: (pageId: string, field: string, value: any) => void
  updatePlan: (planId: string, field: string, value: string | number | boolean | string[]) => void
  updateNavigation: (items: NavItem[]) => void

  addNavItem: () => void
  updateNavItem: (id: string, field: keyof NavItem, value: string | boolean | null) => void
  removeNavItem: (id: string) => void

  addFeatureCard: () => void
  updateFeatureCard: (id: string, field: keyof FeatureCard, value: string) => void
  removeFeatureCard: (id: string) => void

  addTestimonial: () => void
  updateTestimonial: (id: string, field: keyof Testimonial, value: string) => void
  removeTestimonial: (id: string) => void

  addFAQItem: () => void
  updateFAQItem: (id: string, field: keyof FAQItem, value: string) => void
  removeFAQItem: (id: string) => void

  addTeamMember: () => void
  updateTeamMember: (id: string, field: keyof TeamMember, value: string | null) => void
  removeTeamMember: (id: string) => void

  webhookTesting: boolean
  webhookTestResult: { success: boolean; status?: number; error?: string } | null
  testWebhook: () => Promise<void>
}

export function useSetupSettings(): UseSetupSettingsReturn {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings)
  const [aiProviders, setAiProviders] = useState<{ id: string; name: string; envKey: string; models: { id: string; name: string }[] }[]>([])
  const [webhookTesting, setWebhookTesting] = useState(false)
  const [webhookTestResult, setWebhookTestResult] = useState<{ success: boolean; status?: number; error?: string } | null>(null)

  useEffect(() => {
    async function loadSettings() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUserId(user.id)

      const response = await fetch('/api/admin/setup', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      }

      setLoading(false)
    }

    loadSettings()

    fetch('/api/ai/providers')
      .then(res => res.json())
      .then(data => setAiProviders(data.providers || []))
      .catch(() => {})
  }, [router])

  const handleSave = useCallback(async () => {
    if (!userId) return

    setSaving(true)
    setSaved(false)

    const response = await fetch('/api/admin/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ settings }),
    })

    if (response.ok) {
      setSaved(true)
      setTimeout(() => {
        setSaved(false)
        window.location.reload()
      }, 1000)
    }

    setSaving(false)
  }, [userId, settings])

  function updateBranding<K extends keyof SiteSettings['branding']>(key: K, value: SiteSettings['branding'][K]) {
    setSettings(prev => ({ ...prev, branding: { ...prev.branding, [key]: value } }))
  }

  function updateSocial<K extends keyof SiteSettings['social']>(key: K, value: SiteSettings['social'][K]) {
    setSettings(prev => ({ ...prev, social: { ...prev.social, [key]: value } }))
  }

  function updateFeatures<K extends keyof SiteSettings['features']>(key: K, value: SiteSettings['features'][K]) {
    setSettings(prev => ({ ...prev, features: { ...prev.features, [key]: value } }))
  }

  function updateAI<K extends keyof AISettings>(key: K, value: AISettings[K]) {
    setSettings(prev => ({ ...prev, ai: { ...(prev.ai || defaultSettings.ai!), [key]: value } }))
  }

  function updateWebhooks<K extends keyof WebhookSettings>(key: K, value: WebhookSettings[K]) {
    setSettings(prev => ({ ...prev, webhooks: { ...(prev.webhooks || defaultSettings.webhooks!), [key]: value } }))
  }

  function updateWebhookEvent<K extends keyof WebhookSettings['events']>(key: K, value: boolean) {
    setSettings(prev => ({
      ...prev,
      webhooks: {
        ...(prev.webhooks || defaultSettings.webhooks!),
        events: { ...(prev.webhooks?.events || defaultSettings.webhooks!.events), [key]: value },
      }
    }))
  }

  async function testWebhook() {
    setWebhookTesting(true)
    setWebhookTestResult(null)
    try {
      const res = await fetch('/api/admin/webhooks/test', { method: 'POST' })
      const data = await res.json()
      setWebhookTestResult(data)
    } catch (err) {
      setWebhookTestResult({ success: false, error: (err as Error).message })
    } finally {
      setWebhookTesting(false)
    }
  }

  function updatePricing<K extends keyof SiteSettings['pricing']>(key: K, value: SiteSettings['pricing'][K]) {
    setSettings(prev => ({ ...prev, pricing: { ...prev.pricing, [key]: value } }))
  }

  function updateNavigation(items: NavItem[]) {
    setSettings(prev => ({ ...prev, navigation: { ...prev.navigation, items } }))
  }

  function addNavItem() {
    const newItem: NavItem = { id: `nav-${Date.now()}`, label: 'New Link', href: '/', enabled: true }
    const currentItems = settings.navigation?.items ?? []
    updateNavigation([...currentItems, newItem])
  }

  function updateNavItem(id: string, field: keyof NavItem, value: string | boolean | null) {
    const currentItems = settings.navigation?.items ?? []
    updateNavigation(currentItems.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  function removeNavItem(id: string) {
    const currentItems = settings.navigation?.items ?? []
    updateNavigation(currentItems.filter(item => item.id !== id))
  }

  function updateContent<K extends keyof SiteSettings['content']>(key: K, value: SiteSettings['content'][K]) {
    setSettings(prev => ({ ...prev, content: { ...defaultSettings.content, ...prev.content, [key]: value } }))
  }

  function addFeatureCard() {
    const newCard: FeatureCard = { id: Date.now().toString(), icon: 'Zap', title: 'New Feature', description: 'Description of this feature' }
    setSettings(prev => ({ ...prev, content: { ...defaultSettings.content, ...prev.content, featureCards: [...(prev.content?.featureCards ?? []), newCard] } }))
  }

  function updateFeatureCard(id: string, field: keyof FeatureCard, value: string) {
    setSettings(prev => ({ ...prev, content: { ...defaultSettings.content, ...prev.content, featureCards: (prev.content?.featureCards ?? []).map(card => card.id === id ? { ...card, [field]: value } : card) } }))
  }

  function removeFeatureCard(id: string) {
    setSettings(prev => ({ ...prev, content: { ...defaultSettings.content, ...prev.content, featureCards: (prev.content?.featureCards ?? []).filter(card => card.id !== id) } }))
  }

  function addTestimonial() {
    const newTestimonial: Testimonial = { id: Date.now().toString(), name: 'Customer Name', role: 'Job Title', company: 'Company', quote: 'Their testimonial quote goes here.' }
    setSettings(prev => ({ ...prev, content: { ...defaultSettings.content, ...prev.content, testimonials: [...(prev.content?.testimonials ?? []), newTestimonial] } }))
  }

  function updateTestimonial(id: string, field: keyof Testimonial, value: string) {
    setSettings(prev => ({ ...prev, content: { ...defaultSettings.content, ...prev.content, testimonials: (prev.content?.testimonials ?? []).map(t => t.id === id ? { ...t, [field]: value } : t) } }))
  }

  function removeTestimonial(id: string) {
    setSettings(prev => ({ ...prev, content: { ...defaultSettings.content, ...prev.content, testimonials: (prev.content?.testimonials ?? []).filter(t => t.id !== id) } }))
  }

  function addFAQItem() {
    const newFAQ: FAQItem = { id: Date.now().toString(), question: 'New question?', answer: 'Answer to the question.' }
    setSettings(prev => ({ ...prev, content: { ...defaultSettings.content, ...prev.content, faqItems: [...(prev.content?.faqItems ?? []), newFAQ] } }))
  }

  function updateFAQItem(id: string, field: keyof FAQItem, value: string) {
    setSettings(prev => ({ ...prev, content: { ...defaultSettings.content, ...prev.content, faqItems: (prev.content?.faqItems ?? []).map(item => item.id === id ? { ...item, [field]: value } : item) } }))
  }

  function removeFAQItem(id: string) {
    setSettings(prev => ({ ...prev, content: { ...defaultSettings.content, ...prev.content, faqItems: (prev.content?.faqItems ?? []).filter(item => item.id !== id) } }))
  }

  function updateCTA<K extends keyof CTAContent>(key: K, value: CTAContent[K]) {
    setSettings(prev => ({ ...prev, content: { ...defaultSettings.content, ...prev.content, cta: { ...defaultSettings.content.cta, ...prev.content?.cta, [key]: value } } }))
  }

  function updateAbout<K extends keyof SiteSettings['pages']['about']>(key: K, value: SiteSettings['pages']['about'][K]) {
    setSettings(prev => ({ ...prev, pages: { ...defaultSettings.pages, ...prev.pages, about: { ...defaultSettings.pages.about, ...prev.pages?.about, [key]: value } } }))
  }

  function updateContact<K extends keyof SiteSettings['pages']['contact']>(key: K, value: SiteSettings['pages']['contact'][K]) {
    setSettings(prev => ({ ...prev, pages: { ...defaultSettings.pages, ...prev.pages, contact: { ...defaultSettings.pages.contact, ...prev.pages?.contact, [key]: value } } }))
  }

  function updateLegal<K extends keyof SiteSettings['pages']['legal']>(key: K, value: SiteSettings['pages']['legal'][K]) {
    setSettings(prev => ({ ...prev, pages: { ...defaultSettings.pages, ...prev.pages, legal: { ...defaultSettings.pages.legal, ...prev.pages?.legal, [key]: value } } }))
  }

  function updatePricingPage<K extends keyof SiteSettings['pages']['pricing']>(key: K, value: SiteSettings['pages']['pricing'][K]) {
    setSettings(prev => ({ ...prev, pages: { ...defaultSettings.pages, ...prev.pages, pricing: { ...defaultSettings.pages.pricing, ...prev.pages?.pricing, [key]: value } } }))
  }

  function updateFAQPage<K extends keyof SiteSettings['pages']['faq']>(key: K, value: SiteSettings['pages']['faq'][K]) {
    setSettings(prev => ({ ...prev, pages: { ...defaultSettings.pages, ...prev.pages, faq: { ...defaultSettings.pages.faq, ...prev.pages?.faq, [key]: value } } }))
  }

  function updateCustomPage(pageId: string, field: string, value: any) {
    setSettings(prev => ({
      ...prev,
      pages: {
        ...defaultSettings.pages,
        ...prev.pages,
        customPages: (prev.pages?.customPages ?? defaultSettings.pages.customPages).map(page =>
          page.id === pageId ? { ...page, [field]: value } : page
        ),
      }
    }))
  }

  function updatePlan(planId: string, field: string, value: string | number | boolean | string[]) {
    setSettings(prev => ({ ...prev, pricing: { ...prev.pricing, plans: prev.pricing.plans.map(plan => plan.id === planId ? { ...plan, [field]: value } : plan) } }))
  }

  function addTeamMember() {
    const newMember: TeamMember = { id: Date.now().toString(), name: 'Team Member', role: 'Role', bio: 'Short bio about this team member.', imageUrl: null }
    setSettings(prev => ({ ...prev, pages: { ...defaultSettings.pages, ...prev.pages, about: { ...defaultSettings.pages.about, ...prev.pages?.about, team: [...(prev.pages?.about?.team ?? []), newMember] } } }))
  }

  function updateTeamMember(id: string, field: keyof TeamMember, value: string | null) {
    setSettings(prev => ({ ...prev, pages: { ...defaultSettings.pages, ...prev.pages, about: { ...defaultSettings.pages.about, ...prev.pages?.about, team: (prev.pages?.about?.team ?? []).map(member => member.id === id ? { ...member, [field]: value } : member) } } }))
  }

  function removeTeamMember(id: string) {
    setSettings(prev => ({ ...prev, pages: { ...defaultSettings.pages, ...prev.pages, about: { ...defaultSettings.pages.about, ...prev.pages?.about, team: (prev.pages?.about?.team ?? []).filter(member => member.id !== id) } } }))
  }

  return {
    loading, saving, saved, settings, setSettings, handleSave, aiProviders,
    updateBranding, updateSocial, updateFeatures, updateAI, updateWebhooks, updateWebhookEvent,
    updatePricing, updateContent, updateCTA, updateAbout, updateContact, updateLegal,
    updatePricingPage, updateFAQPage, updateCustomPage, updatePlan, updateNavigation,
    addNavItem, updateNavItem, removeNavItem,
    addFeatureCard, updateFeatureCard, removeFeatureCard,
    addTestimonial, updateTestimonial, removeTestimonial,
    addFAQItem, updateFAQItem, removeFAQItem,
    addTeamMember, updateTeamMember, removeTeamMember,
    webhookTesting, webhookTestResult, testWebhook,
  }
}
