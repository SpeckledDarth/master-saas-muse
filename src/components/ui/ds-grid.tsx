import { cn } from '@/lib/utils'

interface DSGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  cols?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
}

const colClasses: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
}

const smColClasses: Record<number, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
}

const mdColClasses: Record<number, string> = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
}

const lgColClasses: Record<number, string> = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
  6: 'lg:grid-cols-6',
}

export function DSGrid({ className, children, cols, ...props }: DSGridProps) {
  const baseCol = cols?.default ? colClasses[cols.default] || 'grid-cols-1' : 'grid-cols-1'
  const sm = cols?.sm ? smColClasses[cols.sm] : ''
  const md = cols?.md ? mdColClasses[cols.md] : ''
  const lg = cols?.lg ? lgColClasses[cols.lg] : ''

  return (
    <div
      className={cn(
        'grid gap-[var(--content-density-gap,1rem)]',
        baseCol, sm, md, lg,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
