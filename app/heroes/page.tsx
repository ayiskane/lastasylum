'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import GameImage from '@/components/GameImage'

interface HeroEntry {
  id: string; name: string; quality: number; qualityName: string
  armyType: number; armyName: string; campType: number; campName: string
  maxAbility: number; heroIcon: string
}

// Camp/class: 0=Warrior, 1=Ranger, 2=Warlock
const CAMP_ICON: Record<number, string> = {
  0: '/images/icons/pic_sjboss_zy1.png',
  1: '/images/icons/pic_sjboss_zy2.png',
  2: '/images/icons/pic_sjboss_zy3.png',
}
const CAMP_NAMES: Record<number, string> = {
  0: 'Warrior', 1: 'Ranger', 2: 'Warlock',
}
const CAMP_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  0: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  1: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  2: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
}

// Army type: 0=Support, 1=Tank, 3=Damage
const ARMY_ICON: Record<number, string> = {
  0: '/images/icons/ico_yx_dw3.png',
  1: '/images/icons/ico_yx_dw1.png',
  3: '/images/icons/ico_yx_dw2.png',
}
const ARMY_NAMES: Record<number, string> = {
  0: 'Support', 1: 'Tank', 3: 'Damage',
}

// Rarity config
const RARITY: Record<number, { label: string; color: string; borderColor: string; bgGrad: string; frameBorder: string; accentLine: string }> = {
  5: {
    label: 'UR', color: 'text-[#d4943a]', borderColor: 'border-[#d4943a]',
    bgGrad: 'from-[#d4943a10] to-transparent', frameBorder: 'border-[#d4943a50]',
    accentLine: 'from-[#d4943a40] to-transparent',
  },
  4: {
    label: 'SSR', color: 'text-[#9855d4]', borderColor: 'border-[#9855d4]',
    bgGrad: 'from-[#9855d410] to-transparent', frameBorder: 'border-[#9855d450]',
    accentLine: 'from-[#9855d440] to-transparent',
  },
  0: {
    label: 'SR', color: 'text-[#4a7ec2]', borderColor: 'border-[#4a7ec2]',
    bgGrad: 'from-[#4a7ec210] to-transparent', frameBorder: 'border-[#4a7ec250]',
    accentLine: 'from-[#4a7ec240] to-transparent',
  },
}

// Rarity label images
const RARITY_LABEL: Record<number, string> = {
  0: '/images/icons/font_pz_3.png',
  4: '/images/icons/font_pz_4.png',
  5: '/images/icons/font_pz_5.png',
}

function formatMight(n: number): string {
  if (!n) return '—'
  return n.toLocaleString()
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
        <h1 className="text-4xl font-bold tracking-wider text-[#c9a44e] mb-1" style={{ fontFamily: "'Rajdhani', sans-serif" }}>HEROES</h1>
        <p className="text-asylum-muted text-sm">Loading...</p>
      </div>
    )
  }

  const armyTypes = [1, 3, 0]
  const campTypes = [0, 1, 2]

  const filtered = heroes.filter(h =>
    (filterArmy === null || h.armyType === filterArmy) &&
    (filterCamp === null || h.campType === filterCamp)
  )

  const byQuality: Record<number, HeroEntry[]> = {}
  for (const h of filtered) {
    ;(byQuality[h.quality] ??= []).push(h)
  }
  const qualityOrder = [6, 5, 4, 0]

  return (
    <div>
      <h1 className="text-4xl font-bold tracking-wider text-[#c9a44e] mb-1" style={{ fontFamily: "'Rajdhani', sans-serif" }}>HEROES</h1>
      <p className="text-[#5a5848] text-sm tracking-wide mb-6">{heroes.length} heroes across all rarity tiers</p>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-1.5 mb-8 px-3 py-2.5 bg-[#0c0e14] rounded-xl border border-[#1a1c22]">
        <span className="text-[10px] text-[#4a4838] tracking-widest uppercase mr-1">Type</span>
        <FilterBtn active={filterArmy === null} onClick={() => setFilterArmy(null)}>All</FilterBtn>
        {armyTypes.map(t => (
          <FilterBtn key={t} active={filterArmy === t} onClick={() => setFilterArmy(filterArmy === t ? null : t)}
            icon={ARMY_ICON[t]}>{ARMY_NAMES[t]}</FilterBtn>
        ))}

        <div className="w-px h-6 bg-[#1a1c22] mx-2" />

        <span className="text-[10px] text-[#4a4838] tracking-widest uppercase mr-1">Role</span>
        <FilterBtn active={filterCamp === null} onClick={() => setFilterCamp(null)}>All</FilterBtn>
        {campTypes.map(t => (
          <FilterBtn key={t} active={filterCamp === t} onClick={() => setFilterCamp(filterCamp === t ? null : t)}
            icon={CAMP_ICON[t]}>{CAMP_NAMES[t]}</FilterBtn>
        ))}
      </div>

      {(filterArmy !== null || filterCamp !== null) && (
        <p className="text-xs text-[#5a5848] mb-4">
          Showing {filtered.length} of {heroes.length} heroes
          <button onClick={() => { setFilterArmy(null); setFilterCamp(null) }}
            className="ml-2 text-[#c9a44e] hover:underline">Clear filters</button>
        </p>
      )}

      {qualityOrder.map(q => {
        const list = byQuality[q]
        if (!list?.length) return null
        const r = RARITY[q] || RARITY[4]
        const rarityImg = RARITY_LABEL[q]
        return (
          <section key={q} className="mb-10">
            {/* Section header with rarity label + fade line */}
            <div className="flex items-center gap-3 mb-4">
              {rarityImg ? (
                <img src={rarityImg} alt={r.label} className="h-6" />
              ) : (
                <span className={`text-xl font-bold tracking-widest ${r.color}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>{r.label}</span>
              )}
              <span className="text-xs text-[#3a3828]">({list.length})</span>
              <div className={`flex-1 h-px bg-gradient-to-r ${r.accentLine}`} />
            </div>

            {/* Card grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {list.map(hero => (
                <HeroCard key={hero.id} hero={hero} rarity={r} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function FilterBtn({ active, onClick, icon, children }: {
  active: boolean; onClick: () => void; icon?: string; children: React.ReactNode
}) {
  return (
    <button onClick={onClick}
      className={`text-xs font-semibold px-3 py-1 rounded-md border transition-all flex items-center gap-1.5 ${
        active
          ? 'bg-[#c9a44e12] border-[#c9a44e44] text-[#c9a44e]'
          : 'bg-transparent border-[#1e2028] text-[#6a6858] hover:border-[#3a3828] hover:text-[#b0a888]'
      }`}
      style={{ fontFamily: "'Rajdhani', sans-serif" }}>
      {icon && <img src={icon} alt="" className="h-4 w-auto" />}
      {children}
    </button>
  )
}

function HeroCard({ hero, rarity }: { hero: HeroEntry; rarity: typeof RARITY[number] }) {
  const camp = CAMP_COLORS[hero.campType] || CAMP_COLORS[0]

  return (
    <Link href={`/heroes/${hero.id}`}
      className="group flex gap-3 p-3 rounded-xl border border-[#1a1c22] bg-[#0e1018] hover:bg-[#14161e] hover:border-[#2a2c34] transition-all relative overflow-hidden">
      {/* Rarity accent bar left edge */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl ${rarity.borderColor} bg-current opacity-60`} />

      {/* Portrait */}
      <div className={`w-16 h-16 rounded-xl border-2 ${rarity.frameBorder} bg-gradient-to-br ${rarity.bgGrad} flex-shrink-0 overflow-hidden relative`}>
        <div className="absolute inset-[3px] rounded-lg overflow-hidden">
          <GameImage
            src={hero.heroIcon ? `/images/heroes/${hero.heroIcon}.png` : ''}
            alt={hero.name}
            fallback="⚔️"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="text-[15px] font-bold text-[#e8e4d8] tracking-wide group-hover:text-[#f0ecd8] transition-colors truncate"
          style={{ fontFamily: "'Rajdhani', sans-serif" }}>
          {hero.name}
        </div>

        {/* Role + type pills */}
        <div className="flex gap-1 mt-0.5 mb-1">
          <span className={`text-[10px] font-semibold px-1.5 py-px rounded ${camp.bg} ${camp.text} border ${camp.border} flex items-center gap-1`}>
            {CAMP_ICON[hero.campType] && <img src={CAMP_ICON[hero.campType]} alt="" className="h-3 w-auto" />}
            {CAMP_NAMES[hero.campType]}
          </span>
          <span className="text-[10px] font-semibold px-1.5 py-px rounded bg-white/[0.04] text-[#7a7868] border border-white/[0.06] flex items-center gap-1">
            {ARMY_ICON[hero.armyType] && <img src={ARMY_ICON[hero.armyType]} alt="" className="h-3 w-auto" />}
            {ARMY_NAMES[hero.armyType]}
          </span>
        </div>

        {/* Might */}
        <div className="flex items-center gap-1">
          <img src="/images/icons/ico_zhanli_60.png" alt="" className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold text-[#c9a44e] tabular-nums">{formatMight(hero.maxAbility)}</span>
          <span className="text-[9px] text-[#5a5848] ml-0.5">might</span>
        </div>
      </div>
    </Link>
  )
}
