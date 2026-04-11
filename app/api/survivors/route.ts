import { getItems } from '@/lib/gamedata'
import { readFileSync } from 'fs'
import { join } from 'path'
import { NextResponse } from 'next/server'

function loadLocale(): Record<string, any> {
  try {
    const raw = readFileSync(join(process.cwd(), 'data', 'wiki', '_locale_en.json'), 'utf-8')
    return JSON.parse(raw)
  } catch { return {} }
}

export async function GET() {
  const items = getItems()
  const locale = loadLocale()
  const workerLocale = locale.Worker || {}

  const survivors: any[] = []

  // Workers from items
  for (const [id, item] of Object.entries(items) as [string, any][]) {
    if (item.type !== 'Worker') continue

    // Get worker locale via reward ID
    const rewardId = item.reward?.[0]?.id || ''
    const wloc = workerLocale[rewardId] || workerLocale[String(rewardId)] || {}

    // Determine rarity from ID pattern
    const parts = id.replace('item_worker_', '').split('_')
    const rarityKey = parts[0] || ''
    const rarityMap: Record<string, string> = {
      poor: 'R', common: 'SR', premium: 'SSR', rare: 'UR', legendary: 'Legendary', token: 'SR',
    }

    survivors.push({
      id,
      displayName: item.displayName || wloc.workerName || id,
      workerName: wloc.workerName || '',
      postName: wloc.postName || '',
      characterDes: wloc.characterDes || '',
      workerStory: wloc.workerStory || '',
      icon: item.icon || '',
      quality: item.quality,
      rarity: rarityMap[rarityKey] || 'R',
      rarityKey,
      isSpecial: ['Bounty Hunter', 'Shadow Mercenary'].includes(wloc.postName || ''),
    })
  }

  // Add special workers from locale that don't have item entries (Freya, Elaine)
  const existingRewardIds = new Set(
    survivors.map(s => {
      const item = (items as any)[s.id]
      return item?.reward?.[0]?.id || ''
    })
  )

  for (const [wid, wloc] of Object.entries(workerLocale) as [string, any][]) {
    if (!existingRewardIds.has(wid) && ['Bounty Hunter', 'Shadow Mercenary'].includes(wloc.postName || '')) {
      survivors.push({
        id: `special_${wid}`,
        displayName: `${wloc.postName} ${wloc.workerName}`,
        workerName: wloc.workerName || '',
        postName: wloc.postName || '',
        characterDes: wloc.characterDes || '',
        workerStory: wloc.workerStory || '',
        icon: '',
        quality: null,
        rarity: 'Special',
        rarityKey: 'special',
        isSpecial: true,
      })
    }
  }

  return NextResponse.json(survivors)
}
