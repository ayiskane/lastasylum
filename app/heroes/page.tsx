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

// Army type: 0=Support, 1=Tank, 3=Damage
const ARMY_ICON: Record<number, string> = {
  0: '/images/icons/ico_yx_dw3.png',
  1: '/images/icons/ico_yx_dw1.png',
  3: '/images/icons/ico_yx_dw2.png',
}
const ARMY_NAMES: Record<number, string> = {
  0: 'Support', 1: 'Tank', 3: 'Damage',
}

// Rarity label images
const RARITY_LABEL: Record<number, string> = {
  2: '/images/icons/font_pz_2.png',
  3: '/images/icons/font_pz_3.png',
  4: '/images/icons/font_pz_4.png',
  5: '/images/icons/font_pz_5.png',
}

// Quality frame backgrounds (from Zombie_CommonForK3_RGB)
const QUALITY_FRAME: Record<number, string> = {
  1: '/images/items/Icon_item_white.png',
  2: '/images/items/Icon_item_green.png',
  3: '/images/items/Icon_item_blue.png',
  4: '/images/items/Icon_item_purple.png',
  5: '/images/items/Icon_item_yellow.png',
  6: '/images/items/Icon_item_red.png',
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
  const qualityOrder = [6, 5, 4, 3, 2, 0]

  return (
    <div>
      <h1 className="font-display text-4xl text-asylum-accent tracking-wider mb-2">HEROES</h1>
      <p className="text-asylum-muted mb-4">{heroes.length} heroes across all rarity tiers</p>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-asylum-hint uppercase tracking-wider mr-1">Type</span>
          <button onClick={() => setFilterArmy(null)}
            className={`text-[11px] px-2.5 py-1 rounded-lg transition-colors ${
              filterArmy === null ? 'bg-asylum-accent/15 text-asylum-accent border border-asylum-accent/30'
                : 'bg-asylum-surface border border-asylum-border text-asylum-muted hover:text-asylum-text'}`}>All</button>
          {armyTypes.map(t => (
            <button key={t} onClick={() => setFilterArmy(filterArmy === t ? null : t)}
              className={`text-[11px] px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                filterArmy === t ? 'bg-asylum-accent/15 text-asylum-accent border border-asylum-accent/30'
                  : 'bg-asylum-surface border border-asylum-border text-asylum-muted hover:text-asylum-text'}`}>
              {ARMY_ICON[t] && <img src={ARMY_ICON[t]} alt="" className="w-5 h-5" />}
              {ARMY_NAMES[t]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-asylum-hint uppercase tracking-wider mr-1">Role</span>
          <button onClick={() => setFilterCamp(null)}
            className={`text-[11px] px-2.5 py-1 rounded-lg transition-colors ${
              filterCamp === null ? 'bg-asylum-accent/15 text-asylum-accent border border-asylum-accent/30'
                : 'bg-asylum-surface border border-asylum-border text-asylum-muted hover:text-asylum-text'}`}>All</button>
          {campTypes.map(t => (
            <button key={t} onClick={() => setFilterCamp(filterCamp === t ? null : t)}
              className={`text-[11px] px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                filterCamp === t ? 'bg-asylum-accent/15 text-asylum-accent border border-asylum-accent/30'
                  : 'bg-asylum-surface border border-asylum-border text-asylum-muted hover:text-asylum-text'}`}>
              {CAMP_ICON[t] && <img src={CAMP_ICON[t]} alt="" className="w-5 h-5" />}
              {CAMP_NAMES[t]}
            </button>
          ))}
        </div>
      </div>

      {(filterArmy !== null || filterCamp !== null) && (
        <p className="text-xs text-asylum-muted mb-4">
          Showing {filtered.length} of {heroes.length} heroes
          <button onClick={() => { setFilterArmy(null); setFilterCamp(null) }}
            className="ml-2 text-asylum-accent hover:underline">Clear filters</button>
        </p>
      )}

      {qualityOrder.map(q => {
        const list = byQuality[q]
        if (!list?.length) return null
        const rarityImg = RARITY_LABEL[q]
        return (
          <section key={q} className="mb-8">
            <h2 className="font-display text-lg tracking-wide mb-3 flex items-center gap-2">
              {rarityImg ? <img src={rarityImg} alt={list[0]?.qualityName} className="h-6" /> : (
                <span className="text-asylum-accent">{list[0]?.qualityName || `Quality ${q}`}</span>
              )}
              <span className="text-sm text-asylum-muted font-normal">({list.length})</span>
            </h2>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4">
              {list.map(hero => (
                <HeroCard key={hero.id} hero={hero} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function HeroCard({ hero }: { hero: HeroEntry }) {
  const frameSrc = QUALITY_FRAME[hero.quality] || QUALITY_FRAME[3]

  return (
    <Link href={`/heroes/${hero.id}`}
      className="group flex flex-col items-center gap-1.5 transition-transform hover:scale-105">
      {/* Outer wrapper with padding for badges */}
      <div className="relative w-[88px] h-[88px]">
        {/* Quality frame background — the game's actual item frame image */}
        <div className="absolute inset-[6px] rounded-xl overflow-hidden">
          <img src={frameSrc} alt="" className="absolute inset-0 w-full h-full" />
          {/* Hero icon on top of frame */}
          <div className="absolute inset-[4px] rounded-lg overflow-hidden">
            <GameImage
              src={hero.heroIcon ? `/images/heroes/${hero.heroIcon}.png` : ''}
              alt={hero.name}
              fallback="⚔️"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        {/* Army type badge — top right */}
        {ARMY_ICON[hero.armyType] && (
          <img src={ARMY_ICON[hero.armyType]} alt={ARMY_NAMES[hero.armyType]}
            className="absolute top-0 right-0 w-[28px] h-[28px] drop-shadow-lg" />
        )}
        {/* Camp/role badge — bottom left */}
        {CAMP_ICON[hero.campType] && (
          <img src={CAMP_ICON[hero.campType]} alt={CAMP_NAMES[hero.campType]}
            className="absolute bottom-0 left-0 w-[30px] h-[30px] drop-shadow-lg" />
        )}
      </div>
      <span className="text-[11px] font-semibold text-asylum-text text-center leading-tight group-hover:text-asylum-accent transition-colors truncate max-w-[88px]">
        {hero.name}
      </span>
    </Link>
  )
}
