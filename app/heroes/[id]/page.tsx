import { getHeroes, getHeroList, getItems, getHeroStars, getHonorWall, heroDisplayName, heroImagePath, skillImagePath, benefitTypeName, itemImagePath } from '@/lib/gamedata'
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

// SVG class icons
const CAMP_ICONS: Record<number, string> = {
  1: '🏹', // Ranger
  2: '🔮', // Warlock
  3: '⚔️', // Warrior
}

interface SkillGroup {
  slot: number; name: string; typeLabel: string; icon: string
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
      levels: sorted.map(sk => {
        // Collect all param fields
        const params: Record<string, string> = {}
        for (const key of Object.keys(sk)) {
          if (key.startsWith('param') && sk[key]) {
            params[key] = String(sk[key])
          }
        }
        return {
          star: sk.skillStar || 0,
          unlockStar: sk.unlockStar || 0,
          power: sk.power || '',
          param1: sk.param1 || '',
          params,
          description: sk.description ? stripTags(sk.description) : '',
        }
      }),
    })
  }
  return groups
}

export default function HeroPage({ params }: { params: { id: string } }) {
  const hero = getHeroes()[params.id]
  if (!hero) return notFound()

  const items = getItems()
  const heroStars = getHeroStars()
  const honorWall = getHonorWall()

  const accentMap: Record<number, string> = {
    0: 'border-blue-500/50', 4: 'border-purple-500/50', 5: 'border-orange-500/50', 6: 'border-red-500/50',
  }
  const accentTextMap: Record<number, string> = {
    0: 'text-blue-400', 4: 'text-purple-400', 5: 'text-orange-400', 6: 'text-red-400',
  }
  const accentBorder = accentMap[hero.quality] || 'border-asylum-border'
  const accentText = accentTextMap[hero.quality] || 'text-asylum-muted'
  const name = heroDisplayName(hero)
  const skillGroups = groupSkills(hero.skills || [])
  const skillData = skillGroups.map(g => ({ ...g, iconSrc: g.icon ? `/images/skills/${g.icon}.png` : '' }))

  // Get shard/fragment item data for icons
  const shardItem = hero.medalId ? items[hero.medalId] : null
  const fragItem = hero.fragmentItemId ? items[hero.fragmentItemId] : null

  // Build honor milestone data
  // honorLevelUnlockEffect contains honor LEVELS (50,100,...,600)
  // hero_stars covers star progression (0-50) — star=50 matches honor level 50
  // honor_wall covers honor levels 1-600 with per-level benefits
  const honorMilestones = (hero.honorLevelUnlockEffect || []).map((lvl: number) => {
    // For level 50, check hero_stars (star progression data)
    const starEntry = lvl <= 50
      ? Object.values(heroStars).find((s: any) => s.star === lvl)
      : null

    // For all levels, check honor_wall (honor level benefits)
    const honorEntry = honorWall[String(lvl)]

    // Prefer hero_stars attrs (more detailed), fallback to honor_wall
    const attrs = (starEntry as any)?.attr || (honorEntry?.levelBenefit) || []

    return {
      level: lvl,
      wholeStar: (starEntry as any)?.wholeStar || 0,
      cost: (starEntry as any)?.cost || 0,
      attrs: attrs as { Type: number; Value: number; Source: number }[],
    }
  })

  return (
    <div>
      <Link href="/heroes" className="text-sm text-asylum-muted hover:text-asylum-accent mb-4 inline-block">← Back to Heroes</Link>

      {/* Top section: card image left, info+stats right */}
      <div className="flex gap-5 mb-6 max-md:flex-col">
        {/* Card image — native 162×276, maintain aspect ratio */}
        <div className={`w-[162px] max-md:w-full max-md:max-w-[162px] max-md:mx-auto shrink-0 rounded-xl border-2 ${accentBorder} overflow-hidden bg-asylum-surface`}>
          <div className="aspect-[162/276]">
            <GameImage
              src={heroImagePath(hero, 'thumbnail')}
              alt={name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Right column */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Hero info card */}
          <div className="bg-asylum-surface border border-asylum-border rounded-xl p-5">
            {/* Name row with shard icons */}
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="font-display text-3xl tracking-wider text-asylum-text">{name}</h1>
              {shardItem && (
                <div className="flex items-center gap-1.5 bg-asylum-bg border border-asylum-border rounded-lg px-2 py-1" title={`${shardItem.displayName || 'Hero Shard'} ×${hero.medalAmount}`}>
                  <div className="w-5 h-5 rounded overflow-hidden">
                    <GameImage src={itemImagePath(shardItem.icon)} alt="Shard" fallback="🧩" className="w-full h-full" />
                  </div>
                  <span className="text-xs text-asylum-muted font-mono">×{hero.medalAmount}</span>
                </div>
              )}
              {fragItem && (
                <div className="flex items-center gap-1.5 bg-asylum-bg border border-asylum-border rounded-lg px-2 py-1" title={`${fragItem.displayName || 'Omni Shard'} ×${hero.fragmentItemCount}`}>
                  <div className="w-5 h-5 rounded overflow-hidden">
                    <GameImage src={itemImagePath(fragItem.icon)} alt="Fragment" fallback="💎" className="w-full h-full" />
                  </div>
                  <span className="text-xs text-asylum-muted font-mono">×{hero.fragmentItemCount}</span>
                </div>
              )}
            </div>

            {/* Tags with class icon */}
            <div className="flex gap-2 flex-wrap mb-3">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${accentText} ${accentBorder} bg-asylum-bg`}>{hero.qualityName}</span>
              <span className="text-xs px-3 py-1 rounded-full bg-asylum-bg border border-asylum-border text-asylum-muted">{hero.armyName}</span>
              {hero.campName && hero.campName !== 'None' && hero.campType > 0 && (
                <span className="text-xs px-3 py-1 rounded-full bg-asylum-bg border border-asylum-border text-asylum-muted flex items-center gap-1">
                  <span className="text-sm leading-none">{CAMP_ICONS[hero.campType] || ''}</span>
                  {hero.campName}
                </span>
              )}
            </div>

            {hero.descRecruitPreview && (
              <p className="text-sm text-asylum-muted italic mb-3">{hero.descRecruitPreview}</p>
            )}
            {hero.maxAbility > 0 && (
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-asylum-muted uppercase tracking-wider">Max power</span>
                <span className="font-display text-2xl text-asylum-accent">{hero.maxAbility.toLocaleString()}</span>
              </div>
            )}
            {hero.heroStory && (
              <p className="text-xs text-asylum-muted/60 mt-3 pt-3 border-t border-asylum-border/50 leading-relaxed">{hero.heroStory}</p>
            )}
          </div>

          {/* Stats card: combat + scaling side by side */}
          <div className="bg-asylum-surface border border-asylum-border rounded-xl p-5 flex-1">
            <div className="grid grid-cols-2 gap-x-6 max-md:grid-cols-1 max-md:gap-y-4">
              {/* Combat column */}
              <div>
                <div className="text-[10px] font-semibold text-asylum-accent uppercase tracking-widest mb-2 pb-2 border-b border-asylum-border">Combat</div>
                <div className="space-y-0.5">
                  {hero.maxAbility > 0 && <StatRow label="Max power" value={hero.maxAbility.toLocaleString()} highlight />}
                  <StatRow label="Attack speed" value={`${hero.attackCd}ms`} />
                  <StatRow label="Max honor level" value={String(hero.maxHonorLevel)} />
                  <StatRow label="Star cap" value={String(hero.heroStarRating)} />
                  <StatRow label="Skills" value={String(hero.skill_count)} />
                  {hero.buildingLevel > 0 && <StatRow label="Unlock" value={`Bldg Lv.${hero.buildingLevel}`} />}
                </div>

                {/* Honor milestones with bonuses */}
                {honorMilestones.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-asylum-border/50">
                    <div className="text-[10px] font-semibold text-asylum-muted uppercase tracking-wider mb-2">Honor milestones</div>
                    <div className="space-y-1">
                      {honorMilestones.map((m, i) => (
                        <div key={`hon-${i}`} className="flex items-start gap-2 text-[11px]">
                          <span className="text-asylum-accent font-mono font-semibold w-8 shrink-0">{m.level}</span>
                          <span className="text-asylum-muted">
                            {m.wholeStar > 0 && <span>{m.wholeStar}★</span>}
                            {m.cost > 0 && <span className="ml-1">({m.cost} shards)</span>}
                            {m.attrs.length > 0 && (
                              <span className="ml-1 text-asylum-text/70">
                                {m.attrs.slice(0, 2).map((a, j) => (
                                  <span key={j}>{j > 0 ? ', ' : ''}{benefitTypeName(a.Type)} +{Math.round(a.Value).toLocaleString()}</span>
                                ))}
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Scaling column */}
              <div>
                <div className="text-[10px] font-semibold text-asylum-accent uppercase tracking-widest mb-2 pb-2 border-b border-asylum-border">Scaling / Level</div>
                {hero.levelRatio?.length > 0 ? (
                  <div className="space-y-0.5">
                    {hero.levelRatio.map((r: any, i: number) => (
                      <StatRow key={`lr-${i}`} label={benefitTypeName(r.Type)} value={`${(r.Value * 100).toFixed(1)}%`} />
                    ))}
                  </div>
                ) : <p className="text-xs text-asylum-muted">No level scaling data</p>}

                {hero.starRatio?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-asylum-border/50">
                    <div className="text-[10px] font-semibold text-asylum-muted uppercase tracking-wider mb-2">Per star</div>
                    <div className="space-y-0.5">
                      {hero.starRatio.map((r: any, i: number) => (
                        <StatRow key={`sr-${i}`} label={benefitTypeName(r.Type)} value={`${(r.Value * 100).toFixed(1)}%/★`} />
                      ))}
                    </div>
                  </div>
                )}

                {hero.levelBenefit?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-asylum-border/50">
                    <div className="text-[10px] font-semibold text-asylum-muted uppercase tracking-wider mb-2">Bonus</div>
                    <div className="space-y-0.5">
                      {hero.levelBenefit.map((r: any, i: number) => (
                        <StatRow key={`lb-${i}`} label={benefitTypeName(r.Type)} value={`+${(r.Value * 100).toFixed(2)}%`} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Skills */}
      <HeroSkillPanel skills={skillData} />
    </div>
  )
}

function StatRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between py-1 text-xs">
      <span className="text-asylum-muted">{label}</span>
      <span className={highlight ? 'text-asylum-accent font-mono font-bold' : 'text-asylum-text font-mono'}>{value}</span>
    </div>
  )
}
