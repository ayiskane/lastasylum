import { getHeroes, getHeroList, heroDisplayName, heroImagePath, skillImagePath, benefitTypeName } from '@/lib/gamedata'
import GameImage from '@/components/GameImage'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import HeroSkillPanel from '@/components/HeroSkillPanel'

export async function generateStaticParams() {
  return getHeroList().map(h => ({ id: h.id }))
}

function stripTags(s: string): string {
  return s.replace(/\[c\]\[[^\]]*\]/g, '').replace(/\[-\]\[\/c\]/g, '').replace(/\[\/c\]/g, '').replace(/\{(\d+)\}/g, 'X')
}

const SLOT_LABELS: Record<number, string> = {
  0: 'Auto Atk', 1: 'Auto Atk', 2: 'Ultimate', 3: 'Skill', 4: 'Passive', 5: 'Support',
  6: 'Passive 2', 7: 'Passive 3', 8: 'Passive 4',
}
const SLOT_ORDER = [0, 1, 2, 3, 4, 5, 6, 7, 8]

function extractTypeLabel(typeDesc: string): string {
  return stripTags(typeDesc).trim() || 'Skill'
}

interface SkillGroup {
  slot: number
  name: string
  typeLabel: string
  icon: string
  description: string
  levels: { star: number; unlockStar: number; power: string; param1: string; description: string }[]
}

function groupSkills(skills: any[]): SkillGroup[] {
  const bySlot: Record<number, any[]> = {}
  for (const sk of skills) {
    const slot = sk.skillSlot ?? 0
    ;(bySlot[slot] ??= []).push(sk)
  }
  const groups: SkillGroup[] = []
  for (const slot of SLOT_ORDER) {
    const entries = bySlot[slot]
    if (!entries?.length) continue
    const sorted = [...entries].sort((a, b) => (a.skillStar || 0) - (b.skillStar || 0))
    const first = sorted[0]
    groups.push({
      slot,
      name: first.displayName || SLOT_LABELS[slot] || `Slot ${slot}`,
      typeLabel: first.typeDesc ? extractTypeLabel(first.typeDesc) : SLOT_LABELS[slot] || 'Skill',
      icon: first.icon || '',
      description: first.description ? stripTags(first.description) : '',
      levels: sorted.map(sk => ({
        star: sk.skillStar || 0,
        unlockStar: sk.unlockStar || 0,
        power: sk.power || '',
        param1: sk.param1 || '',
        description: sk.description ? stripTags(sk.description) : '',
      })),
    })
  }
  return groups
}

export default function HeroPage({ params }: { params: { id: string } }) {
  const hero = getHeroes()[params.id]
  if (!hero) return notFound()

  const qc: Record<number, string> = {
    0: 'border-blue-500/50 text-blue-400',
    4: 'border-purple-500/50 text-purple-400',
    5: 'border-orange-500/50 text-orange-400',
    6: 'border-red-500/50 text-red-400',
  }
  const accent = qc[hero.quality] || 'border-asylum-border text-asylum-muted'
  const name = heroDisplayName(hero)
  const skillGroups = groupSkills(hero.skills || [])

  // Prepare serializable skill data for client component
  const skillData = skillGroups.map(g => ({
    ...g,
    iconSrc: g.icon ? `/images/skills/${g.icon}.png` : '',
  }))

  return (
    <div>
      <Link href="/heroes" className="text-sm text-asylum-muted hover:text-asylum-accent mb-4 inline-block">← Back to Heroes</Link>

      {/* Hero Header */}
      <div className={`bg-asylum-surface border rounded-xl p-6 mb-6 ${accent.split(' ')[0]}`}>
        <div className="flex items-start gap-6">
          <div className={`w-28 h-28 rounded-xl border-2 overflow-hidden shrink-0 ${accent}`}>
            <GameImage src={heroImagePath(hero, 'portrait')} alt={name} className="w-full h-full" />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-4xl tracking-wider text-asylum-text">{name}</h1>
            <div className="flex gap-3 mt-2 flex-wrap">
              <span className={`text-sm font-semibold ${accent.split(' ')[1]}`}>{hero.qualityName}</span>
              <span className="text-sm text-asylum-muted">•</span>
              <span className="text-sm text-asylum-text">{hero.armyName}</span>
              {hero.campName && hero.campName !== 'None' && hero.campType > 0 && (
                <><span className="text-sm text-asylum-muted">•</span><span className="text-sm text-asylum-text">{hero.campName}</span></>
              )}
            </div>
            {hero.characterDes && <div className="text-sm text-asylum-muted mt-1 italic">{hero.characterDes}</div>}
            {hero.maxAbility > 0 && (
              <div className="mt-3 text-asylum-accent font-display text-xl">⚡ Max Power: {hero.maxAbility.toLocaleString()}</div>
            )}
          </div>
        </div>
        {hero.heroStory && <p className="mt-4 text-sm text-asylum-muted leading-relaxed border-t border-asylum-border/50 pt-4">{hero.heroStory}</p>}
        {hero.descRecruitPreview && <p className="mt-2 text-sm text-asylum-text/80 italic">{hero.descRecruitPreview}</p>}
      </div>

      {/* Thumbnail row */}
      <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
        {(['thumbnail', 'portrait', 'bust', 'honor'] as const).map(type => {
          const src = heroImagePath(hero, type)
          if (!src) return null
          const labels = { thumbnail: 'Card', portrait: 'Portrait', bust: 'Bust', honor: 'Honor' }
          return (
            <div key={type} className="shrink-0 text-center">
              <div className="w-20 h-24 rounded-lg border border-asylum-border overflow-hidden bg-asylum-surface">
                <GameImage src={src} alt={`${name} ${labels[type]}`} className="w-full h-full" />
              </div>
              <div className="text-xs text-asylum-muted mt-1">{labels[type]}</div>
            </div>
          )
        })}
      </div>

      {/* Interactive Skill Panel */}
      <HeroSkillPanel skills={skillData} />

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        {/* Stats */}
        <section className="bg-asylum-surface border border-asylum-border rounded-xl p-5">
          <h2 className="font-display text-lg text-asylum-accent tracking-wide mb-4">STATS</h2>
          <div className="space-y-2 text-sm">
            {hero.maxAbility > 0 && <StatRow label="Max Power" value={hero.maxAbility.toLocaleString()} highlight />}
            <StatRow label="Attack Speed" value={`${hero.attackCd}ms`} />
            <StatRow label="Attack Range" value={String(hero.attackRadius)} />
            {hero.rpgAttackRadius > 0 && <StatRow label="RPG Attack Range" value={String(hero.rpgAttackRadius)} />}
            <StatRow label="Max Honor Level" value={String(hero.maxHonorLevel)} />
            <StatRow label="Star Rating" value={String(hero.heroStarRating)} />
            <StatRow label="Skill Count" value={String(hero.skill_count)} />
            {hero.buildingLevel > 0 && <StatRow label="Unlock" value={`Building Lv.${hero.buildingLevel}`} />}
          </div>
        </section>

        {/* Level Scaling */}
        <section className="bg-asylum-surface border border-asylum-border rounded-xl p-5">
          <h2 className="font-display text-lg text-asylum-accent tracking-wide mb-4">LEVEL SCALING</h2>
          {hero.levelRatio?.length > 0 ? (
            <div className="space-y-2 text-sm">
              {hero.levelRatio.map((r: any, i: number) => (
                <div key={`lr-${i}`} className="flex justify-between">
                  <span className="text-asylum-muted">{benefitTypeName(r.Type)}</span>
                  <span className="text-asylum-text font-mono">{(r.Value * 100).toFixed(1)}%/lv</span>
                </div>
              ))}
            </div>
          ) : <p className="text-asylum-muted text-sm">No level scaling data</p>}
          {hero.starRatio?.length > 0 && (
            <>
              <h3 className="font-display text-sm text-asylum-accent tracking-wide mt-5 mb-3">STAR SCALING</h3>
              <div className="space-y-2 text-sm">
                {hero.starRatio.map((r: any, i: number) => (
                  <div key={`sr-${i}`} className="flex justify-between">
                    <span className="text-asylum-muted">{benefitTypeName(r.Type)}</span>
                    <span className="text-asylum-text font-mono">{(r.Value * 100).toFixed(1)}%/★</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Fragments */}
        {(hero.medalId || hero.fragmentItemId) && (
          <section className="bg-asylum-surface border border-asylum-border rounded-xl p-5 md:col-span-2">
            <h2 className="font-display text-lg text-asylum-accent tracking-wide mb-4">FRAGMENTS</h2>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              {hero.medalId && (
                <div className="flex justify-between bg-asylum-bg rounded-lg p-3">
                  <span className="text-asylum-muted">Medal</span>
                  <span className="text-asylum-text font-mono">{hero.medalId} ×{hero.medalAmount}</span>
                </div>
              )}
              {hero.fragmentItemId && (
                <div className="flex justify-between bg-asylum-bg rounded-lg p-3">
                  <span className="text-asylum-muted">Universal Fragment</span>
                  <span className="text-asylum-text font-mono">{hero.fragmentItemId} ×{hero.fragmentItemCount}</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Honor Milestones */}
        {hero.honorLevelUnlockEffect?.length > 0 && (
          <section className="bg-asylum-surface border border-asylum-border rounded-xl p-5 md:col-span-2">
            <h2 className="font-display text-lg text-asylum-accent tracking-wide mb-4">HONOR MILESTONES</h2>
            <div className="flex flex-wrap gap-2">
              {hero.honorLevelUnlockEffect.map((lvl: number, i: number) => (
                <div key={`hon-${i}`} className="bg-asylum-bg border border-asylum-border rounded px-3 py-1.5 text-sm">
                  <span className="text-asylum-accent font-mono">Lv.{lvl}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function StatRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between py-1 border-b border-asylum-border/50 last:border-0">
      <span className="text-asylum-muted">{label}</span>
      <span className={highlight ? 'text-asylum-accent font-mono font-bold' : 'text-asylum-text font-mono'}>{value}</span>
    </div>
  )
}
