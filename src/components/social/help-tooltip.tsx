'use client'

import { Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface HelpTooltipProps {
  text: string
  side?: 'top' | 'right' | 'bottom' | 'left'
  className?: string
}

export function HelpTooltip({ text, side = 'top', className = '' }: HelpTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center justify-center rounded-full text-muted-foreground/60 hover:text-muted-foreground transition-colors focus:outline-none ${className}`}
          data-testid="button-help-tooltip"
          aria-label="Help"
        >
          <Info className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-[280px] text-sm leading-relaxed">
        {text}
      </TooltipContent>
    </Tooltip>
  )
}
