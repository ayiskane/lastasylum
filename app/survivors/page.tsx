'use client'

import { useEffect, useState } from 'react'
import GameImage from '@/components/GameImage'

interface RarityData { count: number; names: string[] }
interface RoleGroup {
  role: string; building: string; buildingSlots: number; effects: string[]
  rarities: Record<string, RarityData>; icon: string; totalCount: number
}
interface SpecialSurvivor {
  id: string; name: string; role: string; icon: string
  description: string; trait: string; effects: string[]
}
interface SurvivorData {
  roles: RoleGroup[]; specials: SpecialSurvivor[]; rarityOrder: string[]
}

const RARITY_COLORS: Record<string, string> = {
  Legendary: 'text-yellow-400', UR: 'text-orange-400', SSR: 'text-purple-400',
  SR: 'text-blue-400', R: 'text-green-400',
}
const RARITY_BORDER: Record<string, string> = {
  Legendary: 'border-yellow-500/20', UR: 'border-orange-500/20', SSR: 'border-purple-500/20',
  SR: 'border-blue-500/20', R: 'border-green-500/20',
}

export default function SurvivorsPage() {
  const [data, setData] = useState<SurvivorData | null>(null)
  const [expandedNames, setExpandedNames] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetch('/api/survivors').then(r => r.json()).then(setData).catch(() => {})
  }, [])

  if (!data) {
    return (
      <div>
        <h1 className="font-display text-4xl text-asylum-accent tracking-wider mb-2">SURVIVORS</h1>
        <p className="text-asylum-muted">Loading survivors...</p>
      </div>
    )
  }

  const totalSurvivors = data.roles.reduce((sum, r) => sum + r.totalCount, 0)

  function toggleNames(key: string) {
    setExpandedNames(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div>
      <h1 className="font-display text-4xl text-asylum-accent tracking-wider mb-2">SURVIVORS</h1>
      <p className="text-asylum-muted mb-6">
        {totalSurvivors} survivors across {data.roles.length} roles — same role + same rarity = same bonus
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Special survivors as cards */}
        {data.specials.map(s => (
          <div key={s.id} className="bg-asylum-surface border-2 border-red-500/25 rounded-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-asylum-border flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg border border-red-500/30 overflow-hidden bg-asylum-bg shrink-0">
                <GameImage src={s.icon ? `/images/items/${s.icon}.png` : ''} alt={s.name} fallback="⭐" className="w-full h-full" />
              </div>
              <div>
                <div className="font-semibold text-sm text-asylum-text">{s.name}</div>
                <div className="text-[10px] text-red-400 font-semibold uppercase tracking-wider">{s.role}</div>
              </div>
            </div>
            <div className="p-4 flex-1">
              <p className="text-xs text-asylum-muted mb-3 leading-relaxed">{s.description}</p>
              <div className="space-y-1.5">
                {s.effects.map((eff, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-red-400 shrink-0"></span>
                    <span className="text-[11px] text-asylum-text">{eff}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-4 py-2 border-t border-asylum-border">
              <span className="text-[10px] text-asylum-muted italic">{s.trait}</span>
            </div>
          </div>
        ))}

        {/* Role cards */}
        {data.roles.map(role => (
          <div key={role.role} className="bg-asylum-surface border border-asylum-border rounded-xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-asylum-border">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg border border-asylum-border overflow-hidden bg-asylum-bg shrink-0">
                  <GameImage src={role.icon ? `/images/items/${role.icon}.png` : ''} alt={role.role} fallback="👤" className="w-full h-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-asylum-text">{role.role}</div>
                  <div className="text-[10px] text-asylum-muted">{role.building} — {role.buildingSlots} slots</div>
                </div>
                <span className="text-xs text-asylum-muted font-mono">{role.totalCount}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {role.effects.map((eff, i) => (
                  <span key={i} className="text-[10px] text-asylum-accent bg-asylum-accent/10 border border-asylum-accent/20 rounded px-1.5 py-0.5">{eff}</span>
                ))}
              </div>
            </div>

            {/* Rarity rows */}
            <div className="flex-1">
              {data.rarityOrder.map(rarity => {
                const rd = role.rarities[rarity]
                if (!rd) return null
                const nameKey = `${role.role}-${rarity}`
                const isExpanded = expandedNames[nameKey]

                return (
                  <div key={rarity} className={`px-4 py-2 border-b border-asylum-border/50 last:border-b-0`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold w-10 ${RARITY_COLORS[rarity] || 'text-asylum-muted'}`}>{rarity}</span>
                      <div className="flex-1 flex flex-wrap gap-1">
                        {role.effects.map((eff, i) => (
                          <span key={i} className="text-[10px] text-asylum-muted bg-asylum-bg rounded px-1.5 py-0.5">
                            {eff.split(' ').slice(0, 2).join(' ')}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={() => toggleNames(nameKey)}
                        className="text-[10px] text-asylum-muted hover:text-asylum-text transition-colors"
                        title={`${rd.count} survivors`}
                      >
                        ×{rd.count} {isExpanded ? '▾' : '▸'}
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {rd.names.map((name, i) => (
                          <span key={i} className="text-[10px] bg-asylum-bg border border-asylum-border rounded px-1.5 py-0.5 text-asylum-muted">{name}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-asylum-muted/50 italic mt-4">
        All survivors of the same role and rarity provide identical bonuses when assigned to their building.
      </p>
    </div>
  )
}
