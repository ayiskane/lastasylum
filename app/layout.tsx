import type { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Last Asylum Wiki',
  description: 'Comprehensive game database for Last Asylum — heroes, items, buildings, formulas, and more.',
}

const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/heroes', label: 'Heroes' },
  { href: '/survivors', label: 'Survivors' },
  { href: '/items', label: 'Items' },
  { href: '/buildings', label: 'Buildings' },
  { href: '/troops', label: 'Troops' },
  { href: '/research', label: 'Research' },
  { href: '/formulas', label: 'Formulas' },
  { href: '/search', label: 'Search' },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-body min-h-screen">
        <header className="sticky top-0 z-50 bg-asylum-bg/90 backdrop-blur-md border-b border-asylum-border">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-6">
            <Link href="/" className="font-display text-2xl text-asylum-accent tracking-wider shrink-0">
              LAST ASYLUM
            </Link>
            <nav className="flex gap-1 overflow-x-auto scrollbar-hide">
              {NAV_ITEMS.map(item => (
                <Link key={item.href} href={item.href}
                  className="px-3 py-1.5 text-sm text-asylum-muted hover:text-asylum-text hover:bg-asylum-surface rounded transition-colors whitespace-nowrap">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>

        <footer className="border-t border-asylum-border mt-16 py-8 text-center text-asylum-muted text-sm">
          <p>Last Asylum Wiki — Game data extracted from version 1.0.375</p>
          <p className="mt-1 text-xs">Not affiliated with the game developers. Data may change with updates.</p>
        </footer>
      </body>
    </html>
  )
}
