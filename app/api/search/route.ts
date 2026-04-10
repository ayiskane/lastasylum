import { getHeroList, heroDisplayName, getItems, getBuildings, getFormulas, getResearch, getSoldiers } from '@/lib/gamedata'
import { NextResponse } from 'next/server'

export async function GET() {
  const heroes = getHeroList().map(h => ({
    type: 'hero',
    id: h.id,
    name: heroDisplayName(h),
    desc: `${h.qualityName} ${h.armyName} hero — ${h.heroStory || ''} ${h.skills.length} skills`.trim(),
    href: `/heroes/${h.id}`,
  }))

  const items = Object.values(getItems()).map((item: any) => ({
    type: 'item',
    id: item.id,
    name: item.displayName || item.id,
    desc: item.description || `Grade ${item.grade || 0}`,
    href: `/items`,
  }))

  const buildings = Object.values(getBuildings()).map((b: any) => ({
    type: 'building',
    id: String(b.id),
    name: b.displayName || `Building #${b.id}`,
    desc: [b.buildDes, b.abc_1_info_translate, b.abc_2_info_translate].filter(Boolean).join(' | ') || `Type ${b.type}`,
    href: `/buildings`,
  }))

  const research = Object.values(getResearch()).map((r: any) => ({
    type: 'research',
    id: String(r.id),
    name: r.displayName || `Tech #${r.id}`,
    desc: r.description || `Max Lv.${r.maxLevel}`,
    href: `/research`,
  }))

  const soldiers = Object.values(getSoldiers()).map((s: any) => ({
    type: 'troop',
    id: `${s.type}-${s.level}`,
    name: s.displayName || `Troop T${s.level}`,
    desc: `Tier ${s.level}`,
    href: `/troops`,
  }))

  const formulas = Object.entries(getFormulas()).map(([id, f]: [string, any]) => ({
    type: 'formula',
    id,
    name: `Formula #${id}`,
    desc: f.expression,
    href: `/formulas`,
  }))

  return NextResponse.json([...heroes, ...items, ...buildings, ...research, ...soldiers, ...formulas])
}
