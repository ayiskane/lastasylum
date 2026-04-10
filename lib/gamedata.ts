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
  const ref = (hero as any)[field] || ''
  if (!ref) return ''
  return `/images/heroes/${ref}.png`
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
