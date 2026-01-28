'use client'

import { useState } from 'react'
import { useSettings } from '@/hooks/use-settings'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { PageHero } from '@/components/page-hero'

export default function FAQPage() {
  const { settings, loading } = useSettings()
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" data-testid="loader-faq" />
      </div>
    )
  }

  const content = settings?.content
  const faqPageSettings = settings?.pages?.faq
  const faqItems = content?.faqItems || []

  function toggleItem(id: string) {
    setOpenItems(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="flex flex-col">
      <PageHero
        headline={faqPageSettings?.headline || content?.faqHeadline || 'Frequently Asked Questions'}
        subheadline={faqPageSettings?.subheadline || 'Find answers to common questions about our product'}
        imageUrl={faqPageSettings?.heroImageUrl}
        positionX={faqPageSettings?.heroImagePositionX ?? 50}
        positionY={faqPageSettings?.heroImagePositionY ?? 50}
        testId="faq"
      />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-4">
        {faqItems.length > 0 ? (
          faqItems.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <button
                onClick={() => toggleItem(item.id)}
                className="w-full text-left p-6 flex items-center justify-between gap-4 hover-elevate"
                data-testid={`button-faq-${item.id}`}
              >
                <div className="flex items-start gap-3">
                  <HelpCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <span className="font-medium" data-testid={`text-faq-question-${item.id}`}>
                    {item.question}
                  </span>
                </div>
                {openItems.has(item.id) ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                )}
              </button>
              {openItems.has(item.id) && (
                <CardContent className="pt-0 pb-6 px-6">
                  <div className="pl-8 text-muted-foreground whitespace-pre-wrap" data-testid={`text-faq-answer-${item.id}`}>
                    {item.answer}
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground" data-testid="text-no-faq">
                No FAQ items have been added yet.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="text-center mt-12">
        <p className="text-muted-foreground mb-4" data-testid="text-more-questions">
          Still have questions?
        </p>
        <Link href="/contact" data-testid="link-contact">
          <Button data-testid="button-contact-us">
            Contact Us
          </Button>
        </Link>
      </div>
      </div>
    </div>
  )
}
