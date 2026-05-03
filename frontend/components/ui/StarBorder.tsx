'use client'

import * as React from 'react'

type StarBorderProps<T extends React.ElementType = 'button'> = {
  as?: T
  className?: string
  color?: string
  speed?: string
  thickness?: number
  children: React.ReactNode
} & Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'color' | 'speed' | 'thickness' | 'className' | 'children'>

const StarBorder = <T extends React.ElementType = 'button'>({
  as,
  className = '',
  color = 'white',
  speed = '5s',
  thickness = 1.5,
  children,
  style,
  ...rest
}: StarBorderProps<T>) => {
  const Component = (as || 'button') as React.ElementType
  return React.createElement(
    Component,
    {
      className: `star-border-container ${className}`,
      style: {
        padding: `${thickness}px`,
        ...style,
      },
      ...rest,
    },
    React.createElement('div', {
      className: 'border-gradient-bottom',
      style: {
        background: `radial-gradient(circle, ${color}, transparent 10%)`,
        animationDuration: speed,
      },
    }),
    React.createElement('div', {
      className: 'border-gradient-top',
      style: {
        background: `radial-gradient(circle, ${color}, transparent 10%)`,
        animationDuration: speed,
      },
    }),
    React.createElement('div', { className: 'inner-content' }, children)
  )
}

export default StarBorder
