import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#121313', color: '#F3F1EF' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ marginBottom: 12, fontSize: 24 }}>Page not found</h2>
        <Link href="/" className="btn btn-primary">Go Home</Link>
      </div>
    </div>
  )
}
