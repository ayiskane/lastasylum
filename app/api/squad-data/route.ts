import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA = path.join(process.cwd(), 'data', 'wiki')

function load(name: string) {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA, name), 'utf-8'))
  } catch { return {} }
}

export async function GET() {
  const heroes = load('heroes.json')
  const equipment = load('equipment.json')
  const heroLevels = load('heroLevels.json')
  const heroStars = load('hero_stars.json')

  // Build hero list for selector (minimal data)
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
    skills: (h.skills || []).map((s: any) => ({
      slot: s.slot,
      name: s.name || s.skillName || '',
      icon: s.icon || s.skillIcon || '',
      typeLabel: s.typeLabel || '',
      levels: (s.levels || []).map((lv: any) => ({
        star: lv.star,
        unlockStar: lv.unlockStar,
        power: lv.power,
        param1: lv.param1,
        param2: lv.param2,
        param3: lv.param3,
      }))
    }))
  }))

  // Build camp synergy data
  const campSynergy = [
    { count: 2, bonus: 0.10, label: '2 same class' },
    { count: 4, bonus: 0.15, label: '4 same class' },
    { count: 5, bonus: 0.20, label: '5 same class' },
  ]

  // Stat names
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
