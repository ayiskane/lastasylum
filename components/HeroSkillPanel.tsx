'use client'

import { useState, useMemo } from 'react'
import GameImage from './GameImage'

const SLOT_LABELS: Record<number, string> = {
  0: 'Auto Atk', 1: 'Auto Atk', 2: 'Ultimate', 3: 'Skill', 4: 'Passive', 5: 'Support',
  6: 'Passive 2', 7: 'Passive 3', 8: 'Passive 4',
}

interface SkillLevel {
  star: number; unlockStar: number; power: string; param1: string; description: string
  params?: Record<string, string>
}

interface SkillGroupData {
  slot: number; name: string; typeLabel: string; icon: string; iconSrc: string
  description: string; levels: SkillLevel[]
}

function evalParam(expr: string, n1: number): number | null {
  if (!expr) return null
  try {
    // Safe eval: only allow math operations and n1
    const sanitized = expr.replace(/[^0-9n+\-*/.() ]/g, '')
    const withVal = sanitized.replace(/n1/g, String(n1))
    // eslint-disable-next-line no-eval
    const result = Function('"use strict"; return (' + withVal + ')')()
    return typeof result === 'number' && isFinite(result) ? result : null
  } catch {
    return null
  }
}

function formatValue(val: number, expr?: string): string {
  // All skill values in this game are percentages
  // Formulas with *100 are pre-multiplied (e.g. 0.83*100 = 83%)
  // Formulas without *100 are already the % value (e.g. 8 = 8%)
  return `${val.toFixed(1)}%`
}

function insertParams(desc: string, params: Record<string, string>, n1: number): string {
  let result = desc
  // Replace {0}, {1}, {2} etc with computed values
  for (let i = 0; i <= 5; i++) {
    const paramKey = i === 0 ? 'param1' : `param${i + 1}`
    const expr = params[paramKey]
    if (expr) {
      const val = evalParam(expr, n1)
      if (val !== null) {
        result = result.replace(`{${i}}`, formatValue(val, expr))
      }
    }
  }
  // Also replace standalone X
  const param1 = params['param1']
  if (param1) {
    const val = evalParam(param1, n1)
    if (val !== null) {
      result = result.replace(/\bX\b/, formatValue(val, param1))
    }
  }
  // Clean up any remaining unreplaced {N} placeholders
  result = result.replace(/\{\d+\}/g, 'X')
  return result
}

export default function HeroSkillPanel({ skills }: { skills: SkillGroupData[] }) {
  const [selected, setSelected] = useState(0)
  const [skillLevel, setSkillLevel] = useState(1)

  if (!skills.length) {
    return (
      <section className="bg-asylum-surface border border-asylum-border rounded-xl p-5">
        <h2 className="font-display text-lg text-asylum-accent tracking-wide mb-4">SKILLS</h2>
        <p className="text-asylum-muted text-sm">No skill data available</p>
      </section>
    )
  }

  const active = skills[selected] || skills[0]

  // Compute the description with current skill level
  // Use params from the first level that has a description, merged with level 0
  const descLevel = active.levels.find((l: any) => l.description) || active.levels[0]
  const baseParams = descLevel?.params || { param1: descLevel?.param1 || '' }
  // Override with params from the currently selected skill level tier if available
  const activeParams = active.levels[0]?.params 
    ? { ...baseParams, ...active.levels[0].params }
    : baseParams
  const computedDesc = useMemo(() => {
    if (!active.description) return ''
    return insertParams(active.description, activeParams, skillLevel)
  }, [active.description, JSON.stringify(activeParams), skillLevel])

  // Check if this skill has any computable params
  const hasFormula = Object.values(activeParams).some(v => v && v.includes('n1'))

  return (
    <section className="bg-asylum-surface border border-asylum-border rounded-xl overflow-hidden">
      <div className="p-5 pb-3 flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-display text-lg text-asylum-accent tracking-wide">SKILLS</h2>
        {/* Level slider */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-asylum-muted uppercase tracking-wider">Skill Lv</label>
          <input
            type="range"
            min={1}
            max={50}
            value={skillLevel}
            onChange={e => setSkillLevel(Number(e.target.value))}
            className="w-28 accent-asylum-accent"
          />
          <span className="text-sm font-mono text-asylum-accent font-semibold w-6 text-right">{skillLevel}</span>
        </div>
      </div>

      <div className="flex max-md:flex-col">
        {/* Skill icon rail */}
        <div className="shrink-0 flex flex-col max-md:flex-row border-r max-md:border-r-0 max-md:border-b border-asylum-border bg-asylum-bg/30">
          {skills.map((skill, i) => (
            <button
              key={skill.slot}
              onClick={() => setSelected(i)}
              className={`
                flex flex-col items-center gap-1 px-3 py-3 transition-all relative
                ${i === selected ? 'bg-asylum-accent/5' : 'hover:bg-asylum-bg/50'}
              `}
            >
              {i === selected && (
                <div className="absolute left-0 max-md:left-auto max-md:bottom-0 top-1 max-md:top-auto bottom-1 max-md:left-1 max-md:right-1 w-0.5 max-md:w-auto max-md:h-0.5 bg-asylum-accent rounded-r max-md:rounded-b max-md:rounded-r-none" />
              )}
              <div className={`
                w-12 h-12 rounded-lg overflow-hidden border-2 transition-all
                ${i === selected
                  ? 'border-asylum-accent shadow-lg shadow-asylum-accent/20'
                  : 'border-asylum-border/50 opacity-50 hover:opacity-80'}
              `}>
                <GameImage src={skill.iconSrc} alt={skill.name} fallback="⚡" className="w-full h-full" />
              </div>
              <span className={`
                text-[9px] uppercase tracking-wider font-semibold text-center leading-tight w-14
                ${i === selected ? 'text-asylum-accent' : 'text-asylum-muted'}
              `}>
                {SLOT_LABELS[skill.slot] || `Slot ${skill.slot}`}
              </span>
            </button>
          ))}
        </div>

        {/* Detail panel */}
        <div className="flex-1 p-5 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-lg font-bold text-asylum-text">{active.name}</span>
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-asylum-accent/10 text-asylum-accent border border-asylum-accent/20 font-semibold">
              {active.typeLabel}
            </span>
          </div>

          {/* Description with computed values */}
          {(computedDesc || active.description) && (
            <p className="text-sm text-asylum-muted leading-relaxed mb-4">{computedDesc || active.description}</p>
          )}

          {/* Live computed param values */}
          {hasFormula && (
            <div className="bg-asylum-bg/60 border border-asylum-accent/20 rounded-lg px-4 py-3 mb-4">
              <div className="text-[10px] uppercase tracking-wider text-asylum-accent font-semibold mb-2">
                Values at skill level {skillLevel}
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-1">
                {Object.entries(activeParams).map(([key, expr]) => {
                  if (!expr || !expr.includes('n1')) return null
                  const val = evalParam(expr, skillLevel)
                  if (val === null) return null
                  const label = key === 'param1' ? 'DMG / Effect' : key.replace('param', 'Param ')
                  return (
                    <div key={key} className="text-xs">
                      <span className="text-asylum-muted">{label}: </span>
                      <span className="text-asylum-text font-mono font-semibold">{formatValue(val)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Level breakdown */}
          {active.levels.length > 0 && (
            <div className="border-t border-asylum-border/30 pt-3">
              <div className="text-[10px] uppercase tracking-wider text-asylum-muted mb-2 font-semibold">
                {active.levels.length > 1 ? 'Star upgrades' : 'Details'}
              </div>
              <div className="space-y-1.5">
                {[...active.levels].sort((a, b) => (a.star || 0) - (b.star || 0)).map((lv, i) => {
                  const lvParams = lv.params || { param1: lv.param1 }
                  const lvParam1Val = lvParams.param1 ? evalParam(lvParams.param1, skillLevel) : null

                  return (
                    <div key={i} className="bg-asylum-bg/50 rounded-lg px-3 py-2 text-xs">
                      {/* Row 1: Stars + Effect */}
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="shrink-0">
                          {lv.star > 0 ? (
                            <span className="text-asylum-accent">{'★'.repeat(Math.min(lv.star, 5))}</span>
                          ) : (
                            <span className="text-asylum-muted font-semibold bg-asylum-surface px-2 py-0.5 rounded text-[10px]">BASE</span>
                          )}
                        </div>
                        {lvParam1Val !== null && (
                          <span className="text-asylum-muted">Effect: <span className="text-asylum-accent font-mono font-semibold">{formatValue(lvParam1Val, lvParams.param1)}</span></span>
                        )}
                      </div>
                      {/* Row 2: Unlock + Power */}
                      <div className="flex items-center justify-between text-[11px]">
                        {lv.unlockStar > 0 ? (
                          <span className="text-asylum-hint">Unlock at <span className="text-asylum-muted font-semibold">{lv.unlockStar}★</span></span>
                        ) : <span />}
                        {lv.power ? (
                          <span className="text-asylum-hint">Power: <span className="text-asylum-muted font-mono">{
                            lv.power.includes('n1')
                              ? (() => { const v = evalParam(lv.power, skillLevel); return v !== null ? Math.round(v).toLocaleString() : lv.power })()
                              : lv.power
                          }</span></span>
                        ) : <span />}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
