import { cn } from '@/lib/utils'

interface DSSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function DSSection({ className, children, ...props }: DSSectionProps) {
  return (
    <div
      className={cn(
        'py-[var(--section-spacing,1.5rem)] space-y-[var(--content-density-gap,1rem)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
