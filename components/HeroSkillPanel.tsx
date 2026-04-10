'use client'

import { useState } from 'react'
import GameImage from './GameImage'

const SLOT_LABELS: Record<number, string> = {
  0: 'Auto Atk', 1: 'Auto Atk', 2: 'Ultimate', 3: 'Skill', 4: 'Passive', 5: 'Support',
  6: 'Passive 2', 7: 'Passive 3', 8: 'Passive 4',
}

interface SkillLevel {
  star: number; unlockStar: number; power: string; param1: string; description: string
}

interface SkillGroupData {
  slot: number; name: string; typeLabel: string; icon: string; iconSrc: string
  description: string; levels: SkillLevel[]
}

export default function HeroSkillPanel({ skills }: { skills: SkillGroupData[] }) {
  const [selected, setSelected] = useState(0)

  if (!skills.length) {
    return (
      <section className="bg-asylum-surface border border-asylum-border rounded-xl p-5">
        <h2 className="font-display text-lg text-asylum-accent tracking-wide mb-4">SKILLS</h2>
        <p className="text-asylum-muted text-sm">No skill data available</p>
      </section>
    )
  }

  const active = skills[selected] || skills[0]

  return (
    <section className="bg-asylum-surface border border-asylum-border rounded-xl overflow-hidden">
      <div className="p-5 pb-3">
        <h2 className="font-display text-lg text-asylum-accent tracking-wide">SKILLS</h2>
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

          {active.description && (
            <p className="text-sm text-asylum-muted leading-relaxed mb-4">{active.description}</p>
          )}

          {active.levels.length > 0 && (
            <div className="border-t border-asylum-border/30 pt-3">
              <div className="text-[10px] uppercase tracking-wider text-asylum-muted mb-2 font-semibold">
                {active.levels.length > 1 ? 'Level upgrades' : 'Details'}
              </div>
              <div className="space-y-1.5">
                {active.levels.map((lv, i) => (
                  <div key={i} className="bg-asylum-bg/50 rounded-lg px-3 py-2.5 flex items-center gap-3 text-xs">
                    <div className="shrink-0 w-16">
                      {lv.star > 0 ? (
                        <span className="text-asylum-accent">{'★'.repeat(Math.min(lv.star, 5))}</span>
                      ) : (
                        <span className="text-asylum-muted font-semibold bg-asylum-surface px-2 py-0.5 rounded text-[10px]">BASE</span>
                      )}
                    </div>
                    <div className="flex-1 flex flex-wrap gap-x-4 gap-y-0.5">
                      {lv.unlockStar > 0 && (
                        <span className="text-asylum-muted">Unlock at <span className="text-asylum-text font-semibold">{lv.unlockStar}★</span></span>
                      )}
                      {lv.power && (
                        <span className="text-asylum-muted">Power: <span className="text-asylum-text font-mono">{lv.power}</span></span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
