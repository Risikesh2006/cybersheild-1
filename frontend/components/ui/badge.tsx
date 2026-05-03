import * as React from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'accent' | 'muted' | 'outline'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const classes: Record<BadgeVariant, string> = {
  default: 'bg-primary/15 text-primary border border-primary/20',
  accent: 'bg-primary text-primary-foreground border border-primary/20',
  muted: 'bg-secondary text-muted-foreground border border-border',
  outline: 'border border-border bg-transparent text-foreground',
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-medium', classes[variant], className)} {...props} />
}