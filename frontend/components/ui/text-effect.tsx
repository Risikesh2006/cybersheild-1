'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface TextEffectProps extends React.HTMLAttributes<HTMLSpanElement> {
  text: string
  type?: 'word' | 'char'
}

export function TextEffect({ text, type = 'word', className }: TextEffectProps) {
  const parts = type === 'char' ? text.split('') : text.split(' ')

  return (
    <span className={cn('inline-flex flex-wrap', className)} aria-label={text}>
      {parts.map((part, index) => (
        <motion.span
          key={`${part}-${index}`}
          initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
          className={type === 'char' ? 'inline-block' : 'mr-2 inline-block'}
        >
          {part === ' ' ? '\u00A0' : part}
        </motion.span>
      ))}
    </span>
  )
}