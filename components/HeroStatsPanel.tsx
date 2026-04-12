'use client'

import { useState } from 'react'

interface StatsData {
  maxLevel: number
  maxStar: number
  attackCd: number
  levelBenefitName: string
  // Pre-computed stats for every level/star combo would be too large.
  // Instead pass the formulas and compute client-side.
  levelEntries: { level: number; hp: number; atk: number; def: number; cmd: number }[]
  starEntries: { star: number; hp: number; atk: number; def: number }[]
  levelRatios: { hp: number; atk: number; def: number }
  starRatios: { hp: number; atk: number; def: number }
  levelBenefitPerLevel: number  // % per level
  levelBenefitType: number | null
}

export default function HeroStatsPanel({ data }: { data: StatsData }) {
  const minLevel = data.levelEntries.length > 0 ? data.levelEntries[0].level : 1
  const maxLevel = data.levelEntries.length > 0 ? data.levelEntries[data.levelEntries.length - 1].level : data.maxLevel
  const [level, setLevel] = useState(maxLevel)
  const [star, setStar] = useState(data.maxStar)

  // Find the closest level entry
  const le = data.levelEntries.find(e => e.level === level)
    || data.levelEntries.reduce((prev, curr) =>
      Math.abs(curr.level - level) < Math.abs(prev.level - level) ? curr : prev,
      data.levelEntries[0] || { level: 1, hp: 0, atk: 0, def: 0, cmd: 0 })
  // Find the star entry
  const se = data.starEntries.find(e => e.star === star)
    || data.starEntries.reduce((prev, curr) =>
      Math.abs(curr.star - star) < Math.abs(prev.star - star) ? curr : prev,
      data.starEntries[0] || { star: 0, hp: 0, atk: 0, def: 0 })

  // Compute stats: base × ratio (level) + base × ratio (star)
  const hp = le && se ? Math.round((le.hp || 0) * data.levelRatios.hp + (se.hp || 0) * data.starRatios.hp) : 0
  const atk = le && se ? Math.round((le.atk || 0) * data.levelRatios.atk + (se.atk || 0) * data.starRatios.atk) : 0
  const def = le && se ? Math.round((le.def || 0) * data.levelRatios.def + (se.def || 0) * data.starRatios.def) : 0
  const cmd = le?.cmd || 0

  // Level benefit
  const lbTotal = data.levelBenefitPerLevel * level

  return (
    <div>
      {/* Sliders */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] text-[#6a6858] uppercase tracking-wider font-semibold">Level</label>
            <span className="text-sm font-bold text-[#e8e4d8] font-mono">{level}</span>
          </div>
          <input type="range" min={minLevel} max={maxLevel} value={level}
            onChange={e => setLevel(Number(e.target.value))}
            className="w-full h-1.5 bg-[#1a1c22] rounded-lg appearance-none cursor-pointer accent-[#c9a44e]" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] text-[#6a6858] uppercase tracking-wider font-semibold">Stars</label>
            <span className="text-sm font-bold text-[#e8e4d8] font-mono">★{star}</span>
          </div>
          <input type="range" min={0} max={data.maxStar} value={star}
            onChange={e => setStar(Number(e.target.value))}
            className="w-full h-1.5 bg-[#1a1c22] rounded-lg appearance-none cursor-pointer accent-[#c9a44e]" />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
        <StatCard label="ATK" value={atk} />
        <StatCard label="HP" value={hp} />
        <StatCard label="DEF" value={def} />
        <StatCard label="CMD" value={cmd} />
        <StatCard label="ATK SPD" value={data.attackCd} suffix="ms" />
      </div>

      {/* Level benefit */}
      {data.levelBenefitName && (
        <div className="bg-[#0e1018] border border-[#1a1c22] rounded-lg px-3 py-2 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#8a8878]">{data.levelBenefitName}</span>
            <span className="text-sm font-bold text-[#70d890] font-mono">+{(lbTotal * 100).toFixed(1)}%</span>
          </div>
          <div className="text-[9px] text-[#4a4838] mt-0.5">
            {(data.levelBenefitPerLevel * 100).toFixed(2)}% per level × {level} levels
          </div>
        </div>
      )}

      {/* Growth coefficients */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[#0e1018] border border-[#1a1c22] rounded-lg px-3 py-2 text-center">
          <div className="text-[9px] text-[#4a4838] uppercase tracking-wider mb-0.5">HP Growth</div>
          <div className="text-sm font-bold text-[#e8e4d8] font-mono">×{data.levelRatios.hp.toFixed(2)}</div>
        </div>
        <div className="bg-[#0e1018] border border-[#1a1c22] rounded-lg px-3 py-2 text-center">
          <div className="text-[9px] text-[#4a4838] uppercase tracking-wider mb-0.5">ATK Growth</div>
          <div className="text-sm font-bold text-[#e8e4d8] font-mono">×{data.levelRatios.atk.toFixed(2)}</div>
        </div>
        <div className="bg-[#0e1018] border border-[#1a1c22] rounded-lg px-3 py-2 text-center">
          <div className="text-[9px] text-[#4a4838] uppercase tracking-wider mb-0.5">DEF Growth</div>
          <div className="text-sm font-bold text-[#e8e4d8] font-mono">×{data.levelRatios.def.toFixed(2)}</div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="bg-[#0e1018] border border-[#1a1c22] rounded-lg px-3 py-2.5 text-center">
      <div className="flex items-center justify-center gap-1 mb-1">
        <span className="text-[9px] text-[#6a6858] uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <div className="text-base font-bold text-[#e8e4d8] font-mono tabular-nums">
        {value.toLocaleString()}{suffix && <span className="text-[10px] text-[#6a6858] ml-0.5">{suffix}</span>}
      </div>
    </div>
  )
}
