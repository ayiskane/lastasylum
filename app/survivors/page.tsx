'use client'

import { useEffect, useState, useMemo } from 'react'
import GameImage from '@/components/GameImage'

interface Survivor {
  id: string; displayName: string; workerName: string; postName: string
  characterDes: string; workerStory: string; icon: string
  quality: number | null; rarity: string; rarityKey: string; isSpecial: boolean
}

const RARITY_ORDER = ['Special', 'Legendary', 'UR', 'SSR', 'SR', 'R']
const RARITY_COLORS: Record<string, string> = {
  Special: 'text-red-400 border-red-500/30 bg-red-500/5',
  Legendary: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/5',
  UR: 'text-orange-400 border-orange-500/30 bg-orange-500/5',
  SSR: 'text-purple-400 border-purple-500/30 bg-purple-500/5',
  SR: 'text-blue-400 border-blue-500/30 bg-blue-500/5',
  R: 'text-green-400 border-green-500/30 bg-green-500/5',
}
const RARITY_ACCENT: Record<string, string> = {
  Special: 'border-red-500/40', Legendary: 'border-yellow-500/40',
  UR: 'border-orange-500/40', SSR: 'border-purple-500/40',
  SR: 'border-blue-500/40', R: 'border-green-500/40',
}

export default function SurvivorsPage() {
  const [survivors, setSurvivors] = useState<Survivor[]>([])
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/survivors')
      .then(r => r.json())
      .then(setSurvivors)
      .catch(() => {})
  }, [])

  const roles = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const s of survivors) {
      const role = s.postName || 'Unknown'
      counts[role] = (counts[role] || 0) + 1
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([role, count]) => ({ role, count }))
  }, [survivors])

  const filtered = useMemo(() => {
    let list = survivors
    if (roleFilter !== 'all') {
      list = list.filter(s => s.postName === roleFilter)
    }
    if (search.length >= 2) {
      const q = search.toLowerCase()
      list = list.filter(s =>
        s.displayName.toLowerCase().includes(q) ||
        s.workerName.toLowerCase().includes(q) ||
        s.postName.toLowerCase().includes(q)
      )
    }
    return list
  }, [survivors, roleFilter, search])

  // Group by rarity
  const byRarity = useMemo(() => {
    const groups: Record<string, Survivor[]> = {}
    for (const s of filtered) {
      ;(groups[s.rarity] ??= []).push(s)
    }
    // Sort each group by postName then name
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => a.postName.localeCompare(b.postName) || a.workerName.localeCompare(b.workerName))
    }
    return groups
  }, [filtered])

  if (!survivors.length) {
    return (
      <div>
        <h1 className="font-display text-4xl text-asylum-accent tracking-wider mb-2">SURVIVORS</h1>
        <p className="text-asylum-muted">Loading survivors...</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-display text-4xl text-asylum-accent tracking-wider mb-2">SURVIVORS</h1>
      <p className="text-asylum-muted mb-6">{survivors.length} survivors across all rarity tiers</p>

      {/* Filters */}
      <div className="space-y-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search survivors by name or role..."
          className="w-full bg-asylum-surface border border-asylum-border rounded-lg px-4 py-2.5 text-sm text-asylum-text placeholder:text-asylum-muted/50 focus:border-asylum-accent outline-none"
        />
        <div className="flex flex-wrap gap-2">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="bg-asylum-surface border border-asylum-border rounded-lg px-3 py-2 text-sm text-asylum-text focus:border-asylum-accent outline-none"
          >
            <option value="all">All Roles ({survivors.length})</option>
            {roles.map(r => (
              <option key={r.role} value={r.role}>{r.role} ({r.count})</option>
            ))}
          </select>
          {(search || roleFilter !== 'all') && (
            <button
              onClick={() => { setSearch(''); setRoleFilter('all') }}
              className="bg-asylum-bg border border-asylum-border rounded-lg px-3 py-2 text-sm text-asylum-muted hover:text-asylum-text transition-colors"
            >
              Clear Filters
            </button>
          )}
          <div className="ml-auto text-sm text-asylum-muted self-center">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Rarity sections */}
      {RARITY_ORDER.map(rarity => {
        const group = byRarity[rarity]
        if (!group?.length) return null
        const colors = RARITY_COLORS[rarity] || ''
        const accent = RARITY_ACCENT[rarity] || 'border-asylum-border'

        return (
          <section key={rarity} className="mb-8">
            <h2 className={`font-display text-lg tracking-wide mb-3 ${colors.split(' ')[0]}`}>
              {rarity} ({group.length})
            </h2>

            {rarity === 'Special' ? (
              /* Special survivors get full cards */
              <div className="grid md:grid-cols-2 gap-4">
                {group.map(s => (
                  <div key={s.id} className={`bg-asylum-surface border-2 ${accent} rounded-xl p-5`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-16 h-16 rounded-lg border ${accent} overflow-hidden bg-asylum-bg shrink-0`}>
                        <GameImage src={s.icon ? `/images/items/${s.icon}.png` : ''} alt={s.workerName} fallback="⭐" className="w-full h-full" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-asylum-text">{s.workerName}</div>
                        <div className={`text-xs font-semibold ${colors.split(' ')[0]}`}>{s.postName}</div>
                        <div className="text-xs text-asylum-muted italic mt-1">{s.characterDes}</div>
                      </div>
                    </div>
                    {s.workerStory && (
                      <p className="text-xs text-asylum-muted mt-3 pt-3 border-t border-asylum-border/50 leading-relaxed">{s.workerStory}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              /* Normal survivors in a compact grid */
              <div className="bg-asylum-surface border border-asylum-border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-asylum-border text-asylum-muted text-xs uppercase tracking-wider">
                      <th className="text-left p-3 w-10"></th>
                      <th className="text-left p-3">Name</th>
                      <th className="text-left p-3">Role</th>
                      <th className="text-left p-3 hidden md:table-cell">Trait</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.map(s => (
                      <tr key={s.id} className="border-b border-asylum-border/30 hover:bg-asylum-bg/50 transition-colors">
                        <td className="p-2">
                          <div className={`w-8 h-8 rounded border ${accent} overflow-hidden bg-asylum-bg`}>
                            <GameImage src={s.icon ? `/images/items/${s.icon}.png` : ''} alt={s.workerName} fallback="👤" className="w-full h-full" />
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-asylum-text font-semibold text-sm">{s.workerName || s.displayName}</span>
                        </td>
                        <td className="p-3">
                          <span className="text-xs text-asylum-muted bg-asylum-bg rounded px-2 py-0.5">{s.postName}</span>
                        </td>
                        <td className="p-3 text-xs text-asylum-muted hidden md:table-cell">{s.characterDes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
