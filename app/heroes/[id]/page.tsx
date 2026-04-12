import { getHeroes, getHeroList, getItems, getHeroStars, getHonorWall, heroDisplayName, heroImagePath, skillImagePath, benefitTypeName, itemImagePath, STAT_NAMES, getMaxLevel, getMaxStar } from '@/lib/gamedata'
import GameImage from '@/components/GameImage'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import HeroSkillPanel from '@/components/HeroSkillPanel'
import HeroStatsPanel from '@/components/HeroStatsPanel'

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

// Camp/class icons from game (0=Warrior, 1=Ranger, 2=Warlock)
const CAMP_ICON_SRC: Record<number, string> = {
  0: '/images/icons/pic_sjboss_zy1.png', // Warrior (red)
  1: '/images/icons/pic_sjboss_zy2.png', // Ranger (blue)
  2: '/images/icons/pic_sjboss_zy3.png', // Warlock (green)
}
const CAMP_LABEL: Record<number, string> = {
  0: 'Warrior', 1: 'Ranger', 2: 'Warlock',
}

// Army type icons: 0=Support, 1=Tank, 3=Damage
const ARMY_ICON_SRC: Record<number, string> = {
  0: '/images/icons/ico_yx_dw3.png', // Support (flask)
  1: '/images/icons/ico_yx_dw1.png', // Tank (shield)
  3: '/images/icons/ico_yx_dw2.png', // Damage (wing)
}
const ARMY_LABEL: Record<number, string> = {
  0: 'Support', 1: 'Tank', 3: 'Damage',
}

// Rarity label images
const RARITY_LABEL: Record<number, string> = {
  0: '/images/icons/font_pz_3.png', // SR (quality 0 in data)
  4: '/images/icons/font_pz_4.png', // SSR
  5: '/images/icons/font_pz_5.png', // UR
}

// Card frame styles matching in-game hero cards
const QUALITY_CARD: Record<number, { border: string; bg: string; nameColor: string }> = {
  0: { border: 'border-[#4a7ec2]', bg: 'bg-gradient-to-b from-[#2a4a7a] via-[#1e3560] to-[#162845]', nameColor: 'text-[#70b0e8]' },
  2: { border: 'border-green-500', bg: 'bg-gradient-to-b from-[#1a4a2a] via-[#153820] to-[#0f2818]', nameColor: 'text-green-400' },
  3: { border: 'border-[#4a7ec2]', bg: 'bg-gradient-to-b from-[#2a4a7a] via-[#1e3560] to-[#162845]', nameColor: 'text-[#70b0e8]' },
  4: { border: 'border-[#9855d4]', bg: 'bg-gradient-to-b from-[#6b2fa0] via-[#4e2280] to-[#351660]', nameColor: 'text-[#c898f0]' },
  5: { border: 'border-[#d4943a]', bg: 'bg-gradient-to-b from-[#c88520] via-[#a06818] to-[#704010]', nameColor: 'text-[#f0d078]' },
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

  // Build stats data for interactive panel
  const maxLevel = getMaxLevel(hero)
  const maxStar = getMaxStar(hero)

  // Get ratio multipliers
  const lrMap: Record<number, number> = {}
  for (const r of hero.levelRatio || []) lrMap[r.Type] = r.Value
  const srMap: Record<number, number> = {}
  for (const r of hero.starRatio || []) srMap[r.Type] = r.Value

  // Load raw level/star tables
  let heroLevelsRaw: Record<string, { level: number; type: number; attrs: Record<string, number> }> = {}
  let heroStarsRaw: Record<string, { star: number; attrs: Record<string, number> }> = {}
  try {
    const fs = require('fs')
    const path = require('path')
    heroLevelsRaw = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'wiki', 'heroLevels.json'), 'utf-8'))
    heroStarsRaw = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'wiki', 'heroStars.json'), 'utf-8'))
  } catch {}

  const template = hero.levelTemplate || 1
  const levelEntries = Object.values(heroLevelsRaw)
    .filter(e => e.type === template)
    .sort((a, b) => a.level - b.level)
    .map(e => ({
      level: e.level,
      hp: e.attrs['10002'] || 0,
      atk: e.attrs['10003'] || 0,
      def: e.attrs['10004'] || 0,
      cmd: e.attrs['10001'] || 0,
    }))

  const starEntries = Object.values(heroStarsRaw)
    .sort((a, b) => a.star - b.star)
    .map(e => ({
      star: e.star,
      hp: e.attrs['10002'] || 0,
      atk: e.attrs['10003'] || 0,
      def: e.attrs['10004'] || 0,
    }))

  const lb = (hero.levelBenefit || [])[0] as { Type: number; Value: number } | undefined
  const statsData = {
    maxLevel,
    maxStar,
    attackCd: hero.attackCd || 0,
    levelBenefitName: lb ? (STAT_NAMES[lb.Type] || `Stat #${lb.Type}`) : '',
    levelEntries,
    starEntries,
    levelRatios: { hp: lrMap[10201] || 1, atk: lrMap[10202] || 1, def: lrMap[10203] || 1 },
    starRatios: { hp: srMap[10201] || 1, atk: srMap[10202] || 1, def: srMap[10203] || 1 },
    levelBenefitPerLevel: lb?.Value || 0,
    levelBenefitType: lb?.Type || null,
  }

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

  // Image priority: bust (750×1050) → honor art (216×300) → card (162×276)
  const bustPath = heroImagePath(hero, 'bust')   // /images/busts/pic_card3_XX.png
  const honorPath = heroImagePath(hero, 'honor')  // /images/heroes/pic_card5_XX.png
  const cardPath = heroImagePath(hero, 'thumbnail') // /images/heroes/pic_card2_XX.png
  const heroImg = honorPath || cardPath  // Use honor art as default (always exists)

  return (
    <div className="max-w-[960px] mx-auto min-h-screen lg:flex max-lg:block">
      {/* ─── Sticky sidebar ─── */}
      <aside className="w-[220px] max-lg:w-full shrink-0 lg:sticky lg:top-0 lg:self-start lg:h-screen bg-asylum-surface border-r border-asylum-border lg:overflow-y-auto">
        <div className="p-4 max-lg:flex max-lg:gap-4 max-lg:items-start">
          {/* Hero image with game-style rarity card frame */}
          <div className="relative max-lg:w-[120px] max-lg:shrink-0 mb-5 max-lg:mb-0">
            <div className={`rounded-xl border-[3px] ${cardStyle.border} overflow-hidden ${cardStyle.bg} p-1`}>
              <div className="aspect-[216/300] rounded-lg overflow-hidden">
                <GameImage
                  src={bustPath || heroImg}
                  alt={name}
                  fallbackSrc={heroImg}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            {/* Rarity label centered on top edge */}
            {RARITY_LABEL[hero.quality] && (
              <img src={RARITY_LABEL[hero.quality]} alt={hero.qualityName}
                className="absolute left-1/2 -translate-x-1/2 -top-3 h-7 w-auto drop-shadow-lg" />
            )}
            {/* Camp + Army icons centered on bottom edge, side by side, same size */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-4 flex items-center gap-0.5">
              {CAMP_ICON_SRC[hero.campType] && (
                <img src={CAMP_ICON_SRC[hero.campType]} alt={CAMP_LABEL[hero.campType] || ''}
                  className="h-10 w-auto drop-shadow-lg" />
              )}
              {ARMY_ICON_SRC[hero.armyType] && (
                <img src={ARMY_ICON_SRC[hero.armyType]} alt={ARMY_LABEL[hero.armyType] || ''}
                  className="h-10 w-auto drop-shadow-lg" />
              )}
            </div>
          </div>

          <div className="max-lg:flex-1">
            {/* Name — centered, bigger, rarity colored */}
            <h1 className={`text-2xl font-bold tracking-wider text-center mb-0.5 ${cardStyle.nameColor}`}
              style={{ fontFamily: "'Rajdhani', sans-serif" }}>{name}</h1>
            {/* Tagline */}
            {hero.descRecruitPreview && (
              <p className="text-[11px] text-asylum-muted italic text-center mb-2 leading-snug">{hero.descRecruitPreview}</p>
            )}
            {/* Might — centered */}
            <div className="flex items-center justify-center gap-1 mb-3">
              <img src="/images/icons/ico_zhanli_60.png" alt="Might" className="w-5 h-5" />
              <span className="text-base font-semibold text-asylum-accent font-mono">{hero.maxAbility?.toLocaleString()}</span>
            </div>

            {/* Shards */}
            <div className="flex justify-center gap-1.5 mb-3">
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

            {/* TOC */}
            <div className="border-t border-asylum-border mt-3 pt-2 space-y-0.5 max-lg:hidden">
              {['Base Stats', 'Honor milestones', 'Skills'].map(s => (
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

        {/* ─── Base Stats ─── */}
        <h2 id="scaling" className="text-xs font-semibold text-asylum-accent uppercase tracking-[2px] mt-6 mb-3 pb-1.5 border-b border-asylum-accent/15">
          Base Stats
        </h2>
        <HeroStatsPanel data={statsData} />

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
