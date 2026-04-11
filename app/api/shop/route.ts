import { getItems } from '@/lib/gamedata'
import { readFileSync } from 'fs'
import { join } from 'path'
import { NextResponse } from 'next/server'

function loadJson(name: string): Record<string, any> {
  try {
    return JSON.parse(readFileSync(join(process.cwd(), 'data', 'wiki', name), 'utf-8'))
  } catch { return {} }
}

const PRICE_TIERS: Record<string, string> = {
  product_1: '$0.99', product_2: '$4.99', product_3: '$9.99',
  product_4: '$14.99', product_5: '$19.99', product_6: '$24.99',
  product_7: '$29.99', product_8: '$49.99', product_10: '$99.99',
  product_11: '$149.99', product_12: '$199.99', product_21: '$4.99',
}

const SHOP_TABS: Record<number, { name: string; slogan: string; sort: number }> = {
  90020: { name: 'Daily Offer', slogan: 'Daily Power Boost!', sort: 1 },
  90080: { name: 'Daily Must-Buy', slogan: 'Enhance your strength!', sort: 2 },
  90090: { name: 'Weekly Special', slogan: 'Limited weekly offers!', sort: 3 },
  90030: { name: 'Pack Shop', slogan: 'Powerful Items!', sort: 4 },
  90040: { name: 'Benefits', slogan: 'Continuous Rewards!', sort: 5 },
  90070: { name: 'Weekly Pass', slogan: 'Rewards throughout the week!', sort: 6 },
  90060: { name: 'Monthly Pass', slogan: 'Monthly surprise rewards!', sort: 7 },
  90050: { name: 'Double Diamonds', slogan: 'Doubled for 1st purchase!', sort: 8 },
  90100: { name: 'Banknote', slogan: 'Universal pack currency', sort: 9 },
}

export async function GET() {
  const gifts = loadJson('gifts.json')
  const allItems = getItems()

  if (!gifts || !Object.keys(gifts).length) {
    return NextResponse.json({ tabs: [], uncategorized: [] })
  }

  // Resolve item names
  function resolveItems(packItems: any[]): any[] {
    return (packItems || []).map(item => {
      const itype = item.type
      const iid = item.id || ''
      const count = item.count || 0
      if (itype === 11) return { name: 'Diamonds', icon: '💎', count, category: 'currency' }
      if (itype === 21) return { name: 'Banknotes', icon: '🎫', count, category: 'currency' }
      if (itype === 99 && iid) {
        const itemData = allItems[iid] || {}
        return {
          name: itemData.displayName || iid.replace(/^item_/, '').replace(/_/g, ' '),
          icon: itemData.icon || '',
          count,
          category: itemData.type || 'item',
        }
      }
      return { name: `Type ${itype}`, icon: '', count, category: 'other' }
    })
  }

  // Group by shop tab
  const tabGroups: Record<number, any[]> = {}
  const uncategorized: any[] = []

  for (const [gid, gift] of Object.entries(gifts) as [string, any][]) {
    const name = gift.giftName || ''
    if (!name) continue

    const items = resolveItems(gift.item || [])
    const priceId = gift.actualPriceID || ''
    const price = PRICE_TIERS[priceId] || (priceId ? priceId : '')
    const rebate = gift.rebateRatio

    const pack = {
      id: gid,
      name,
      text: gift.text || '',
      giftType: gift.giftType || '',
      price,
      priceId,
      rebate: rebate > 0 ? rebate : null,
      icon: gift.giftIcon || '',
      items,
      purchaseLimit: gift.purchaseLimit || null,
      sort: gift.giftSort || 0,
    }

    const shopLabel = gift.shopLabel
    if (typeof shopLabel === 'number' && SHOP_TABS[shopLabel]) {
      (tabGroups[shopLabel] ??= []).push(pack)
    } else if (Array.isArray(shopLabel)) {
      for (const sl of shopLabel) {
        if (SHOP_TABS[sl]) (tabGroups[sl] ??= []).push(pack)
      }
    } else if (gift.giftType && name) {
      uncategorized.push(pack)
    }
  }

  // Build tab data sorted
  const tabs = Object.entries(SHOP_TABS)
    .map(([tabId, meta]) => ({
      id: Number(tabId),
      name: meta.name,
      slogan: meta.slogan,
      sort: meta.sort,
      packs: (tabGroups[Number(tabId)] || []).sort((a: any, b: any) => (b.sort || 0) - (a.sort || 0)),
    }))
    .filter(t => t.packs.length > 0)
    .sort((a, b) => a.sort - b.sort)

  // Group uncategorized by giftType
  const eventPacks: Record<string, any[]> = {}
  for (const pack of uncategorized) {
    const gt = pack.giftType || 'other'
    ;(eventPacks[gt] ??= []).push(pack)
  }

  return NextResponse.json({ tabs, eventPacks })
}
