import { readFileSync } from 'fs'
import { join } from 'path'

const DATA_DIR = join(process.cwd(), 'data', 'wiki')

function loadJson<T>(filename: string): T {
  const raw = readFileSync(join(DATA_DIR, filename), 'utf-8')
  return JSON.parse(raw) as T
}

// ── Types ────────────────────────────────────────────────────────────

export interface Hero {
  id: string
  name: string
  displayName?: string
  heroStory?: string
  characterDes?: string
  descRecruitPreview?: string
  quality: number
  qualityName: string
  armyType: number
  armyName: string
  campType: number
  campName: string
  maxAbility: number
  maxHonorLevel: number
  heroStarRating: number
  attackCd: number
  attackRadius: number
  rpgAttackRadius: number
  skill_count: number
  skillTemplate: number
  image: string
  heroIcon: string
  heroPic: string
  honorImage: string
  spineId: string
  selectIcon: string
  levelBenefit: BenefitEntry[]
  levelRatio: BenefitEntry[]
  levelTemplate: number
  starRatio: BenefitEntry[]
  honorLevelUnlockEffect: number[]
  medalId: string
  medalAmount: number
  fragmentItemId: string
  fragmentItemCount: number
  buildingId: number
  buildingLevel: number
  skills: HeroSkillEntry[]
}

export interface BenefitEntry {
  Source: number
  Type: number
  Value: number
}

export interface HeroSkillEntry {
  id: number
  heroId: number
  skillId: number
  skillSlot: number
  unlockLevel: number
  unlockStar: number
  icon: string
  displayName?: string
  description?: string
  typeDesc?: string
  param1?: any
  [key: string]: any
}

export interface Skill {
  id: number
  priority: number
  initCd: number
  rockBackCd: number
  target: number
  targetParam: any
  damageFactorExpr: string
  [key: string]: any
}

export interface Item {
  id: string
  type: number
  typeSub: number
  grade: number
  icon: string
  value: any[]
  autoUse: number
  batchUseLimit: number
  [key: string]: any
}

export interface Building {
  id: string
  type: number
  classify: number
  canMove: number
  [key: string]: any
}

export interface Formula {
  id?: number
  expression: string
}

export interface MonsterInfo {
  id: number
  modelId: number
  attrId: number
  [key: string]: any
}

// ── Loaders ──────────────────────────────────────────────────────────

export function getHeroes(): Record<string, Hero> {
  return loadJson('heroes.json')
}

export function getHeroList(): Hero[] {
  const heroes = getHeroes()
  return Object.values(heroes)
    .sort((a, b) => b.quality - a.quality || (a.displayName || a.name).localeCompare(b.displayName || b.name))
}

export function heroDisplayName(h: Hero): string {
  return h.displayName || h.name || `Hero #${h.id}`
}

export function getHero(id: string): Hero | null {
  const heroes = getHeroes()
  return heroes[id] || null
}

export function getItems(): Record<string, Item> {
  return loadJson('items.json')
}

export function getBuildings(): Record<string, Building> {
  return loadJson('buildings.json')
}

export function getBuildingUpgrades(): Record<string, any> {
  return loadJson('building_upgrades.json')
}

export function getSkills(): Record<string, Skill> {
  return loadJson('skills.json')
}

export function getSkillEffects(): Record<string, any> {
  return loadJson('skill_effects.json')
}

export function getFormulas(): Record<string, Formula> {
  return loadJson('formulas.json')
}

export function getMonsters(): Record<string, MonsterInfo> {
  return loadJson('monsters.json')
}

export function getSoldiers(): Record<string, any> {
  return loadJson('soldiers.json')
}

export function getResearch(): Record<string, any> {
  return loadJson('research.json')
}

export function getHeroLevels(): Record<string, any> {
  return loadJson('hero_levels.json')
}

export function getHeroStars(): Record<string, any> {
  return loadJson('hero_stars.json')
}

export function getHonorWall(): Record<string, any> {
  return loadJson('honor_wall.json')
}

export function getActivities(): Record<string, any> {
  return loadJson('activities.json')
}

export function getVip(): Record<string, any> {
  return loadJson('vip.json')
}

export function getDrops(): Record<string, any> {
  return loadJson('drops.json')
}

export function getEquipment(): Record<string, any> {
  return loadJson('equipment.json')
}

export function getExchangeShop(): Record<string, any> {
  return loadJson('exchange_shop.json')
}

export function getParameters(): Record<string, any> {
  return loadJson('parameters.json')
}

// ── Utility: quality/rarity ──────────────────────────────────────────
// Game rarity: 0=R, 4=SR, 5=UR

export function qualityName(q: number): string {
  return { 0: 'SR', 1: 'SR', 2: 'SR', 3: 'SR', 4: 'SSR', 5: 'UR', 6: 'UR' }[q] || 'SR'
}

export function qualityColor(q: number): string {
  return {
    0: 'text-asylum-quality-blue',     // SR
    4: 'text-asylum-quality-purple',   // SSR
    5: 'text-asylum-quality-orange',   // UR
    6: 'text-asylum-quality-red',      // UR+
  }[q] || 'text-asylum-muted'
}

export function qualityBg(q: number): string {
  return {
    4: 'bg-purple-500/10 border-purple-500/30',    // SR
    5: 'bg-orange-500/10 border-orange-500/30',    // UR
    6: 'bg-red-500/10 border-red-500/30',          // UR+
  }[q] || 'bg-asylum-surface border-asylum-border'
}

// ── Benefit type names ───────────────────────────────────────────────

const BENEFIT_TYPES: Record<number, string> = {
  10001: 'Attack',
  10002: 'Defense',
  10003: 'HP',
  10004: 'Speed',
  10005: 'Load',
  10010: 'Infantry ATK',
  10011: 'Infantry DEF',
  10012: 'Infantry HP',
  10016: 'Training Speed',
  10020: 'Vehicle ATK',
  10021: 'Vehicle DEF',
  10022: 'Vehicle HP',
  10030: 'Aircraft ATK',
  10031: 'Aircraft DEF',
  10032: 'Aircraft HP',
  10201: 'Infantry ATK Bonus',
  10202: 'Vehicle ATK Bonus',
  10203: 'Aircraft ATK Bonus',
}

export function benefitTypeName(type: number): string {
  return BENEFIT_TYPES[type] || `Stat #${type}`
}

// ── Image paths ──────────────────────────────────────────────

export function heroImagePath(hero: Hero, type: 'portrait' | 'thumbnail' | 'bust' | 'honor' = 'portrait'): string {
  const field = { portrait: 'heroIcon', thumbnail: 'image', bust: 'heroPic', honor: 'honorImage' }[type]
  const dir = type === 'bust' ? 'busts' : 'heroes'
  const ref = (hero as any)[field] || ''
  if (!ref) return ''
  return `/images/${dir}/${ref}.png`
}

export function itemImagePath(icon: string): string {
  if (!icon) return ''
  return `/images/items/${icon}.png`
}

export function skillImagePath(icon: string): string {
  if (!icon) return ''
  return `/images/skills/${icon}.png`
}

export function researchImagePath(icon: string): string {
  if (!icon) return ''
  return `/images/research/${icon}.png`
}

// ── Hero Stat Computation ──────────────────────────────────────────

interface LevelEntry {
  level: number
  type: number
  attrs: Record<string, number>
}

interface StarEntry {
  star: number
  attrs: Record<string, number>
}

let _heroLevelData: Record<string, LevelEntry> | null = null
let _heroStarData: Record<string, StarEntry> | null = null

function loadHeroLevelData(): Record<string, LevelEntry> {
  if (!_heroLevelData) {
    try { _heroLevelData = loadJson<Record<string, LevelEntry>>('heroLevels.json') }
    catch { _heroLevelData = {} }
  }
  return _heroLevelData
}

function loadHeroStarData(): Record<string, StarEntry> {
  if (!_heroStarData) {
    try { _heroStarData = loadJson<Record<string, StarEntry>>('heroStars.json') }
    catch { _heroStarData = {} }
  }
  return _heroStarData
}

// Stat type IDs
export const STAT = {
  CMD: 10001, HP: 10002, ATK: 10003, DEF: 10004,
  HP_RATIO: 10201, ATK_RATIO: 10202, DEF_RATIO: 10203,
} as const

// Stat type names
export const STAT_NAMES: Record<number, string> = {
  10001: 'CMD', 10002: 'HP', 10003: 'ATK', 10004: 'DEF',
  10005: 'Hero HP↑', 10006: 'Hero ATK↑', 10007: 'Hero DEF↑',
  10008: 'Ranger Hero HP↑', 10009: 'Ranger Hero ATK↑', 10010: 'Ranger Hero DEF↑',
  10011: 'Warlock Hero HP↑', 10012: 'Warlock Hero ATK↑', 10013: 'Warlock Hero DEF↑',
  10014: 'Warrior Hero HP↑', 10015: 'Warrior Hero ATK↑', 10016: 'Warrior Hero DEF↑',
  10017: 'Hero DMG↑', 10018: 'Physical DMG↑', 10019: 'Energy DMG↑',
  10020: 'Ranger Hero DMG↑', 10021: 'Warlock Hero DMG↑', 10022: 'Warrior Hero DMG↑',
  10023: 'Hero DMG Taken↓', 10026: 'DMG to Monsters↑', 10027: 'Monster DMG Taken↓',
  10028: 'DMG When Countering↑', 10029: 'DMG When Countered↓',
  10030: 'Crit Rate↑', 10031: 'Crit Rate Taken↓',
  10032: 'Crit DMG↑', 10033: 'Crit DMG Taken↓',
  10034: 'Skill CD Speed', 10035: 'Physical DMG RES', 10036: 'Energy DMG RES',
  10037: 'DMG RES', 10040: 'DMG↓', 10106: 'Soldier Load↑',
  10201: 'HP Growth', 10202: 'ATK Growth', 10203: 'DEF Growth',
}

export interface HeroStats {
  hp: number
  atk: number
  def: number
  cmd: number
  levelBenefitType: number | null
  levelBenefitValue: number  // total % at this level
  levelBenefitName: string
}

export function computeHeroStats(hero: Hero, level: number, star: number): HeroStats {
  const levels = loadHeroLevelData()
  const stars = loadHeroStarData()
  const template = hero.levelTemplate || 1

  // Get level ratios
  const levelRatios: Record<number, number> = {}
  for (const r of hero.levelRatio || []) {
    levelRatios[r.Type] = r.Value
  }
  const starRatios: Record<number, number> = {}
  for (const r of hero.starRatio || []) {
    starRatios[r.Type] = r.Value
  }

  // Find level entry matching template and level
  let levelAttrs: Record<string, number> = {}
  for (const entry of Object.values(levels)) {
    if (entry.type === template && entry.level === level) {
      levelAttrs = entry.attrs
      break
    }
  }

  // Find star entry
  let starAttrs: Record<string, number> = {}
  const starKey = String(star + 1) // key 1 = star 0, key 51 = star 50
  if (stars[starKey]) {
    starAttrs = stars[starKey].attrs
  }

  // Compute: base × ratio (level) + base × ratio (star)
  const hpBase = (levelAttrs['10002'] || 0) * (levelRatios[STAT.HP_RATIO] || 1)
  const atkBase = (levelAttrs['10003'] || 0) * (levelRatios[STAT.ATK_RATIO] || 1)
  const defBase = (levelAttrs['10004'] || 0) * (levelRatios[STAT.DEF_RATIO] || 1)
  const cmd = levelAttrs['10001'] || 0

  const hpStar = (starAttrs['10002'] || 0) * (starRatios[STAT.HP_RATIO] || 1)
  const atkStar = (starAttrs['10003'] || 0) * (starRatios[STAT.ATK_RATIO] || 1)
  const defStar = (starAttrs['10004'] || 0) * (starRatios[STAT.DEF_RATIO] || 1)

  // Level benefit (per-level % bonus)
  const lb = hero.levelBenefit?.[0]
  const lbType = lb?.Type || null
  const lbValue = (lb?.Value || 0) * level  // total % at this level

  return {
    hp: Math.round(hpBase + hpStar),
    atk: Math.round(atkBase + atkStar),
    def: Math.round(defBase + defStar),
    cmd: Math.round(cmd),
    levelBenefitType: lbType,
    levelBenefitValue: lbValue,
    levelBenefitName: lbType ? (STAT_NAMES[lbType] || `Stat #${lbType}`) : '',
  }
}

export function getMaxLevel(hero: Hero): number {
  const template = hero.levelTemplate || 1
  const levels = loadHeroLevelData()
  let max = 1
  for (const entry of Object.values(levels)) {
    if (entry.type === template && entry.level > max) max = entry.level
  }
  return Math.min(max, 150) // Game caps at 150
}

export function getMaxStar(hero: Hero): number {
  return hero.heroStarRating || 50
}
