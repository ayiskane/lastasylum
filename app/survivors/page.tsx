'use client'

import { useEffect, useState } from 'react'
import GameImage from '@/components/GameImage'

interface EffectValue { label: string; value: string }
interface RarityData { count: number; names: string[] }
interface RoleGroup {
  role: string; building: string; buildingSlots: number
  effectsByRarity: Record<string, EffectValue[]>
  rarities: Record<string, RarityData>; icon: string; totalCount: number
}
interface SpecialSurvivor {
  id: string; name: string; role: string; icon: string
  description: string; trait: string; effects: EffectValue[]
}
interface SurvivorData {
  roles: RoleGroup[]; specials: SpecialSurvivor[]; rarityOrder: string[]
}

const RARITY_COLORS: Record<string, string> = {
  Legendary: 'text-yellow-400', UR: 'text-orange-400', SSR: 'text-purple-400',
  SR: 'text-blue-400', R: 'text-green-400',
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

  return (
    <div>
      <h1 className="font-display text-4xl text-asylum-accent tracking-wider mb-2">SURVIVORS</h1>
      <p className="text-asylum-muted mb-6">
        {totalSurvivors} survivors across {data.roles.length} roles — same role + same rarity = same bonus
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">

        {/* Special survivors */}
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
                  <div key={i} className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-asylum-muted">{eff.label}</span>
                    <span className="text-asylum-text font-semibold font-mono text-[10px]">{eff.value}</span>
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
        {data.roles.map(role => {
          // Get unique effect labels from the highest rarity
          const topRarity = data.rarityOrder.find(r => role.effectsByRarity[r])
          const effectLabels = topRarity ? role.effectsByRarity[topRarity].map(e => e.label) : []

          return (
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
                  {effectLabels.map((label, i) => (
                    <span key={i} className="text-[10px] text-asylum-accent bg-asylum-accent/10 border border-asylum-accent/20 rounded px-1.5 py-0.5">{label}</span>
                  ))}
                </div>
              </div>

              {/* Rarity rows with actual stat values */}
              <div className="flex-1">
                {data.rarityOrder.map(rarity => {
                  const rd = role.rarities[rarity]
                  if (!rd) return null
                  const effects = role.effectsByRarity[rarity] || []
                  const nameKey = `${role.role}-${rarity}`
                  const isExpanded = expandedNames[nameKey]

                  return (
                    <div key={rarity} className="px-4 py-2 border-b border-asylum-border/30 last:border-b-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-semibold w-10 shrink-0 ${RARITY_COLORS[rarity] || 'text-asylum-muted'}`}>{rarity}</span>
                        <div className="flex-1 flex flex-wrap gap-1">
                          {effects.map((eff, i) => (
                            <span key={i} className="text-[10px] text-asylum-muted bg-asylum-bg rounded px-1.5 py-0.5">
                              {eff.label} <span className="text-asylum-text font-semibold font-mono">{eff.value}</span>
                            </span>
                          ))}
                        </div>
                        <button
                          onClick={() => setExpandedNames(prev => ({ ...prev, [nameKey]: !prev[nameKey] }))}
                          className="text-[10px] text-asylum-muted hover:text-asylum-text transition-colors shrink-0"
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
          )
        })}
      </div>

      <p className="text-[10px] text-asylum-muted/50 italic mt-4">
        All survivors of the same role and rarity provide identical bonuses when assigned to their building. Values are approximate and may vary with building level.
      </p>
    </div>
  )
}
