import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA = path.join(process.cwd(), 'data', 'wiki')

function load(name: string) {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA, name), 'utf-8'))
  } catch { return {} }
}

// Group flat HeroSkillBase rows into {slot, name, levels[]} shape.
// Each row in heroes.json is one (slot, star) entry with formulas in `power`/`param1`.
// Rows sharing the same skillSlot form one skill with multiple star tiers.
// skillSlot is inherited forward: if a row omits it, use the previous row's value
// (base/star=0 rows in HeroSkillBase.lua sometimes drop the field).
function groupSkills(flat: any[]) {
  const bySlot: Record<number, any[]> = {}
  let lastSlot = 1
  for (const row of flat) {
    const slot = row.skillSlot ?? lastSlot
    lastSlot = slot
    ;(bySlot[slot] ??= []).push(row)
  }
  const stripTags = (s: string) => String(s || '').replace(/\[[^\]]*\]/g, '')
  return Object.keys(bySlot)
    .map(Number)
    .sort((a, b) => a - b)
    .map(slot => {
      const rows = bySlot[slot]
      const first = rows.find(r => r.displayName) || rows[0]
      return {
        slot,
        name: first.displayName || `Skill ${slot}`,
        icon: first.icon || '',
        typeLabel: stripTags(first.typeDesc || ''),
        levels: rows
          .map(r => ({
            star: r.skillStar ?? 0,
            unlockStar: r.unlockStar ?? 0,
            power: r.power || '',
            param1: r.param1 || '',
            param2: r.param2 || '',
            param3: r.param3 || '',
          }))
          .sort((a, b) => a.star - b.star),
      }
    })
}

export async function GET() {
  const heroes = load('heroes.json')
  const equipment = load('equipment.json')
  const heroLevels = load('heroLevels.json')
  const heroStars = load('hero_stars.json')

  const heroList = Object.values(heroes).map((h: any) => ({
    id: h.id,
    name: h.displayName || h.name,
    quality: h.quality,
    qualityName: h.qualityName || (h.quality === 5 ? 'UR' : h.quality === 4 ? 'SSR' : 'SR'),
    campType: h.campType,
    campName: h.campName || 'Warrior',
    armyType: h.armyType,
    armyName: h.armyName || 'Support',
    attackCd: h.attackCd || 900,
    heroIcon: h.heroIcon,
    levelTemplate: h.levelTemplate || 1,
    maxAbility: h.maxAbility || 0,
    levelRatio: h.levelRatio || [],
    starRatio: h.starRatio || [],
    levelBenefit: h.levelBenefit || [],
    skills: groupSkills(h.skills || []),
  }))

  const campSynergy = [
    { count: 2, bonus: 0.10, label: '2 same class' },
    { count: 4, bonus: 0.15, label: '4 same class' },
    { count: 5, bonus: 0.20, label: '5 same class' },
  ]

  const statNames: Record<string, string> = {
    '10001': 'CMD', '10002': 'HP', '10003': 'ATK', '10004': 'DEF',
    '10005': 'HP%', '10006': 'Crit Rate', '10007': 'Crit DMG',
    '10008': 'Ranger HP%', '10009': 'Ranger ATK%', '10010': 'Ranger DEF%',
    '10011': 'Warlock HP%', '10012': 'Warlock ATK%', '10013': 'Warlock DEF%',
    '10014': 'Warrior HP%', '10015': 'Warrior ATK%', '10016': 'Warrior DEF%',
    '10017': 'DMG Dealt', '10018': 'Physical DMG', '10019': 'Energy DMG',
    '10023': 'DMG Taken↓', '10026': 'DMG to Monsters', '10027': 'Monster DMG Taken↓',
    '10028': 'Counter DMG', '10030': 'DMG Rate', '10032': 'Crit DMG%',
    '10034': 'Skill CD Speed', '10035': 'Physical RES', '10036': 'Energy RES',
    '10037': 'DMG RES',
  }

  return NextResponse.json({
    heroes: heroList,
    equipment,
    heroLevels,
    heroStars,
    campSynergy,
    statNames,
  })
}
