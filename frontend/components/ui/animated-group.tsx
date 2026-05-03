'use client'

import * as React from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface AnimatedGroupProps extends HTMLMotionProps<'div'> {
  delayChildren?: number
  staggerChildren?: number
  disableAnimation?: boolean
}

export function AnimatedGroup({
  className,
  children,
  delayChildren = 0,
  staggerChildren = 0.12,
  disableAnimation = false,
  ...props
}: AnimatedGroupProps) {
  if (disableAnimation) {
    return (
      <motion.div
        className={cn(className)}
        initial={false}
        animate={undefined}
        whileInView={undefined}
        variants={undefined}
        {...props}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.25 }}
      variants={{
        hidden: {},
        show: {
          transition: {
            delayChildren,
            staggerChildren,
          },
        },
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function AnimatedItem({ className, children }: React.PropsWithChildren<{ className?: string }>) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 24, filter: 'blur(10px)' },
        show: {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          transition: { duration: 1, ease: [0.16, 1, 0.3, 1] },
        },
      }}
    >
      {children}
    </motion.div>
  )
}