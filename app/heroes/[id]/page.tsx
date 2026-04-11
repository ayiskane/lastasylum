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

const CAMP_ICONS: Record<number, string> = {
  1: '🏹', 2: '🔮', 3: '⚔️',
}

// Card frame styles matching in-game hero cards
const QUALITY_CARD: Record<number, { border: string; bg: string }> = {
  2: { border: 'border-green-500', bg: 'bg-gradient-to-b from-[#1a4a2a] via-[#153820] to-[#0f2818]' },
  3: { border: 'border-[#4a7ec2]', bg: 'bg-gradient-to-b from-[#2a4a7a] via-[#1e3560] to-[#162845]' },
  4: { border: 'border-[#9855d4]', bg: 'bg-gradient-to-b from-[#6b2fa0] via-[#4e2280] to-[#351660]' },
  5: { border: 'border-[#d4943a]', bg: 'bg-gradient-to-b from-[#c88520] via-[#a06818] to-[#704010]' },
}

const ARMY_NAMES: Record<number, string> = {
  1: 'Infantry', 2: 'Vehicle', 3: 'Aircraft',
}

export default function HeroDetailPage({ params }: { params: { id: string } }) {
  const heroes = getHeroes()
  const hero = heroes[params.id]
  if (!hero) return notFound()

  const items = getItems()
  const heroStars = getHeroStars()
  const honorWall = getHonorWall()
  const name = heroDisplayName(hero)
  const cardStyle = QUALITY_CARD[hero.quality] || QUALITY_CARD[5]

  // Shard items
  const shardItem = hero.fragmentItemId ? items[hero.fragmentItemId] : null
  const omniShardItem = hero.quality >= 5
    ? items['item_Material_universalFragment_5']
    : hero.quality >= 4
    ? items['item_Material_universalFragment_4']
    : null

  // Scaling ratios
  const levelRatios = (hero.levelRatio || []) as { Type: number; Value: number }[]
  const starRatios = (hero.starRatio || []) as { Type: number; Value: number }[]

  // Build honor milestones
  const honorMilestones = (hero.honorLevelUnlockEffect || []).map((lvl: number) => {
    const starEntry = lvl <= 50
      ? Object.values(heroStars).find((s: any) => s.star === lvl)
      : null
    const honorEntry = honorWall[String(lvl)]
    const attrs = (starEntry as any)?.attr || (honorEntry?.levelBenefit) || []
    return {
      level: lvl,
      wholeStar: (starEntry as any)?.wholeStar || 0,
      cost: (starEntry as any)?.cost || 0,
      attrs: attrs as { Type: number; Value: number; Source: number }[],
    }
  })

  // Build skill data for the panel
  const skillsBySlot: Record<number, any[]> = {}
  for (const sk of hero.skills || []) {
    const slot = sk.skillSlot ?? sk.skillType ?? 0
    ;(skillsBySlot[slot] ??= []).push(sk)
  }
  const skillSlots = SLOT_ORDER.filter(s => skillsBySlot[s]?.length)

  const skillData = skillSlots.map(slot => {
    const levels = skillsBySlot[slot]
    const first = levels[0]
    return {
      slot,
      name: first.displayName || `Skill ${slot}`,
      description: first.description ? stripTags(first.description) : '',
      typeLabel: first.typeDesc ? extractTypeLabel(first.typeDesc) : (SLOT_LABELS[slot] || 'Skill'),
      icon: first.skillIcon || '',
      iconSrc: skillImagePath(first.skillIcon || ''),
      levels: levels.map((lv: any) => ({
        star: lv.star || 0,
        unlockStar: lv.starCondition || 0,
        power: lv.power || '',
        param1: lv.param1 || '',
        description: lv.description ? stripTags(lv.description) : '',
        params: lv.params || { param1: lv.param1 },
      })),
    }
  })

  // Best image: honor art (216×300) exists for all heroes, card (162×276) as backup
  // Bust (750×1050) would be ideal but needs ripper extraction
  const honorPath = heroImagePath(hero, 'honor')
  const cardPath = heroImagePath(hero, 'thumbnail')
  const heroImg = honorPath || cardPath

  return (
    <div className="max-w-[960px] mx-auto min-h-screen lg:flex max-lg:block">
      {/* ─── Sticky sidebar ─── */}
      <aside className="w-[220px] max-lg:w-full shrink-0 lg:sticky lg:top-0 lg:self-start lg:h-screen bg-asylum-surface border-r border-asylum-border lg:overflow-y-auto">
        <div className="p-4 max-lg:flex max-lg:gap-4 max-lg:items-start">
          {/* Hero image with game-style rarity card frame */}
          <div className={`max-lg:w-[120px] max-lg:shrink-0 rounded-xl border-[3px] ${cardStyle.border} overflow-hidden mb-3 max-lg:mb-0 ${cardStyle.bg} p-1`}>
            <div className="aspect-[216/300] rounded-lg overflow-hidden">
              <GameImage
                src={heroImg}
                alt={name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="max-lg:flex-1">
            {/* Name + power */}
            <h1 className="text-lg font-bold tracking-wide mb-0.5">{name}</h1>
            <div className="text-base font-semibold text-asylum-accent font-mono mb-2">
              {hero.maxAbility?.toLocaleString()}
            </div>

            {/* Tags */}
            <div className="flex gap-1.5 flex-wrap mb-2">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-asylum-accent/12 text-asylum-accent">
                {hero.qualityName}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-asylum-surface text-asylum-muted border border-asylum-border">
                {hero.armyName}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-asylum-surface text-asylum-muted border border-asylum-border">
                {CAMP_ICONS[hero.campType] || ''} {hero.campName}
              </span>
            </div>

            {/* Shards */}
            <div className="flex gap-1.5 mb-3">
              {shardItem && (
                <div className="flex items-center gap-1 bg-asylum-bg border border-asylum-border rounded px-1.5 py-0.5">
                  <GameImage src={itemImagePath(shardItem.icon)} alt="Shard" className="w-3 h-3" />
                  <span className="text-[10px] text-asylum-muted">×{hero.fragmentItemCount || 10}</span>
                </div>
              )}
              {omniShardItem && (
                <div className="flex items-center gap-1 bg-asylum-bg border border-asylum-border rounded px-1.5 py-0.5">
                  <GameImage src={itemImagePath(omniShardItem.icon)} alt="Omni" className="w-3 h-3" />
                  <span className="text-[10px] text-asylum-muted">×1</span>
                </div>
              )}
            </div>

            {/* Quick stats */}
            <div className="border-t border-asylum-border pt-2 space-y-0.5">
              {[
                ['Atk speed', `${hero.attackCd}ms`],
                ['Max honor', String(hero.maxHonorLevel)],
                ['Star cap', String(hero.heroStarRating)],
                ['Skills', String(skillSlots.length)],
                ['Unlock', hero.buildingLevel ? `Bldg Lv.${hero.buildingLevel}` : '—'],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between text-[11px]">
                  <span className="text-asylum-hint">{l}</span>
                  <span className="font-mono text-[10px] text-asylum-muted">{v}</span>
                </div>
              ))}
            </div>

            {/* TOC */}
            <div className="border-t border-asylum-border mt-3 pt-2 space-y-0.5 max-lg:hidden">
              {['Scaling', 'Honor milestones', 'Skills'].map(s => (
                <a key={s} href={`#${s.toLowerCase().replace(/ /g, '-')}`}
                  className="block text-[10px] text-asylum-hint hover:text-asylum-accent transition-colors">
                  {s}
                </a>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* ─── Main content ─── */}
      <main className="flex-1 min-w-0 p-6 max-lg:p-4">
        <Link href="/heroes" className="text-xs text-asylum-muted hover:text-asylum-accent mb-4 inline-block">
          ← Back to Heroes
        </Link>

        {hero.descRecruitPreview && (
          <p className="text-sm text-asylum-muted italic mb-2">{hero.descRecruitPreview}</p>
        )}

        {/* ─── Scaling ─── */}
        <h2 id="scaling" className="text-xs font-semibold text-asylum-accent uppercase tracking-[2px] mt-6 mb-3 pb-1.5 border-b border-asylum-accent/15">
          Scaling
        </h2>
        <table className="w-full text-xs mb-4">
          <thead>
            <tr className="border-b border-asylum-border">
              <th className="text-left text-[9px] text-asylum-hint uppercase tracking-wider py-1.5 px-2 font-semibold">Stat</th>
              <th className="text-left text-[9px] text-asylum-hint uppercase tracking-wider py-1.5 px-2 font-semibold">Per level</th>
              <th className="text-left text-[9px] text-asylum-hint uppercase tracking-wider py-1.5 px-2 font-semibold">Per star</th>
            </tr>
          </thead>
          <tbody>
            {levelRatios.map((lr, i) => {
              const sr = starRatios[i]
              const statName = benefitTypeName(lr.Type)
              return (
                <tr key={i} className="border-b border-white/[0.03] hover:bg-asylum-surface">
                  <td className="py-1.5 px-2 text-asylum-muted">{statName}</td>
                  <td className="py-1.5 px-2 font-mono text-[11px]">{typeof lr.Value === 'number' ? `${(lr.Value * 100).toFixed(1)}%` : String(lr.Value)}</td>
                  <td className="py-1.5 px-2 font-mono text-[11px]">{sr ? `${(Number(sr.Value) * 100).toFixed(1)}%/★` : '—'}</td>
                </tr>
              )
            })}
            {(hero.levelBenefit || []).map((b: any, i: number) => (
              <tr key={`b${i}`} className="border-b border-white/[0.03] hover:bg-asylum-surface">
                <td className="py-1.5 px-2 text-asylum-muted">{benefitTypeName(b.Type)}</td>
                <td className="py-1.5 px-2 font-mono text-[11px]" colSpan={2}>
                  +{typeof b.Value === 'number' && b.Value < 1 ? `${(b.Value * 100).toFixed(2)}%` : b.Value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ─── Honor milestones ─── */}
        <h2 id="honor-milestones" className="text-xs font-semibold text-asylum-accent uppercase tracking-[2px] mt-6 mb-3 pb-1.5 border-b border-asylum-accent/15">
          Honor milestones
        </h2>
        {honorMilestones.length > 0 && (
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-asylum-border">
                  <th className="text-left text-[9px] text-asylum-hint uppercase tracking-wider py-1.5 px-2 font-semibold">Level</th>
                  <th className="text-left text-[9px] text-asylum-hint uppercase tracking-wider py-1.5 px-2 font-semibold">Stars</th>
                  <th className="text-left text-[9px] text-asylum-hint uppercase tracking-wider py-1.5 px-2 font-semibold">Cost</th>
                  {honorMilestones[0]?.attrs.map((_: any, i: number) => (
                    <th key={i} className="text-left text-[9px] text-asylum-hint uppercase tracking-wider py-1.5 px-2 font-semibold">
                      {honorMilestones[0].attrs[i] ? benefitTypeName(honorMilestones[0].attrs[i].Type) : `Stat ${i + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {honorMilestones.map((m, i) => (
                  <tr key={i} className="border-b border-white/[0.03] hover:bg-asylum-surface">
                    <td className="py-1.5 px-2 text-asylum-accent font-semibold font-mono">{m.level}</td>
                    <td className="py-1.5 px-2 text-asylum-muted">
                      {m.wholeStar > 0 ? `${m.wholeStar}★` : '—'}
                    </td>
                    <td className="py-1.5 px-2 text-asylum-muted text-[10px]">
                      {m.cost > 0 ? `${m.cost} shards` : '—'}
                    </td>
                    {m.attrs.map((a: any, j: number) => (
                      <td key={j} className="py-1.5 px-2 font-mono text-[11px]">
                        +{typeof a.Value === 'number' ? Math.round(a.Value).toLocaleString() : a.Value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── Skills ─── */}
        <h2 id="skills" className="text-xs font-semibold text-asylum-accent uppercase tracking-[2px] mt-6 mb-3 pb-1.5 border-b border-asylum-accent/15">
          Skills
        </h2>
        <HeroSkillPanel skills={skillData} />
      </main>
    </div>
  )
}
