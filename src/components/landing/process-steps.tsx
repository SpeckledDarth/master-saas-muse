'use client'

import { useSettings } from '@/hooks/use-settings'
import { CheckCircle2 } from 'lucide-react'

interface ProcessStep {
  id: string
  number: number
  title: string
  description: string
}

export function ProcessSteps() {
  const { settings } = useSettings()
  const steps = settings?.content?.processSteps || []
  const headline = settings?.content?.processHeadline || 'How it works'
  const subheadline = settings?.content?.processSubheadline

  if (steps.length === 0) {
    return null
  }

  return (
    <section className="py-20" data-testid="section-process">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4">{headline}</h2>
        {subheadline && (
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            {subheadline}
          </p>
        )}
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border hidden md:block" />
            <div className="space-y-8 md:space-y-12">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className="relative flex items-start gap-6"
                  data-testid={`process-step-${step.id}`}
                >
                  <div className="flex-shrink-0 relative z-10">
                    <div className="w-16 h-16 rounded-full bg-primary-600 text-white dark:bg-primary-400 dark:text-black flex items-center justify-center text-xl font-bold shadow-lg">
                      {step.number || index + 1}
                    </div>
                  </div>
                  <div className="pt-3 flex-1">
                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
