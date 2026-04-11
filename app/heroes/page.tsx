'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import GameImage from '@/components/GameImage'

interface HeroEntry {
  id: string; name: string; quality: number; qualityName: string
  armyType: number; armyName: string; campType: number; campName: string
  maxAbility: number; heroIcon: string
}

const QUALITY_CARD: Record<number, { border: string; bg: string; text: string }> = {
  2: { border: 'border-green-500/50', bg: 'bg-gradient-to-b from-[#1a4a2a] to-[#0f2818]', text: 'text-green-400' },
  3: { border: 'border-[#4a7ec2]/50', bg: 'bg-gradient-to-b from-[#2a4a7a] to-[#162845]', text: 'text-blue-400' },
  4: { border: 'border-[#9855d4]/50', bg: 'bg-gradient-to-b from-[#6b2fa0] to-[#351660]', text: 'text-purple-400' },
  5: { border: 'border-[#d4943a]/50', bg: 'bg-gradient-to-b from-[#c88520] to-[#704010]', text: 'text-amber-400' },
  6: { border: 'border-red-500/50', bg: 'bg-gradient-to-b from-[#a02020] to-[#501010]', text: 'text-red-400' },
}

// SVG badge icons for army type (top-left blue shield)
const ARMY_ICON: Record<number, string> = {
  1: '🛡️', // Infantry
  2: '🚗', // Vehicle
  3: '✈️', // Aircraft
}

// SVG badge icons for camp/role (bottom-left)
const CAMP_ICON: Record<number, string> = {
  1: '🏹', // Ranger
  2: '🔮', // Warlock
  3: '⚔️', // Warrior
}

const ARMY_COLORS: Record<number, string> = {
  1: 'bg-blue-600', 2: 'bg-emerald-600', 3: 'bg-sky-600',
}
const CAMP_COLORS: Record<number, string> = {
  1: 'bg-red-600', 2: 'bg-purple-600', 3: 'bg-orange-600',
}

export default function HeroesPage() {
  const [heroes, setHeroes] = useState<HeroEntry[]>([])
  const [filterArmy, setFilterArmy] = useState<number | null>(null)
  const [filterCamp, setFilterCamp] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/heroes').then(r => r.json()).then(setHeroes).catch(() => {})
  }, [])

  if (!heroes.length) {
    return (
      <div>
        <h1 className="font-display text-4xl text-asylum-accent tracking-wider mb-2">HEROES</h1>
        <p className="text-asylum-muted">Loading...</p>
      </div>
    )
  }

  // Unique army/camp types for filters
  const armyTypes = [...new Set(heroes.map(h => h.armyType))].filter(t => t > 0).sort()
  const campTypes = [...new Set(heroes.map(h => h.campType))].filter(t => t > 0).sort()
  const armyNames: Record<number, string> = {}
  const campNames: Record<number, string> = {}
  heroes.forEach(h => {
    if (h.armyType > 0) armyNames[h.armyType] = h.armyName
    if (h.campType > 0) campNames[h.campType] = h.campName
  })

  // Filter
  const filtered = heroes.filter(h =>
    (filterArmy === null || h.armyType === filterArmy) &&
    (filterCamp === null || h.campType === filterCamp)
  )

  // Group by quality
  const byQuality: Record<number, HeroEntry[]> = {}
  for (const h of filtered) {
    ;(byQuality[h.quality] ??= []).push(h)
  }

  const qualityOrder = [6, 5, 4, 3, 2, 0]
  const qualityLabels: Record<number, string> = { 6: 'UR+', 5: 'UR', 4: 'SSR', 3: 'SR', 2: 'R', 0: 'SR' }

  return (
    <div>
      <h1 className="font-display text-4xl text-asylum-accent tracking-wider mb-2">HEROES</h1>
      <p className="text-asylum-muted mb-4">{heroes.length} heroes across all rarity tiers</p>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Army type filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-asylum-hint uppercase tracking-wider mr-1">Class</span>
          <button
            onClick={() => setFilterArmy(null)}
            className={`text-[11px] px-2.5 py-1 rounded-lg transition-colors ${
              filterArmy === null
                ? 'bg-asylum-accent/15 text-asylum-accent border border-asylum-accent/30'
                : 'bg-asylum-surface border border-asylum-border text-asylum-muted hover:text-asylum-text'
            }`}
          >All</button>
          {armyTypes.map(t => (
            <button key={t} onClick={() => setFilterArmy(filterArmy === t ? null : t)}
              className={`text-[11px] px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                filterArmy === t
                  ? 'bg-asylum-accent/15 text-asylum-accent border border-asylum-accent/30'
                  : 'bg-asylum-surface border border-asylum-border text-asylum-muted hover:text-asylum-text'
              }`}
            >
              <span className="text-xs">{ARMY_ICON[t] || '?'}</span>
              {armyNames[t]}
            </button>
          ))}
        </div>

        {/* Camp/role filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-asylum-hint uppercase tracking-wider mr-1">Role</span>
          <button
            onClick={() => setFilterCamp(null)}
            className={`text-[11px] px-2.5 py-1 rounded-lg transition-colors ${
              filterCamp === null
                ? 'bg-asylum-accent/15 text-asylum-accent border border-asylum-accent/30'
                : 'bg-asylum-surface border border-asylum-border text-asylum-muted hover:text-asylum-text'
            }`}
          >All</button>
          {campTypes.map(t => (
            <button key={t} onClick={() => setFilterCamp(filterCamp === t ? null : t)}
              className={`text-[11px] px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                filterCamp === t
                  ? 'bg-asylum-accent/15 text-asylum-accent border border-asylum-accent/30'
                  : 'bg-asylum-surface border border-asylum-border text-asylum-muted hover:text-asylum-text'
              }`}
            >
              <span className="text-xs">{CAMP_ICON[t] || '?'}</span>
              {campNames[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Filtered count */}
      {(filterArmy !== null || filterCamp !== null) && (
        <p className="text-xs text-asylum-muted mb-4">
          Showing {filtered.length} of {heroes.length} heroes
          <button onClick={() => { setFilterArmy(null); setFilterCamp(null) }}
            className="ml-2 text-asylum-accent hover:underline">Clear filters</button>
        </p>
      )}

      {/* Hero grid grouped by quality */}
      {qualityOrder.map(q => {
        const list = byQuality[q]
        if (!list?.length) return null
        const style = QUALITY_CARD[q] || QUALITY_CARD[4]
        return (
          <section key={q} className="mb-8">
            <h2 className={`font-display text-lg tracking-wide mb-3 ${style.text}`}>
              {qualityLabels[q] || `Quality ${q}`}
              <span className="text-sm text-asylum-muted font-normal ml-2">({list.length})</span>
            </h2>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
              {list.map(hero => (
                <HeroCard key={hero.id} hero={hero} style={style} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function HeroCard({ hero, style }: { hero: HeroEntry; style: { border: string; bg: string } }) {
  return (
    <Link href={`/heroes/${hero.id}`}
      className="group flex flex-col items-center gap-1.5 transition-transform hover:scale-105">
      {/* Card with badges */}
      <div className={`w-[72px] h-[72px] rounded-xl border-2 ${style.border} ${style.bg} p-0.5 overflow-hidden relative transition-all group-hover:border-opacity-100`}>
        <div className="w-full h-full rounded-[10px] overflow-hidden">
          <GameImage
            src={hero.heroIcon ? `/images/heroes/${hero.heroIcon}.png` : ''}
            alt={hero.name}
            fallback="⚔️"
            className="w-full h-full object-cover"
          />
        </div>
        {/* Army type badge — top left */}
        {hero.armyType > 0 && (
          <div className={`absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-md ${ARMY_COLORS[hero.armyType] || 'bg-gray-600'} flex items-center justify-center shadow-sm`}>
            <span className="text-[9px] leading-none">{ARMY_ICON[hero.armyType] || '?'}</span>
          </div>
        )}
        {/* Camp/role badge — bottom left */}
        {hero.campType > 0 && (
          <div className={`absolute bottom-0.5 left-0.5 w-[18px] h-[18px] rounded-md ${CAMP_COLORS[hero.campType] || 'bg-gray-600'} flex items-center justify-center shadow-sm`}>
            <span className="text-[9px] leading-none">{CAMP_ICON[hero.campType] || '?'}</span>
          </div>
        )}
      </div>
      {/* Name */}
      <span className="text-[11px] font-semibold text-asylum-text text-center leading-tight group-hover:text-asylum-accent transition-colors truncate max-w-[80px]">
        {hero.name}
      </span>
    </Link>
  )
}
