'use client'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Loader2, Save, Check, Zap, Shield, Sparkles, Users, BarChart, Lock, Rocket, Heart, Star, Target, Award, Lightbulb, Info } from 'lucide-react'

export function InfoTooltip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="h-4 w-4 text-muted-foreground cursor-help shrink-0" data-testid="icon-info-tooltip" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p className="text-sm">{text}</p>
      </TooltipContent>
    </Tooltip>
  )
}

export function MiniSaveButton({ saving, saved, onClick, testId }: { saving: boolean; saved: boolean; onClick: () => void; testId: string }) {
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={onClick}
      disabled={saving}
      data-testid={testId}
    >
      {saving ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : saved ? (
        <Check className="h-3 w-3" />
      ) : (
        <Save className="h-3 w-3" />
      )}
    </Button>
  )
}

export function SaveButton({ saving, saved, onClick, testId }: { saving: boolean; saved: boolean; onClick: () => void; testId: string }) {
  return (
    <Button
      onClick={onClick}
      disabled={saving}
      data-testid={testId}
    >
      {saving ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : saved ? (
        <Check className="h-4 w-4 mr-2" />
      ) : (
        <Save className="h-4 w-4 mr-2" />
      )}
      {saved ? 'Saved!' : 'Save Changes'}
    </Button>
  )
}

export const iconOptions = [
  { value: 'Zap', label: 'Lightning' },
  { value: 'Shield', label: 'Shield' },
  { value: 'Sparkles', label: 'Sparkles' },
  { value: 'Users', label: 'Users' },
  { value: 'BarChart', label: 'Chart' },
  { value: 'Lock', label: 'Lock' },
  { value: 'Rocket', label: 'Rocket' },
  { value: 'Heart', label: 'Heart' },
  { value: 'Star', label: 'Star' },
  { value: 'Target', label: 'Target' },
  { value: 'Award', label: 'Award' },
  { value: 'Lightbulb', label: 'Lightbulb' },
]

export function IconComponent({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    Zap: <Zap className="h-4 w-4" />,
    Shield: <Shield className="h-4 w-4" />,
    Sparkles: <Sparkles className="h-4 w-4" />,
    Users: <Users className="h-4 w-4" />,
    BarChart: <BarChart className="h-4 w-4" />,
    Lock: <Lock className="h-4 w-4" />,
    Rocket: <Rocket className="h-4 w-4" />,
    Heart: <Heart className="h-4 w-4" />,
    Star: <Star className="h-4 w-4" />,
    Target: <Target className="h-4 w-4" />,
    Award: <Award className="h-4 w-4" />,
    Lightbulb: <Lightbulb className="h-4 w-4" />,
  }
  return <>{icons[name] || <Zap className="h-4 w-4" />}</>
}
