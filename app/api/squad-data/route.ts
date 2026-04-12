import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA = path.join(process.cwd(), 'data', 'wiki')

function load(name: string) {
  try { return JSON.parse(fs.readFileSync(path.join(DATA, name), 'utf-8')) }
  catch { return {} }
}

// Flat HeroSkillBase rows → grouped by skillSlot.
// skillSlot is inherited forward (star=0 rows sometimes omit it).
function groupSkills(flat: any[]) {
  const bySlot: Record<number, any[]> = {}
  let lastSlot = 1
  for (const row of flat) {
    const slot = row.skillSlot ?? lastSlot
    lastSlot = slot
    ;(bySlot[slot] ??= []).push(row)
  }
  const stripTags = (s: string) => String(s||'').replace(/\[[^\]]*\]/g,'')
  return Object.keys(bySlot).map(Number).sort((a,b)=>a-b).map(slot => {
    const rows = bySlot[slot]
    const first = rows.find(r=>r.displayName) || rows[0]
    const levels = rows.map(r => ({
      star: r.skillStar ?? 0,
      unlockStar: r.unlockStar ?? 0,
      power: r.power || '',
      param1: r.param1 || '',
      param2: r.param2 || '',
      param3: r.param3 || '',
    })).sort((a,b)=>a.star-b.star)
    return {
      slot,
      name: first.displayName || `Skill ${slot}`,
      icon: first.icon || '',
      typeLabel: stripTags(first.typeDesc || ''),
      // Passive/support skills have exactly one tier (star=0 only, no upgrades).
      isPassive: levels.length === 1 && (levels[0].star ?? 0) === 0,
      levels,
    }
  })
}

export async function GET() {
  const heroes      = load('heroes.json')
  const equipment   = load('equipment.json')
  const heroLevels  = load('hero_levels.json')     // note: underscored filename from update_wiki.py
  const heroStars   = load('hero_stars.json')
  const honorWall   = load('honor_wall.json')      // { heroLevel -> {levelBenefit:[...]} }

  const heroList = Object.values(heroes).map((h: any) => ({
    id: h.id,
    name: h.displayName || h.name,
    quality: h.quality,
    qualityName: h.qualityName || (h.quality === 5 ? 'UR' : h.quality === 4 ? 'SSR' : 'SR'),
    campType: h.campType, campName: h.campName || 'Warrior',
    armyType: h.armyType, armyName: h.armyName || 'Support',
    attackCd: h.attackCd || 900,
    heroIcon: h.heroIcon,
    levelTemplate: h.levelTemplate || 1,
    maxAbility: h.maxAbility || 0,           // game-canonical max power
    maxHonorLevel: h.maxHonorLevel || 0,     // 600 for most UR
    heroStarRating: h.heroStarRating || 10,  // max whole stars (typically 10)
    levelRatio:   h.levelRatio   || [],
    starRatio:    h.starRatio    || [],
    levelBenefit: h.levelBenefit || [],
    skills: groupSkills(h.skills || []),
  }))

  // Power-formula weights from Parameter.lua (fighter_ability_*):
  //   health = 0.15, attack = 12.5, defense = 7
  //   crt (flat) = 15680, crt_damage weight applies to critDmg
  // Skill power contributes a weighted ~0.38x of its raw formula value
  // (back-solved from Arthur's maxAbility = 920570 @ lv150 + 10★ + max skills).
  const powerWeights = {
    hp: 0.15, atk: 12.5, def: 7, cmd: 0,
    critRate: 15680, critDmg: 7840,
    skillMultiplier: 0.38,
  }

  const campSynergy = [
    { count: 2, bonus: 0.10, label: '2 same class' },
    { count: 4, bonus: 0.15, label: '4 same class' },
    { count: 5, bonus: 0.20, label: '5 same class' },
  ]

  const gameLimits = {
    maxLevel: 150,         // HeroLevel has 150 distinct entries (key "300" aliases "150")
    maxWholeStar: 10,      // max user-facing stars; internal key goes to 51
    maxSkillLevel: 50,
    maxHonorLevel: 600,    // HonorWall goes 1..600
  }

  const statNames: Record<string,string> = {
    '10001':'CMD','10002':'HP','10003':'ATK','10004':'DEF',
    '10005':'HP%','10006':'Crit Rate','10007':'Crit DMG',
    '10008':'Ranger HP%','10009':'Ranger ATK%','10010':'Ranger DEF%',
    '10011':'Warlock HP%','10012':'Warlock ATK%','10013':'Warlock DEF%',
    '10014':'Warrior HP%','10015':'Warrior ATK%','10016':'Warrior DEF%',
    '10017':'DMG Dealt','10018':'Physical DMG','10019':'Energy DMG',
    '10023':'DMG Taken↓','10026':'DMG to Monsters','10027':'Monster DMG Taken↓',
    '10028':'Counter DMG','10030':'DMG Rate','10032':'Crit DMG%',
    '10034':'Skill CD Speed','10035':'Physical RES','10036':'Energy RES','10037':'DMG RES',
  }

  return NextResponse.json({
    heroes: heroList,
    equipment, heroLevels, heroStars, honorWall,
    campSynergy, statNames, powerWeights, gameLimits,
  })
}
