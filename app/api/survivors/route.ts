import { getItems, getBuildings } from '@/lib/gamedata'
import { readFileSync } from 'fs'
import { join } from 'path'
import { NextResponse } from 'next/server'

function loadLocale(): Record<string, any> {
  try {
    return JSON.parse(readFileSync(join(process.cwd(), 'data', 'wiki', '_locale_en.json'), 'utf-8'))
  } catch { return {} }
}

const RARITY_MAP: Record<string, string> = {
  poor: 'R', common: 'SR', premium: 'SSR', rare: 'UR', legendary: 'Legendary', token: 'SR',
}

const RARITY_ORDER = ['Legendary', 'UR', 'SSR', 'SR', 'R']

// Role → Building mapping based on game data
const ROLE_BUILDINGS: Record<string, { building: string; effects: string[] }> = {
  'Farmer': { building: 'Farm', effects: ['Food Output', 'Max Production Time'] },
  'Lumberjack': { building: 'Lumberyard', effects: ['Timber Output', 'Max Production Time'] },
  'Herbalist': { building: 'Herb Garden', effects: ['Herb Output', 'Max Production Time'] },
  'Nurse': { building: 'Infirmary', effects: ['Healing Speed', 'Infirmary Capacity'] },
  'Officer': { building: 'Barracks', effects: ['Troop Capacity'] },
  'Instructor': { building: 'Training Grounds', effects: ['Training Capacity', 'Soldier Training Level'] },
  'Researcher': { building: 'Research Lab', effects: ['Research Speed', 'Free Speedup Time'] },
  'Builder': { building: "Builder's Hut", effects: ['Free Speedup Time'] },
  'Blacksmith': { building: 'Gear Workshop', effects: ['Crafting Speed', 'Herb Cost Reduction'] },
  'Explorer': { building: "Explorer's Camp", effects: ['Loot Output', 'Accumulated Idle Time'] },
  'Attendant': { building: 'Tavern', effects: ['Hero Recruit CD', 'Survivor Recruit CD'] },
  'Bartender': { building: 'Tavern', effects: ['Hero Recruit CD'] },
  'Liaison': { building: 'Alliance Hall', effects: ['Alliance Help Count', 'Help Duration'] },
  'Grain Keeper': { building: 'Granary', effects: ['Protected Grain'] },
  'Timber Keeper': { building: 'Lumber Depot', effects: ['Protected Timber'] },
  'Herb Keeper': { building: 'Herb Storage', effects: ['Protected Herb'] },
}

export async function GET() {
  const items = getItems()
  const buildings = getBuildings()
  const locale = loadLocale()
  const workerLocale = locale.Worker || {}

  // Build role groups
  const roleGroups: Record<string, {
    role: string; building: string; buildingSlots: number; effects: string[]
    rarities: Record<string, { count: number; names: string[] }>
    icon: string; totalCount: number
  }> = {}

  for (const [id, item] of Object.entries(items) as [string, any][]) {
    if (item.type !== 'Worker') continue

    const parts = id.replace('item_worker_', '').split('_')
    const rarityKey = parts[0] || ''
    const rarity = RARITY_MAP[rarityKey] || 'R'

    const rewardId = item.reward?.[0]?.id || ''
    const wloc = workerLocale[rewardId] || {}
    const role = wloc.postName || ''
    if (!role) continue

    // Merge Bartender into Attendant group
    const groupRole = role === 'Bartender' ? 'Attendant' : role

    if (!roleGroups[groupRole]) {
      const bInfo = ROLE_BUILDINGS[role] || ROLE_BUILDINGS[groupRole] || { building: 'Unknown', effects: [] }

      // Find building slot count
      let slots = 4
      for (const b of Object.values(buildings) as any[]) {
        const bName = (b.displayName || '').toLowerCase()
        if (bName === bInfo.building.toLowerCase() && b.workerPostNum) {
          slots = b.workerPostNum
          break
        }
      }

      roleGroups[groupRole] = {
        role: groupRole,
        building: bInfo.building,
        buildingSlots: slots,
        effects: bInfo.effects,
        rarities: {},
        icon: item.icon || '',
        totalCount: 0,
      }
    }

    if (!roleGroups[groupRole].rarities[rarity]) {
      roleGroups[groupRole].rarities[rarity] = { count: 0, names: [] }
    }
    roleGroups[groupRole].rarities[rarity].count++
    roleGroups[groupRole].rarities[rarity].names.push(wloc.workerName || item.displayName || '')
    roleGroups[groupRole].totalCount++

    // Use the first icon found
    if (!roleGroups[groupRole].icon && item.icon) {
      roleGroups[groupRole].icon = item.icon
    }
  }

  // Build specials
  const specialIcons: Record<string, string> = {}
  for (const [id, item] of Object.entries(items) as [string, any][]) {
    if (id.includes('_chip') && item.type === 'Worker') {
      const rewardType = item.reward?.[0]?.type
      if (rewardType) specialIcons[String(rewardType)] = item.icon || ''
    }
  }

  const specials = [
    {
      id: 'freya',
      name: 'Freya',
      role: 'Bounty Hunter',
      icon: specialIcons['10390'] || '',
      description: 'Bounty Hunter Freya allows you to gain extra treasures during the Falcon Quest!',
      trait: 'Smart',
      effects: [
        'Gain an extra SR Chest for each Falcon Quest',
        'Upgrade the extra SR Chest to a Deluxe Chest',
        'Extra chests from each Falcon Quest',
      ],
    },
    {
      id: 'elaine',
      name: 'Elaine',
      role: 'Shadow Mercenary',
      icon: specialIcons['10391'] || '',
      description: "Shadow Mercenary Elaine can increase all Heroes' CMD and significantly boost ATK.",
      trait: 'Kind',
      effects: [
        'All Heroes CMD↑',
        'Ranger Hero CMD↑',
        'Warlock Hero CMD↑',
        'Warrior Hero CMD↑',
      ],
    },
  ]

  // Sort roles by total count descending
  const sortedRoles = Object.values(roleGroups).sort((a, b) => b.totalCount - a.totalCount)

  return NextResponse.json({ roles: sortedRoles, specials, rarityOrder: RARITY_ORDER })
}
