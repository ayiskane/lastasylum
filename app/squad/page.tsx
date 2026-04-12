'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

// ── Types ──────────────────────────────────────────────────
interface HeroData {
  id: number; name: string; quality: number; qualityName: string
  campType: number; campName: string; armyType: number; armyName: string
  attackCd: number; heroIcon: string; levelTemplate: number; maxAbility: number
  levelRatio: { Type: number; Value: number }[]
  starRatio: { Type: number; Value: number }[]
  levelBenefit: { Type: number; Value: number }[]
  skills: { slot: number; name: string; icon: string; typeLabel: string; levels: any[] }[]
}

interface EquipmentData {
  id: number; name: string; slot: number; slotName: string
  quality: number; qualityName: string; icon: string
  maxStrengthen: number; maxPromoStage: number
  strengthen: Record<string, { level: number; ability: number; stats: Record<string, number> }>
  promotion: Record<string, { stage: number; level: number; ability: number; stats: Record<string, number> }>
}

interface SlotConfig {
  heroId: number | null
  level: number
  stars: number
  skillLevels: number[]
  equipment: { quality: number; strengthenLv: number; promoStage: number; promoLv: number }[]
}

interface ComputedStats {
  hp: number; atk: number; def: number; cmd: number
  critRate: number; critDmg: number; dmgRate: number; dmgRes: number
  monsterDmg: number; monsterRes: number
  power: number; equipPower: number
  levelBenefitLabel: string; levelBenefitValue: number
}

// ── Stat Computation ───────────────────────────────────────
function computeHeroStats(
  hero: HeroData, slot: SlotConfig,
  heroLevels: any, heroStars: any,
  allEquipment: Record<string, EquipmentData>
): ComputedStats {
  const lv = slot.level
  const stars = slot.stars
  const template = hero.levelTemplate || 1

  // Get ratio multipliers
  const getRatio = (type: number) => {
    const r = hero.levelRatio?.find((r: any) => r.Type === type)
    return r?.Value || 1.0
  }
  const hpRatio = getRatio(10201)
  const atkRatio = getRatio(10202)
  const defRatio = getRatio(10203)

  // Find level entry
  let baseHp = 0, baseAtk = 0, baseDef = 0, baseCmd = 0
  if (heroLevels) {
    for (const entry of Object.values(heroLevels) as any[]) {
      if (entry.type === template && entry.level === lv) {
        baseHp = (entry.attrs?.['10002'] || 0) * hpRatio
        baseAtk = (entry.attrs?.['10003'] || 0) * atkRatio
        baseDef = (entry.attrs?.['10004'] || 0) * defRatio
        baseCmd = entry.attrs?.['10001'] || 0
        break
      }
    }
    // Fallback: find closest level
    if (baseHp === 0) {
      let closest: any = null, closestDist = Infinity
      for (const entry of Object.values(heroLevels) as any[]) {
        if (entry.type === template) {
          const d = Math.abs(entry.level - lv)
          if (d < closestDist) { closestDist = d; closest = entry }
        }
      }
      if (closest) {
        baseHp = (closest.attrs?.['10002'] || 0) * hpRatio
        baseAtk = (closest.attrs?.['10003'] || 0) * atkRatio
        baseDef = (closest.attrs?.['10004'] || 0) * defRatio
        baseCmd = closest.attrs?.['10001'] || 0
      }
    }
  }

  // Star bonuses
  let starHp = 0, starAtk = 0, starDef = 0
  if (heroStars) {
    for (const entry of Object.values(heroStars) as any[]) {
      const s = entry.star ?? entry.level ?? 0
      if (s <= stars) {
        starHp += (entry.attrs?.['10002'] || 0) * hpRatio
        starAtk += (entry.attrs?.['10003'] || 0) * atkRatio
        starDef += (entry.attrs?.['10004'] || 0) * defRatio
      }
    }
  }

  // Equipment stats
  let eqHp = 0, eqAtk = 0, eqDef = 0
  let eqCritRate = 0, eqCritDmg = 0, eqDmgRate = 0, eqDmgRes = 0
  let eqMonsterDmg = 0, eqMonsterRes = 0, eqHpPct = 0
  let equipPower = 0

  const SLOT_EQUIP_MAP: Record<number, Record<number, string>> = {
    0: { 2: '100201', 3: '100301', 4: '100401', 5: '100501' }, // Weapon
    1: { 2: '100202', 3: '100302', 4: '100402', 5: '100502' }, // Armor
    2: { 2: '100203', 3: '100303', 4: '100403', 5: '100503' }, // Gauntlets
    3: { 2: '100204', 3: '100304', 4: '100404', 5: '100504' }, // Boots
  }

  for (let s = 0; s < 4; s++) {
    const ec = slot.equipment[s]
    if (!ec || ec.quality < 2) continue
    const eqId = SLOT_EQUIP_MAP[s]?.[ec.quality]
    if (!eqId || !allEquipment[eqId]) continue
    const eq = allEquipment[eqId]

    // Strengthen stats
    const strEntry = eq.strengthen[String(ec.strengthenLv)]
    if (strEntry) {
      const st = strEntry.stats
      eqHp += st['10002'] || 0
      eqAtk += st['10003'] || 0
      eqDef += st['10004'] || 0
      eqHpPct += st['10005'] || 0
      eqCritRate += st['10006'] || 0
      eqCritDmg += st['10007'] || 0
      eqMonsterDmg += st['10026'] || 0
      eqMonsterRes += st['10027'] || 0
      eqDmgRate += st['10030'] || 0
      eqDmgRes += st['10037'] || 0
      equipPower += strEntry.ability
    }

    // Promotion stats
    if (ec.quality === 5 && ec.promoStage > 0) {
      const promoKey = `${ec.promoStage}_${ec.promoLv}`
      const promoEntry = eq.promotion[promoKey]
      if (promoEntry) {
        const pt = promoEntry.stats
        eqHp += pt['10002'] || 0
        eqAtk += pt['10003'] || 0
        eqDef += pt['10004'] || 0
        eqHpPct += pt['10005'] || 0
        eqCritRate += pt['10006'] || 0
        eqCritDmg += pt['10007'] || 0
        eqDmgRate += pt['10030'] || 0
        eqDmgRes += pt['10037'] || 0
        equipPower += promoEntry.ability
      }
    }
  }

  // Level benefit
  let lvBenefitLabel = ''
  let lvBenefitValue = 0
  if (hero.levelBenefit?.[0]) {
    const lb = hero.levelBenefit[0]
    lvBenefitValue = lb.Value * lv
    const BENEFIT_NAMES: Record<number, string> = {
      10008: 'Ranger HP↑', 10009: 'Ranger ATK↑', 10010: 'Ranger DEF↑',
      10011: 'Warlock HP↑', 10012: 'Warlock ATK↑', 10013: 'Warlock DEF↑',
      10014: 'Warrior HP↑', 10015: 'Warrior ATK↑', 10016: 'Warrior DEF↑',
    }
    lvBenefitLabel = BENEFIT_NAMES[lb.Type] || `Stat ${lb.Type}`
  }

  const totalHp = (baseHp + starHp + eqHp) * (1 + eqHpPct)
  const totalAtk = baseAtk + starAtk + eqAtk
  const totalDef = baseDef + starDef + eqDef
  const totalCmd = baseCmd

  return {
    hp: Math.round(totalHp),
    atk: Math.round(totalAtk),
    def: Math.round(totalDef),
    cmd: Math.round(totalCmd),
    critRate: eqCritRate,
    critDmg: eqCritDmg,
    dmgRate: eqDmgRate,
    dmgRes: eqDmgRes,
    monsterDmg: eqMonsterDmg,
    monsterRes: eqMonsterRes,
    power: Math.round(totalHp + totalAtk * 5 + totalDef * 3 + totalCmd * 2 + equipPower),
    equipPower: Math.round(equipPower),
    levelBenefitLabel: lvBenefitLabel,
    levelBenefitValue: lvBenefitValue,
  }
}

// ── Camp synergy ───────────────────────────────────────────
function getSquadSynergy(slots: SlotConfig[], heroes: HeroData[]): { bonus: number; label: string; count: number } {
  const campCounts: Record<number, number> = {}
  for (const s of slots) {
    if (s.heroId === null) continue
    const h = heroes.find(h => h.id === s.heroId)
    if (!h) continue
    campCounts[h.campType] = (campCounts[h.campType] || 0) + 1
  }
  let bestBonus = 0, bestLabel = 'No synergy', bestCount = 0
  for (const [camp, count] of Object.entries(campCounts)) {
    if (count >= 5) { bestBonus = 0.20; bestLabel = '5 same class (+20%)'; bestCount = count }
    else if (count >= 4 && bestBonus < 0.15) { bestBonus = 0.15; bestLabel = '4 same class (+15%)'; bestCount = count }
    else if (count >= 2 && bestBonus < 0.10) { bestBonus = 0.10; bestLabel = `${count} same class (+10%)`; bestCount = count }
  }
  return { bonus: bestBonus, label: bestLabel, count: bestCount }
}

// ── Format helpers ─────────────────────────────────────────
const fmt = (n: number) => {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return n.toLocaleString()
}
const pct = (n: number) => (n * 100).toFixed(1) + '%'

// ── Quality colors ─────────────────────────────────────────
const Q_COLORS: Record<number, { bg: string; border: string; text: string }> = {
  5: { bg: 'bg-amber-900/30', border: 'border-amber-600', text: 'text-amber-400' },
  4: { bg: 'bg-purple-900/30', border: 'border-purple-600', text: 'text-purple-400' },
  0: { bg: 'bg-blue-900/30', border: 'border-blue-600', text: 'text-blue-400' },
}

// ── Main Component ─────────────────────────────────────────
export default function SquadCalculatorPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [slots, setSlots] = useState<SlotConfig[]>(
    Array.from({ length: 5 }, () => ({
      heroId: null, level: 150, stars: 50, skillLevels: [0, 0, 0, 0, 0],
      equipment: Array.from({ length: 4 }, () => ({
        quality: 5, strengthenLv: 40, promoStage: 0, promoLv: 0
      }))
    }))
  )
  const [activeSlot, setActiveSlot] = useState(0)
  const [showHeroPicker, setShowHeroPicker] = useState(false)
  const [activeEquipSlot, setActiveEquipSlot] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/squad-data').then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [])

  const updateSlot = useCallback((idx: number, patch: Partial<SlotConfig>) => {
    setSlots(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s))
  }, [])

  const updateEquip = useCallback((slotIdx: number, equipIdx: number, patch: any) => {
    setSlots(prev => prev.map((s, i) => {
      if (i !== slotIdx) return s
      const eq = [...s.equipment]
      eq[equipIdx] = { ...eq[equipIdx], ...patch }
      return { ...s, equipment: eq }
    }))
  }, [])

  // Compute all stats
  const computedStats = useMemo(() => {
    if (!data) return []
    return slots.map(s => {
      if (s.heroId === null) return null
      const hero = data.heroes.find((h: HeroData) => h.id === s.heroId)
      if (!hero) return null
      return computeHeroStats(hero, s, data.heroLevels, data.heroStars, data.equipment)
    })
  }, [slots, data])

  const synergy = useMemo(() => {
    if (!data) return { bonus: 0, label: 'No synergy', count: 0 }
    return getSquadSynergy(slots, data.heroes)
  }, [slots, data])

  const totalPower = useMemo(() => {
    return computedStats.reduce((sum, s) => sum + (s?.power || 0), 0)
  }, [computedStats])

  // Selected heroes (for preventing duplicates)
  const selectedIds = slots.map(s => s.heroId).filter(Boolean)

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-zinc-400 text-lg">Loading squad data...</div>
    </div>
  )

  const activeHero = slots[activeSlot]?.heroId
    ? data.heroes.find((h: HeroData) => h.id === slots[activeSlot].heroId)
    : null
  const activeStats = computedStats[activeSlot]
  const slot = slots[activeSlot]

  const EQUIP_SLOTS = ['Weapon', 'Armor', 'Gauntlets', 'Boots']
  const EQUIP_ICONS = ['⚔️', '🛡️', '🧤', '👢']

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Squad Calculator
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Select 5 heroes, configure levels & equipment, and see computed stats
          </p>
        </div>
        <div className="text-right">
          <div className="text-zinc-500 text-xs uppercase tracking-wider">Total Squad Power</div>
          <div className="text-3xl font-bold text-amber-400" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            {fmt(totalPower)}
          </div>
        </div>
      </div>

      {/* Squad synergy bar */}
      <div className={`rounded-lg px-4 py-3 flex items-center justify-between ${
        synergy.bonus > 0 ? 'bg-emerald-900/20 border border-emerald-700/50' : 'bg-zinc-800/50 border border-zinc-700/30'
      }`}>
        <div className="flex items-center gap-3">
          <span className="text-lg">🔗</span>
          <span className="text-zinc-300 font-medium">{synergy.label}</span>
        </div>
        {synergy.bonus > 0 && (
          <span className="text-emerald-400 font-bold">+{(synergy.bonus * 100).toFixed(0)}% all stats</span>
        )}
      </div>

      {/* 5 Hero Slots */}
      <div className="grid grid-cols-5 gap-3">
        {slots.map((s, i) => {
          const hero = s.heroId ? data.heroes.find((h: HeroData) => h.id === s.heroId) : null
          const stats = computedStats[i]
          const qc = hero ? Q_COLORS[hero.quality] || Q_COLORS[0] : null
          const isActive = i === activeSlot

          return (
            <button
              key={i}
              onClick={() => setActiveSlot(i)}
              className={`relative rounded-xl p-3 transition-all text-left ${
                isActive
                  ? 'ring-2 ring-amber-500 bg-zinc-800/80'
                  : 'bg-zinc-900/60 hover:bg-zinc-800/60 border border-zinc-700/30'
              }`}
            >
              <div className="text-xs text-zinc-500 mb-2">Slot {i + 1}</div>
              {hero ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-10 h-10 rounded-lg overflow-hidden ${qc?.bg} ${qc?.border} border`}>
                      <img
                        src={`/images/heroes/${hero.heroIcon}.png`}
                        alt={hero.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className={`text-sm font-bold truncate ${qc?.text}`}>{hero.name}</div>
                      <div className="text-[10px] text-zinc-500">
                        Lv{s.level} ★{s.stars}
                      </div>
                    </div>
                  </div>
                  {stats && (
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px]">
                      <div><span className="text-zinc-500">ATK</span> <span className="text-red-400">{fmt(stats.atk)}</span></div>
                      <div><span className="text-zinc-500">HP</span> <span className="text-green-400">{fmt(stats.hp)}</span></div>
                      <div><span className="text-zinc-500">DEF</span> <span className="text-blue-400">{fmt(stats.def)}</span></div>
                      <div><span className="text-zinc-500">PWR</span> <span className="text-amber-400">{fmt(stats.power)}</span></div>
                    </div>
                  )}
                </>
              ) : (
                <div
                  className="flex items-center justify-center h-16 border-2 border-dashed border-zinc-700 rounded-lg text-zinc-600 hover:border-zinc-500 hover:text-zinc-400 transition-colors cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); setActiveSlot(i); setShowHeroPicker(true) }}
                >
                  <span className="text-2xl">+</span>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Active Hero Configuration */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Hero config */}
        <div className="lg:col-span-2 space-y-4">
          {/* Hero selector / picker */}
          {showHeroPicker || !activeHero ? (
            <div className="bg-zinc-900/60 rounded-xl border border-zinc-700/30 p-4">
              <h3 className="text-zinc-300 font-medium mb-3">Select Hero for Slot {activeSlot + 1}</h3>
              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                {data.heroes
                  .sort((a: HeroData, b: HeroData) => b.quality - a.quality || a.name.localeCompare(b.name))
                  .map((h: HeroData) => {
                    const taken = selectedIds.includes(h.id) && slots[activeSlot].heroId !== h.id
                    const qc = Q_COLORS[h.quality] || Q_COLORS[0]
                    return (
                      <button
                        key={h.id}
                        disabled={taken}
                        onClick={() => {
                          updateSlot(activeSlot, { heroId: h.id })
                          setShowHeroPicker(false)
                        }}
                        className={`relative rounded-lg overflow-hidden border transition-all ${
                          taken
                            ? 'opacity-30 cursor-not-allowed border-zinc-700'
                            : `${qc.border} hover:ring-2 hover:ring-amber-500 cursor-pointer`
                        }`}
                        title={h.name}
                      >
                        <div className={`aspect-square ${qc.bg}`}>
                          <img
                            src={`/images/heroes/${h.heroIcon}.png`}
                            alt={h.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = '' }}
                          />
                        </div>
                        <div className="text-[9px] text-center truncate px-0.5 py-0.5 bg-zinc-900/80">
                          {h.name}
                        </div>
                      </button>
                    )
                  })}
              </div>
            </div>
          ) : (
            <>
              {/* Hero header */}
              <div className="bg-zinc-900/60 rounded-xl border border-zinc-700/30 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-14 h-14 rounded-xl overflow-hidden border-2 ${Q_COLORS[activeHero.quality]?.border}`}>
                      <img
                        src={`/images/heroes/${activeHero.heroIcon}.png`}
                        alt={activeHero.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    </div>
                    <div>
                      <h2 className={`text-xl font-bold ${Q_COLORS[activeHero.quality]?.text}`}
                        style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                        {activeHero.name}
                      </h2>
                      <div className="flex gap-2 text-xs text-zinc-500">
                        <span>{activeHero.qualityName}</span>
                        <span>•</span>
                        <span>{activeHero.campName}</span>
                        <span>•</span>
                        <span>{activeHero.armyName}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowHeroPicker(true)}
                    className="text-xs text-zinc-500 hover:text-zinc-300 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
                  >
                    Change
                  </button>
                </div>

                {/* Level & Stars */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">
                      Level: <span className="text-zinc-300 font-mono">{slot.level}</span>
                    </label>
                    <input
                      type="range" min={1} max={150} value={slot.level}
                      onChange={(e) => updateSlot(activeSlot, { level: Number(e.target.value) })}
                      className="w-full accent-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">
                      Stars: <span className="text-zinc-300 font-mono">{slot.stars}★</span>
                    </label>
                    <input
                      type="range" min={0} max={50} value={slot.stars}
                      onChange={(e) => updateSlot(activeSlot, { stars: Number(e.target.value) })}
                      className="w-full accent-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Equipment */}
              <div className="bg-zinc-900/60 rounded-xl border border-zinc-700/30 p-4">
                <h3 className="text-zinc-300 font-medium mb-3 text-sm">Equipment</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {EQUIP_SLOTS.map((name, i) => {
                    const ec = slot.equipment[i]
                    const eqQc = Q_COLORS[ec.quality] || Q_COLORS[0]
                    const maxStr: Record<number, number> = { 2: 0, 3: 15, 4: 30, 5: 40 }
                    return (
                      <div
                        key={i}
                        className={`rounded-lg border p-3 ${
                          activeEquipSlot === i ? 'ring-1 ring-amber-500 ' + eqQc.border : 'border-zinc-700/50'
                        } ${eqQc.bg} cursor-pointer transition-all`}
                        onClick={() => setActiveEquipSlot(activeEquipSlot === i ? null : i)}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{EQUIP_ICONS[i]}</span>
                          <div>
                            <div className={`text-xs font-bold ${eqQc.text}`}>
                              {{ 2: 'R', 3: 'SR', 4: 'SSR', 5: 'UR' }[ec.quality]} {name}
                            </div>
                            <div className="text-[10px] text-zinc-500">
                              Lv{ec.strengthenLv}
                              {ec.quality === 5 && ec.promoStage > 0 && ` P${ec.promoStage}`}
                            </div>
                          </div>
                        </div>

                        {activeEquipSlot === i && (
                          <div className="space-y-2 mt-3 border-t border-zinc-700/50 pt-3">
                            <div>
                              <label className="text-[10px] text-zinc-500 block mb-1">Quality</label>
                              <div className="flex gap-1">
                                {[2, 3, 4, 5].map(q => (
                                  <button
                                    key={q}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      updateEquip(activeSlot, i, {
                                        quality: q,
                                        strengthenLv: Math.min(ec.strengthenLv, maxStr[q]),
                                        promoStage: q < 5 ? 0 : ec.promoStage,
                                        promoLv: q < 5 ? 0 : ec.promoLv,
                                      })
                                    }}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                                      ec.quality === q
                                        ? Q_COLORS[q]?.text + ' bg-zinc-700'
                                        : 'text-zinc-500 hover:text-zinc-300'
                                    }`}
                                  >
                                    {{ 2: 'R', 3: 'SR', 4: 'SSR', 5: 'UR' }[q]}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="text-[10px] text-zinc-500 block mb-1">
                                Strengthen: <span className="text-zinc-300">{ec.strengthenLv}</span>/{maxStr[ec.quality]}
                              </label>
                              <input
                                type="range" min={0} max={maxStr[ec.quality]}
                                value={Math.min(ec.strengthenLv, maxStr[ec.quality])}
                                onChange={(e) => {
                                  e.stopPropagation()
                                  updateEquip(activeSlot, i, { strengthenLv: Number(e.target.value) })
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full accent-amber-500"
                              />
                            </div>
                            {ec.quality === 5 && (
                              <div>
                                <label className="text-[10px] text-zinc-500 block mb-1">
                                  Promotion Stage: <span className="text-zinc-300">{ec.promoStage}</span>/4
                                </label>
                                <input
                                  type="range" min={0} max={4}
                                  value={ec.promoStage}
                                  onChange={(e) => {
                                    e.stopPropagation()
                                    updateEquip(activeSlot, i, { promoStage: Number(e.target.value) })
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full accent-purple-500"
                                />
                                {ec.promoStage > 0 && (
                                  <>
                                    <label className="text-[10px] text-zinc-500 block mb-1 mt-1">
                                      Promo Level: <span className="text-zinc-300">{ec.promoLv}</span>/5
                                    </label>
                                    <input
                                      type="range" min={0} max={5}
                                      value={ec.promoLv}
                                      onChange={(e) => {
                                        e.stopPropagation()
                                        updateEquip(activeSlot, i, { promoLv: Number(e.target.value) })
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-full accent-purple-500"
                                    />
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right: Stats panel */}
        <div className="space-y-4">
          {activeHero && activeStats ? (
            <>
              {/* Core stats */}
              <div className="bg-zinc-900/60 rounded-xl border border-zinc-700/30 p-4">
                <h3 className="text-zinc-400 text-xs uppercase tracking-wider mb-3">Hero Stats</h3>
                <div className="space-y-2">
                  <StatRow label="ATK" value={fmt(activeStats.atk)} color="text-red-400" />
                  <StatRow label="HP" value={fmt(activeStats.hp)} color="text-green-400" />
                  <StatRow label="DEF" value={fmt(activeStats.def)} color="text-blue-400" />
                  <StatRow label="CMD" value={fmt(activeStats.cmd)} color="text-yellow-400" />
                  <div className="border-t border-zinc-700/50 my-2" />
                  <StatRow label="Crit Rate" value={pct(activeStats.critRate)} color="text-orange-400" />
                  <StatRow label="Crit DMG" value={pct(activeStats.critDmg)} color="text-orange-400" />
                  <StatRow label="DMG Rate" value={pct(activeStats.dmgRate)} color="text-rose-400" />
                  <StatRow label="DMG RES" value={pct(activeStats.dmgRes)} color="text-cyan-400" />
                  <StatRow label="Monster DMG" value={pct(activeStats.monsterDmg)} color="text-lime-400" />
                  <div className="border-t border-zinc-700/50 my-2" />
                  <StatRow label="Atk Speed" value={`${activeHero.attackCd}ms`} color="text-zinc-300" />
                  {activeStats.levelBenefitLabel && (
                    <StatRow
                      label={activeStats.levelBenefitLabel}
                      value={pct(activeStats.levelBenefitValue)}
                      color="text-emerald-400"
                    />
                  )}
                  <div className="border-t border-zinc-700/50 my-2" />
                  <StatRow label="Hero Power" value={fmt(activeStats.power)} color="text-amber-400" />
                  <StatRow label="Equip Power" value={fmt(activeStats.equipPower)} color="text-zinc-400" />
                </div>
              </div>

              {/* Squad summary */}
              <div className="bg-zinc-900/60 rounded-xl border border-zinc-700/30 p-4">
                <h3 className="text-zinc-400 text-xs uppercase tracking-wider mb-3">Squad Summary</h3>
                <div className="space-y-2">
                  <StatRow label="Total Power" value={fmt(totalPower)} color="text-amber-400" />
                  <StatRow
                    label="Avg ATK"
                    value={fmt(Math.round(computedStats.reduce((s, c) => s + (c?.atk || 0), 0) / Math.max(1, computedStats.filter(Boolean).length)))}
                    color="text-red-400"
                  />
                  <StatRow
                    label="Avg HP"
                    value={fmt(Math.round(computedStats.reduce((s, c) => s + (c?.hp || 0), 0) / Math.max(1, computedStats.filter(Boolean).length)))}
                    color="text-green-400"
                  />
                  <StatRow
                    label="Active Heroes"
                    value={`${computedStats.filter(Boolean).length}/5`}
                    color="text-zinc-300"
                  />
                  <div className={`mt-3 p-2 rounded-lg text-xs ${
                    synergy.bonus > 0 ? 'bg-emerald-900/20 text-emerald-400' : 'bg-zinc-800/50 text-zinc-500'
                  }`}>
                    🔗 {synergy.label}
                  </div>
                </div>
              </div>

              {/* Optimization tips */}
              <OptimizationTips
                slots={slots}
                computedStats={computedStats}
                heroes={data.heroes}
                synergy={synergy}
              />
            </>
          ) : (
            <div className="bg-zinc-900/60 rounded-xl border border-zinc-700/30 p-8 text-center">
              <div className="text-4xl mb-3">🎯</div>
              <div className="text-zinc-400 text-sm">
                Select a hero for Slot {activeSlot + 1} to see stats
              </div>
            </div>
          )}
        </div>
      </div>

      {/* All heroes comparison table */}
      {computedStats.some(Boolean) && (
        <div className="bg-zinc-900/60 rounded-xl border border-zinc-700/30 p-4 overflow-x-auto">
          <h3 className="text-zinc-400 text-xs uppercase tracking-wider mb-3">Squad Comparison</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-zinc-500 text-xs border-b border-zinc-700/50">
                <th className="text-left py-2 pr-4">Hero</th>
                <th className="text-right px-3">ATK</th>
                <th className="text-right px-3">HP</th>
                <th className="text-right px-3">DEF</th>
                <th className="text-right px-3">CMD</th>
                <th className="text-right px-3">Crit%</th>
                <th className="text-right px-3">DMG Rate</th>
                <th className="text-right px-3">Power</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((s, i) => {
                const hero = s.heroId ? data.heroes.find((h: HeroData) => h.id === s.heroId) : null
                const stats = computedStats[i]
                if (!hero || !stats) return null
                const qc = Q_COLORS[hero.quality] || Q_COLORS[0]
                return (
                  <tr key={i} className={`border-b border-zinc-800/50 ${i === activeSlot ? 'bg-zinc-800/30' : ''}`}>
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-600">{i + 1}</span>
                        <span className={`font-medium ${qc.text}`}>{hero.name}</span>
                        <span className="text-[10px] text-zinc-600">Lv{s.level}</span>
                      </div>
                    </td>
                    <td className="text-right px-3 text-red-400 font-mono text-xs">{fmt(stats.atk)}</td>
                    <td className="text-right px-3 text-green-400 font-mono text-xs">{fmt(stats.hp)}</td>
                    <td className="text-right px-3 text-blue-400 font-mono text-xs">{fmt(stats.def)}</td>
                    <td className="text-right px-3 text-yellow-400 font-mono text-xs">{fmt(stats.cmd)}</td>
                    <td className="text-right px-3 text-orange-400 font-mono text-xs">{pct(stats.critRate)}</td>
                    <td className="text-right px-3 text-rose-400 font-mono text-xs">{pct(stats.dmgRate)}</td>
                    <td className="text-right px-3 text-amber-400 font-bold font-mono text-xs">{fmt(stats.power)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────
function StatRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className={`text-sm font-mono font-medium ${color}`}>{value}</span>
    </div>
  )
}

function OptimizationTips({ slots, computedStats, heroes, synergy }: {
  slots: SlotConfig[]; computedStats: (ComputedStats | null)[]
  heroes: HeroData[]; synergy: { bonus: number; count: number }
}) {
  const tips: string[] = []

  // Check synergy
  const campCounts: Record<number, number> = {}
  const filledSlots = slots.filter(s => s.heroId !== null)
  for (const s of filledSlots) {
    const h = heroes.find((h: HeroData) => h.id === s.heroId)
    if (h) campCounts[h.campType] = (campCounts[h.campType] || 0) + 1
  }
  const maxCampCount = Math.max(0, ...Object.values(campCounts))

  if (filledSlots.length >= 3 && maxCampCount < 4) {
    tips.push('Consider using 4+ heroes of the same class for a 15% stat bonus')
  }
  if (maxCampCount === 4) {
    tips.push('Add one more hero of the same class for the maximum 20% synergy bonus')
  }

  // Check equipment
  for (let i = 0; i < 5; i++) {
    const s = slots[i]
    if (!s.heroId) continue
    const hero = heroes.find((h: HeroData) => h.id === s.heroId)
    for (let e = 0; e < 4; e++) {
      const eq = s.equipment[e]
      if (hero?.quality === 5 && eq.quality < 5) {
        tips.push(`Slot ${i + 1} (${hero?.name}): Upgrade ${['Weapon', 'Armor', 'Gauntlets', 'Boots'][e]} to UR for much higher stats`)
        break
      }
      if (eq.quality === 5 && eq.strengthenLv < 40) {
        tips.push(`Slot ${i + 1}: ${hero?.name}'s equipment can be strengthened further (${eq.strengthenLv}/40)`)
        break
      }
    }
  }

  // Check levels
  for (let i = 0; i < 5; i++) {
    const s = slots[i]
    if (s.heroId && s.level < 150) {
      const hero = heroes.find((h: HeroData) => h.id === s.heroId)
      tips.push(`${hero?.name} is only Lv${s.level} — leveling to 150 significantly boosts all base stats`)
      break
    }
  }

  if (tips.length === 0 && filledSlots.length > 0) {
    tips.push('Your squad looks well-configured!')
  }

  return (
    <div className="bg-zinc-900/60 rounded-xl border border-zinc-700/30 p-4">
      <h3 className="text-zinc-400 text-xs uppercase tracking-wider mb-3">💡 Optimization Tips</h3>
      <div className="space-y-2">
        {tips.slice(0, 4).map((tip, i) => (
          <div key={i} className="text-xs text-zinc-400 flex items-start gap-2">
            <span className="text-amber-500 mt-0.5">▸</span>
            <span>{tip}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
