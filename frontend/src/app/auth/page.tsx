import Auth from '@/src/views/Auth'
import { Suspense } from 'react'

export default function AuthPage() {
  return <Suspense fallback={<main>Loading sign in…</main>}><Auth /></Suspense>
}
