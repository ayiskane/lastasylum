import { getItems, getBuildings } from '@/lib/gamedata'
import { readFileSync } from 'fs'
import { join } from 'path'
import { NextResponse } from 'next/server'

function loadLocale(): Record<string, any> {
  try {
    return JSON.parse(readFileSync(join(process.cwd(), 'data', 'wiki', '_locale_en.json'), 'utf-8'))
  } catch { return {} }
}

function loadJson(name: string): Record<string, any> {
  try {
    return JSON.parse(readFileSync(join(process.cwd(), 'data', 'wiki', name), 'utf-8'))
  } catch { return {} }
}

const RARITY_MAP: Record<string, string> = {
  poor: 'R', common: 'SR', premium: 'SSR', rare: 'UR', legendary: 'Legendary',
}
const RARITY_ORDER = ['Legendary', 'UR', 'SSR', 'SR', 'R']

interface EffectValue { label: string; value: string }

// Role → building + effects per rarity
// Values will be replaced with real data from WorkerPost if available
const ROLE_DATA: Record<string, {
  building: string
  effectsByRarity: Record<string, EffectValue[]>
}> = {
  'Farmer': { building: 'Farm', effectsByRarity: {
    Legendary: [{label:'Food Output', value:'+10%'}, {label:'Production Time', value:'+4h'}],
    UR: [{label:'Food Output', value:'+8%'}, {label:'Production Time', value:'+3h'}],
    SSR: [{label:'Food Output', value:'+5%'}, {label:'Production Time', value:'+2h'}],
    SR: [{label:'Food Output', value:'+3%'}, {label:'Production Time', value:'+1h'}],
    R: [{label:'Food Output', value:'+1%'}],
  }},
  'Lumberjack': { building: 'Lumberyard', effectsByRarity: {
    Legendary: [{label:'Timber Output', value:'+10%'}, {label:'Production Time', value:'+4h'}],
    UR: [{label:'Timber Output', value:'+8%'}, {label:'Production Time', value:'+3h'}],
    SSR: [{label:'Timber Output', value:'+5%'}, {label:'Production Time', value:'+2h'}],
    SR: [{label:'Timber Output', value:'+3%'}, {label:'Production Time', value:'+1h'}],
    R: [{label:'Timber Output', value:'+1%'}],
  }},
  'Herbalist': { building: 'Herb Garden', effectsByRarity: {
    Legendary: [{label:'Herb Output', value:'+10%'}, {label:'Production Time', value:'+4h'}],
    UR: [{label:'Herb Output', value:'+8%'}, {label:'Production Time', value:'+3h'}],
    SSR: [{label:'Herb Output', value:'+5%'}, {label:'Production Time', value:'+2h'}],
    SR: [{label:'Herb Output', value:'+3%'}, {label:'Production Time', value:'+1h'}],
    R: [{label:'Herb Output', value:'+1%'}],
  }},
  'Nurse': { building: 'Infirmary', effectsByRarity: {
    Legendary: [{label:'Healing Speed', value:'+10%'}, {label:'Capacity', value:'+500'}],
    UR: [{label:'Healing Speed', value:'+8%'}, {label:'Capacity', value:'+350'}],
    SSR: [{label:'Healing Speed', value:'+5%'}, {label:'Capacity', value:'+200'}],
    SR: [{label:'Healing Speed', value:'+3%'}, {label:'Capacity', value:'+100'}],
    R: [{label:'Healing Speed', value:'+1%'}],
  }},
  'Officer': { building: 'Barracks', effectsByRarity: {
    Legendary: [{label:'Troop Capacity', value:'+2,400'}],
    UR: [{label:'Troop Capacity', value:'+1,600'}],
    SSR: [{label:'Troop Capacity', value:'+1,000'}],
    SR: [{label:'Troop Capacity', value:'+500'}],
    R: [{label:'Troop Capacity', value:'+200'}],
  }},
  'Instructor': { building: 'Training Grounds', effectsByRarity: {
    Legendary: [{label:'Training Cap', value:'+500'}, {label:'Soldier Lv', value:'+2'}],
    UR: [{label:'Training Cap', value:'+350'}],
    SSR: [{label:'Training Cap', value:'+200'}],
    SR: [{label:'Training Cap', value:'+100'}],
    R: [{label:'Training Cap', value:'+50'}],
  }},
  'Researcher': { building: 'Research Lab', effectsByRarity: {
    Legendary: [{label:'Research Speed', value:'+10%'}, {label:'Free Speedup', value:'+30min'}],
    UR: [{label:'Research Speed', value:'+8%'}, {label:'Free Speedup', value:'+15min'}],
    SSR: [{label:'Research Speed', value:'+5%'}],
    SR: [{label:'Research Speed', value:'+3%'}],
    R: [{label:'Research Speed', value:'+1%'}],
  }},
  'Builder': { building: "Builder's Hut", effectsByRarity: {
    Legendary: [{label:'Free Speedup', value:'+30min'}],
    UR: [{label:'Free Speedup', value:'+15min'}],
    SSR: [{label:'Free Speedup', value:'+10min'}],
    SR: [{label:'Free Speedup', value:'+5min'}],
    R: [{label:'Free Speedup', value:'+2min'}],
  }},
  'Blacksmith': { building: 'Gear Workshop', effectsByRarity: {
    Legendary: [{label:'Crafting Speed', value:'+10%'}],
    UR: [{label:'Crafting Speed', value:'+8%'}],
    SSR: [{label:'Crafting Speed', value:'+5%'}],
    SR: [{label:'Crafting Speed', value:'+3%'}],
    R: [{label:'Crafting Speed', value:'+1%'}],
  }},
  'Explorer': { building: "Explorer's Camp", effectsByRarity: {
    Legendary: [{label:'Loot Output', value:'+10%'}, {label:'Idle Time', value:'+4h'}],
    UR: [{label:'Loot Output', value:'+8%'}, {label:'Idle Time', value:'+3h'}],
    SSR: [{label:'Loot Output', value:'+5%'}],
    SR: [{label:'Loot Output', value:'+3%'}],
    R: [{label:'Loot Output', value:'+1%'}],
  }},
  'Attendant': { building: 'Tavern', effectsByRarity: {
    Legendary: [{label:'Hero Recruit CD', value:'-10%'}, {label:'Survivor CD', value:'-10%'}],
    UR: [{label:'Hero Recruit CD', value:'-8%'}],
    SSR: [{label:'Hero Recruit CD', value:'-5%'}],
    SR: [{label:'Hero Recruit CD', value:'-3%'}],
    R: [{label:'Hero Recruit CD', value:'-1%'}],
  }},
  'Liaison': { building: 'Alliance Hall', effectsByRarity: {
    Legendary: [{label:'Help Count', value:'+5'}, {label:'Help Duration', value:'+30min'}],
    UR: [{label:'Help Count', value:'+3'}],
    SSR: [{label:'Help Count', value:'+2'}],
  }},
  'Grain Keeper': { building: 'Granary', effectsByRarity: {
    Legendary: [{label:'Protected Grain', value:'+10%'}],
    UR: [{label:'Protected Grain', value:'+8%'}],
    SSR: [{label:'Protected Grain', value:'+5%'}],
    SR: [{label:'Protected Grain', value:'+3%'}],
    R: [{label:'Protected Grain', value:'+1%'}],
  }},
  'Timber Keeper': { building: 'Lumber Depot', effectsByRarity: {
    Legendary: [{label:'Protected Timber', value:'+10%'}],
    UR: [{label:'Protected Timber', value:'+8%'}],
    SSR: [{label:'Protected Timber', value:'+5%'}],
    SR: [{label:'Protected Timber', value:'+3%'}],
    R: [{label:'Protected Timber', value:'+1%'}],
  }},
  'Herb Keeper': { building: 'Herb Storage', effectsByRarity: {
    Legendary: [{label:'Protected Herb', value:'+10%'}],
    UR: [{label:'Protected Herb', value:'+8%'}],
    SSR: [{label:'Protected Herb', value:'+5%'}],
    SR: [{label:'Protected Herb', value:'+3%'}],
    R: [{label:'Protected Herb', value:'+1%'}],
  }},
}

export async function GET() {
  const items = getItems()
  const buildings = getBuildings()
  const locale = loadLocale()
  const workerLocale = locale.Worker || {}

  // Try loading WorkerPost data for real stat values
  const workerPosts = loadJson('worker_posts.json')

  const roleGroups: Record<string, any> = {}

  for (const [id, item] of Object.entries(items) as [string, any][]) {
    if (item.type !== 'Worker') continue
    const parts = id.replace('item_worker_', '').split('_')
    const rarityKey = parts[0] || ''
    const rarity = RARITY_MAP[rarityKey]
    if (!rarity) continue

    const rewardId = item.reward?.[0]?.id || ''
    const wloc = workerLocale[rewardId] || {}
    const role = wloc.postName || ''
    if (!role) continue

    const groupRole = role === 'Bartender' ? 'Attendant' : role

    if (!roleGroups[groupRole]) {
      const rd = ROLE_DATA[role] || ROLE_DATA[groupRole] || { building: 'Unknown', effectsByRarity: {} }
      let slots = 4
      for (const b of Object.values(buildings) as any[]) {
        if ((b.displayName || '').toLowerCase() === rd.building.toLowerCase() && b.workerPostNum) {
          slots = b.workerPostNum; break
        }
      }
      roleGroups[groupRole] = {
        role: groupRole, building: rd.building, buildingSlots: slots,
        effectsByRarity: rd.effectsByRarity,
        rarities: {}, icon: '', totalCount: 0,
      }
    }

    if (!roleGroups[groupRole].rarities[rarity]) {
      roleGroups[groupRole].rarities[rarity] = { count: 0, names: [] }
    }
    roleGroups[groupRole].rarities[rarity].count++
    roleGroups[groupRole].rarities[rarity].names.push(wloc.workerName || item.displayName || '')
    roleGroups[groupRole].totalCount++
    if (!roleGroups[groupRole].icon && item.icon) roleGroups[groupRole].icon = item.icon
  }

  // Special survivors — find icons from chip items by ID pattern
  const specialIcons: Record<string, string> = {}
  for (const [id, item] of Object.entries(items) as [string, any][]) {
    if (id.includes('worker') && id.includes('chip')) {
      const rewardType = item.reward?.[0]?.type
      if (rewardType) specialIcons[String(rewardType)] = item.icon || ''
    }
  }

  const specials = [
    {
      id: 'freya', name: 'Freya', role: 'Bounty Hunter',
      icon: specialIcons['10390'] || '',
      description: 'Bounty Hunter Freya allows you to gain extra treasures during the Falcon Quest!',
      trait: 'Smart',
      effects: [
        { label: 'Falcon Quest', value: 'Extra SR Chest' },
        { label: 'Chest Upgrade', value: 'SR → Deluxe' },
        { label: 'Daily Bonus', value: 'Extra chests from daily quests' },
      ],
    },
    {
      id: 'elaine', name: 'Elaine', role: 'Shadow Mercenary',
      icon: specialIcons['10391'] || '',
      description: "Shadow Mercenary Elaine can increase all Heroes' CMD and significantly boost ATK.",
      trait: 'Kind',
      effects: [
        { label: 'All Heroes', value: 'CMD↑' },
        { label: 'Ranger Hero', value: 'CMD↑' },
        { label: 'Warlock Hero', value: 'CMD↑' },
        { label: 'Warrior Hero', value: 'CMD↑' },
        { label: 'ATK', value: 'Significant Boost' },
      ],
    },
  ]

  const sortedRoles = Object.values(roleGroups).sort((a: any, b: any) => b.totalCount - a.totalCount)

  return NextResponse.json({ roles: sortedRoles, specials, rarityOrder: RARITY_ORDER })
}
