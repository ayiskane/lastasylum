/**
 * Display name helpers for game entities.
 * Names come from the locale file (_locale_en.json) when available,
 * with fallbacks for entities not covered by locale data.
 */

// Hero names from selectIcon: "Pic_Hero_MaxSteele_List_Q" → "Max Steele"
export function heroName(selectIcon: string): string {
  const m = selectIcon.match(/Pic_Hero_(.+?)_List/)
  if (!m) return selectIcon
  return m[1].replace(/([a-z])([A-Z])/g, '$1 $2')
}

// Item names from IDs like "item_food_50k" → "Food 50K"
export function itemName(id: string): string {
  let name = id
    .replace(/^item_/, '')
    .replace(/_/g, ' ')
    .replace(/\b(\d+)k\b/gi, (_, n) => `${n}K`)
    .replace(/\b(\d+)m\b/gi, (_, n) => `${n}M`)
  // Title case
  return name.replace(/\b\w/g, c => c.toUpperCase())
}

// Building names from type/ID
const BUILDING_NAMES: Record<string, string> = {
  '5001': 'Castle', '5002': 'Farm', '5003': 'Sawmill', '5004': 'Iron Mine',
  '5005': 'Power Storage', '5006': 'Granary', '5007': 'Metal Warehouse',
  '5008': 'Hospital', '5009': 'Infantry Battalion', '5010': 'Tank Center',
  '5011': 'Aircraft Center', '5012': 'Missile Center',
  '5013': 'Parade Ground', '5014': 'College', '5015': 'Embassy',
  '5016': 'Squad', '5017': 'Watch Tower', '5018': 'City Wall',
  '5019': 'Scouts', '5020': 'Bar', '5021': 'Worker Cabin',
  '5022': 'Equipment Smelter', '5023': 'Material Workshop',
  '5024': 'Drone Comp Factory', '5025': 'Soul Stone Factory',
  '5044': 'Hero Hall',
}

export function buildingName(id: string): string {
  return BUILDING_NAMES[id] || `Building #${id}`
}

// Camp/class type names (from HeroCamp locale)
const CAMP_NAMES: Record<number, string> = {
  0: 'None',
  1: 'Ranger',
  2: 'Warlock',
  3: 'Warrior',
}

// Army type names
const ARMY_TYPE_NAMES: Record<number, string> = {
  0: 'Universal',
  1: 'Infantry',
  2: 'Vehicle',
  3: 'Aircraft',
}

export function campName(type: number): string {
  return CAMP_NAMES[type] || `Class ${type}`
}

export function armyTypeName(type: number): string {
  return ARMY_TYPE_NAMES[type] || `Army ${type}`
}

// Soldier type names (from SoldierType locale)
const SOLDIER_TYPES: Record<number, string> = {
  1: 'Frontline',
  5: 'Support',
}

export function soldierName(type: number, level: number): string {
  return `${SOLDIER_TYPES[type] || `Troop ${type}`} T${level}`
}

// Skill slot names
export function skillSlotName(slot: number): string {
  return {
    1: 'Skill 1', 2: 'Skill 2', 3: 'Skill 3', 4: 'Skill 4',
    5: 'Passive 1', 6: 'Passive 2', 7: 'Passive 3', 8: 'Passive 4',
  }[slot] || `Slot ${slot}`
}

// Benefit/stat type names (comprehensive)
export const STAT_NAMES: Record<number, string> = {
  10001: 'Attack', 10002: 'Defense', 10003: 'HP', 10004: 'Speed', 10005: 'Load Capacity',
  10010: 'Infantry ATK', 10011: 'Infantry DEF', 10012: 'Infantry HP',
  10013: 'Infantry Speed', 10014: 'Infantry Load',
  10016: 'Training Speed', 10017: 'Healing Speed',
  10020: 'Vehicle ATK', 10021: 'Vehicle DEF', 10022: 'Vehicle HP',
  10023: 'Vehicle Speed', 10024: 'Vehicle Load',
  10030: 'Aircraft ATK', 10031: 'Aircraft DEF', 10032: 'Aircraft HP',
  10033: 'Aircraft Speed', 10034: 'Aircraft Load',
  10040: 'Research Speed', 10041: 'Construction Speed',
  10042: 'Resource Production', 10043: 'March Speed',
  10044: 'Food Production', 10045: 'Wood Production',
  10046: 'Iron Production', 10047: 'Energy Production',
  10050: 'Troop Capacity', 10051: 'Hospital Capacity',
  10060: 'Monster ATK', 10061: 'Monster DEF',
  10201: 'Infantry ATK Bonus', 10202: 'Vehicle ATK Bonus', 10203: 'Aircraft ATK Bonus',
}

export function statName(type: number): string {
  return STAT_NAMES[type] || `Stat #${type}`
}
