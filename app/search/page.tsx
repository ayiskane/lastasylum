'use client'

import { useEffect, useState, useMemo } from 'react'
import Fuse from 'fuse.js'
import Link from 'next/link'

interface SearchItem {
  type: string; id: string; name: string; desc: string; href: string
}

const TYPE_ICONS: Record<string, string> = {
  hero: '⚔️', item: '🎒', building: '🏗️', formula: '🧮',
  research: '🔬', troop: '🔫',
}
const TYPE_COLORS: Record<string, string> = {
  hero: 'text-orange-400', item: 'text-blue-400', building: 'text-green-400',
  formula: 'text-purple-400', research: 'text-cyan-400', troop: 'text-red-400',
}

export default function SearchPage() {
  const [items, setItems] = useState<SearchItem[]>([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    fetch('/api/search').then(r => r.json()).then(setItems).catch(() => {})
  }, [])

  const fuse = useMemo(
    () => new Fuse(items, { keys: ['name', 'desc', 'id'], threshold: 0.3 }),
    [items]
  )

  const results = query.length >= 2
    ? fuse.search(query, { limit: 50 }).map(r => r.item)
    : []

  return (
    <div>
      <h1 className="font-display text-4xl text-asylum-accent tracking-wider mb-2">SEARCH</h1>
      <p className="text-asylum-muted mb-6">Search across {items.length.toLocaleString()} entries</p>

      <input type="text" value={query} onChange={e => setQuery(e.target.value)}
        placeholder="Search heroes, items, buildings, research, troops..."
        className="w-full bg-asylum-surface border border-asylum-border rounded-xl px-4 py-3 text-asylum-text placeholder:text-asylum-muted/50 focus:border-asylum-accent outline-none mb-6"
        autoFocus />

      {query.length >= 2 && (
        <div className="text-sm text-asylum-muted mb-4">
          {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
        </div>
      )}

      <div className="space-y-2">
        {results.map((item, i) => (
          <Link key={`${item.type}-${item.id}-${i}`} href={item.href}
            className="block bg-asylum-surface border border-asylum-border rounded-lg p-4 hover:border-asylum-accent/40 transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-xl">{TYPE_ICONS[item.type] || '📄'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-asylum-text">{item.name}</span>
                  <span className={`text-xs ${TYPE_COLORS[item.type] || 'text-asylum-muted'}`}>{item.type}</span>
                </div>
                <div className="text-xs text-asylum-muted truncate">{item.desc}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {query.length < 2 && query.length > 0 && (
        <p className="text-asylum-muted text-sm">Type at least 2 characters to search</p>
      )}
    </div>
  )
}
