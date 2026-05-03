import * as React from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className, ...props }: CardProps) {
  return <div className={cn('card-surface', className)} {...props} />
}

export function CardHeader({ className, ...props }: CardProps) {
  return <div className={cn('flex flex-col gap-2 p-6 pb-0', className)} {...props} />
}

export function CardContent({ className, ...props }: CardProps) {
  return <div className={cn('p-6 pt-4', className)} {...props} />
}

export function CardFooter({ className, ...props }: CardProps) {
  return <div className={cn('flex items-center p-6 pt-0', className)} {...props} />
}