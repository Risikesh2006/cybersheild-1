'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AccordionItemData {
  value: string
  title: string
  content: React.ReactNode
}

export interface AccordionProps {
  items: AccordionItemData[]
  className?: string
}

export function Accordion({ items, className }: AccordionProps) {
  const [openValue, setOpenValue] = React.useState<string>(items[0]?.value ?? '')

  return (
    <div className={cn('space-y-4', className)}>
      {items.map((item) => {
        const open = openValue === item.value
        return (
          <div key={item.value} className="rounded-2xl border border-border bg-card/80 px-5 py-4 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.75)]">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 text-left"
              aria-expanded={open}
              onClick={() => setOpenValue(open ? '' : item.value)}
            >
              <span className="text-base font-medium text-foreground sm:text-lg">{item.title}</span>
              <ChevronDown className={cn('h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300', open && 'rotate-180')} />
            </button>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 text-sm leading-7 text-muted-foreground sm:text-base">{item.content}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}