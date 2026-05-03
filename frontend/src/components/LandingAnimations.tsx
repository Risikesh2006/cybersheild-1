'use client'

import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

function splitHeadingWords(node: HTMLElement) {
  if (node.dataset.gsapSplit === 'done') return
  if (node.querySelector('[data-variable-proximity="true"]')) return

  const text = node.textContent?.trim()
  if (!text) return

  node.dataset.gsapSplit = 'done'
  node.setAttribute('aria-label', text)
  node.textContent = ''

  const words = text.split(/\s+/)
  for (let i = 0; i < words.length; i += 1) {
    const outer = document.createElement('span')
    outer.style.display = 'inline-block'
    outer.style.overflow = 'hidden'
    outer.style.verticalAlign = 'top'

    const inner = document.createElement('span')
    inner.className = 'word'
    inner.style.display = 'inline-block'
    inner.textContent = i < words.length - 1 ? `${words[i]} ` : words[i]

    outer.appendChild(inner)
    node.appendChild(outer)
  }
}

function setupCounters() {
  const counters = gsap.utils.toArray<HTMLElement>('[data-gsap="counter"]')

  counters.forEach((counter) => {
    const source = (counter.dataset.value ?? counter.textContent ?? '').trim()
    const match = source.match(/^([^\d-]*)(-?\d+(?:\.\d+)?)(.*)$/)
    if (!match) return

    const [, prefix, rawNumber, suffix] = match
    const target = Number(rawNumber)
    if (Number.isNaN(target)) return

    const decimals = rawNumber.includes('.') ? rawNumber.split('.')[1].length : 0
    const state = { value: 0 }

    counter.textContent = `${prefix}${decimals > 0 ? state.value.toFixed(decimals) : '0'}${suffix}`

    gsap.to(state, {
      value: target,
      duration: 2,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: counter,
        start: 'top 85%',
        once: true,
      },
      onUpdate: () => {
        const valueText = decimals > 0 ? state.value.toFixed(decimals) : `${Math.round(state.value)}`
        counter.textContent = `${prefix}${valueText}${suffix}`
      },
    })
  })
}

export function LandingAnimations() {
  useEffect(() => {
    let ctx: gsap.Context | undefined
    const rafId = window.requestAnimationFrame(() => {
      ctx = gsap.context(() => {
        const heroElements = gsap.utils.toArray<HTMLElement>('[data-gsap-hero]')
        if (heroElements.length > 0) {
          gsap.set(heroElements, { autoAlpha: 0, y: 36, willChange: 'transform, opacity' })

          gsap.to(heroElements, {
            autoAlpha: 1,
            y: 0,
            duration: 1,
            ease: 'power3.out',
            stagger: 0.16,
            clearProps: 'willChange',
          })
        }

        const revealHeadings = gsap.utils.toArray<HTMLElement>('[data-gsap="word-reveal"]')
        revealHeadings.forEach((heading) => {
          if (heading.querySelector('[data-variable-proximity="true"]')) return

          splitHeadingWords(heading)

          const words = heading.querySelectorAll<HTMLElement>('.word')
          if (words.length === 0) return

          gsap.set(words, { autoAlpha: 0, yPercent: 100, willChange: 'transform, opacity' })
          gsap.to(words, {
            autoAlpha: 1,
            yPercent: 0,
            duration: 0.9,
            ease: 'power3.out',
            stagger: 0.05,
            clearProps: 'willChange',
            scrollTrigger: {
              trigger: heading,
              start: 'top 85%',
              once: true,
            },
          })
        })

        setupCounters()

        const featureCards = gsap.utils.toArray<HTMLElement>('[data-gsap="feature-card"]')
        if (featureCards.length > 0) {
          gsap.set(featureCards, { autoAlpha: 0, y: 60, willChange: 'transform, opacity' })
          gsap.to(featureCards, {
            autoAlpha: 1,
            y: 0,
            duration: 0.85,
            ease: 'power3.out',
            stagger: 0.12,
            clearProps: 'willChange',
            scrollTrigger: {
              trigger: '[data-gsap="features-section"]',
              start: 'top 75%',
              once: true,
            },
          })
        }

        const testimonialCards = gsap.utils.toArray<HTMLElement>('[data-gsap="testimonial-card"]')
        if (testimonialCards.length > 0) {
          gsap.set(testimonialCards, { autoAlpha: 0, y: 60, willChange: 'transform, opacity' })
          gsap.to(testimonialCards, {
            autoAlpha: 1,
            y: 0,
            duration: 0.85,
            ease: 'power3.out',
            stagger: 0.12,
            clearProps: 'willChange',
            scrollTrigger: {
              trigger: '[data-gsap="testimonials-section"]',
              start: 'top 75%',
              once: true,
            },
          })
        }

        const ctaItems = gsap.utils.toArray<HTMLElement>('[data-gsap-cta]')
        if (ctaItems.length > 0) {
          gsap.set(ctaItems, { autoAlpha: 0, y: 34, willChange: 'transform, opacity' })
          gsap.to(ctaItems, {
            autoAlpha: 1,
            y: 0,
            duration: 0.9,
            ease: 'power3.out',
            stagger: 0.12,
            clearProps: 'willChange',
            scrollTrigger: {
              trigger: '[data-gsap="cta-section"]',
              start: 'top 80%',
              once: true,
            },
          })
        }

        const scrollSections = gsap.utils.toArray<HTMLElement>('main > section')
        scrollSections.forEach((section) => {
          if (section.dataset.gsap === 'hero-section') return

          gsap.fromTo(
            section,
            { y: 48 },
            {
              y: 0,
              ease: 'none',
              scrollTrigger: {
                trigger: section,
                start: 'top 92%',
                end: 'top 45%',
                scrub: 1,
              },
            },
          )
        })

        const horizontalTrack = document.querySelector<HTMLElement>('[data-gsap="horizontal-track"]')
        const horizontalSection = document.querySelector<HTMLElement>('[data-gsap="horizontal-section"]')
        if (horizontalTrack && horizontalSection) {
          const getDistance = () => Math.max(horizontalTrack.scrollWidth - horizontalSection.clientWidth, 0)

          gsap.to(horizontalTrack, {
            x: () => -getDistance(),
            ease: 'none',
            scrollTrigger: {
              trigger: horizontalSection,
              start: 'top top',
              end: () => `+=${getDistance()}`,
              pin: true,
              scrub: 1,
              invalidateOnRefresh: true,
            },
          })
        }

        ScrollTrigger.refresh()
      })
    })

    return () => {
      window.cancelAnimationFrame(rafId)
      ctx?.revert()
    }
  }, [])

  return null
}
