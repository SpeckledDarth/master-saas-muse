import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface DSCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  'data-testid'?: string
}

function DSCard({ className, children, ...props }: DSCardProps) {
  return (
    <Card
      className={cn(
        'rounded-[var(--card-radius,0.75rem)] shadow-[var(--card-shadow,0_1px_2px_0_rgb(0_0_0/0.05))]',
        'border-[length:var(--card-border-width,1px)] border-[var(--card-border-style,solid)]',
        className
      )}
      {...props}
    >
      {children}
    </Card>
  )
}

interface DSCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

function DSCardHeader({ className, children, ...props }: DSCardHeaderProps) {
  return (
    <CardHeader
      className={cn('p-[var(--card-padding,1.25rem)]', className)}
      {...props}
    >
      {children}
    </CardHeader>
  )
}

interface DSCardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

function DSCardContent({ className, children, ...props }: DSCardContentProps) {
  return (
    <CardContent
      className={cn('p-[var(--card-padding,1.25rem)] pt-0', className)}
      {...props}
    >
      {children}
    </CardContent>
  )
}

export { DSCard, DSCardHeader, DSCardContent, CardTitle as DSCardTitle, CardDescription as DSCardDescription }
