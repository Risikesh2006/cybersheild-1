import type { Metadata } from 'next'
import { Inter, Space_Grotesk, Geist } from 'next/font/google'
import './globals.css'
import Providers from './providers'
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'})
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' })

export const metadata: Metadata = {
  title: 'CyberShield',
  description: 'Agentic AI Cybersecurity Training Platform',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body suppressHydrationWarning className={`${geist.variable} ${spaceGrotesk.variable} bg-background text-foreground antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
