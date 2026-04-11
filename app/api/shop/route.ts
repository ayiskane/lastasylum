import { getItems } from '@/lib/gamedata'
import { readFileSync } from 'fs'
import { join } from 'path'
import { NextResponse } from 'next/server'

function loadJson(name: string): Record<string, any> {
  try {
    return JSON.parse(readFileSync(join(process.cwd(), 'data', 'wiki', name), 'utf-8'))
  } catch { return {} }
}

const PRICE_TIERS: Record<string, number> = {
  product_1: 0.99, product_2: 4.99, product_3: 9.99,
  product_4: 14.99, product_5: 19.99, product_6: 24.99,
  product_7: 29.99, product_8: 49.99, product_10: 99.99,
  product_11: 149.99, product_12: 199.99, product_21: 4.99,
}

const PRICE_LABELS: Record<string, string> = {
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

// Speedup rate: ~1.3 diamonds per minute (derived from shop: 5m=8, 60m=72)
const SPEEDUP_RATE = 1.3
const GEMS_PER_DOLLAR = 100

export async function GET() {
  const gifts = loadJson('gifts.json')
  const allItems = getItems()
  const eshop = loadJson('exchange_shop.json')

  if (!gifts || !Object.keys(gifts).length) {
    return NextResponse.json({ tabs: [], eventPacks: {} })
  }

  // Build diamond price lookup from exchange shop
  const diamondPrices: Record<string, number> = {}
  for (const entry of Object.values(eshop) as any[]) {
    for (const price of entry.price || []) {
      if (price.type === 11) {
        const cost = Math.abs(price.count || 0)
        for (const item of entry.item || []) {
          const iid = item.id || ''
          const count = item.count || 1
          if (iid && cost > 0) {
            const perUnit = cost / count
            if (!diamondPrices[iid] || perUnit < diamondPrices[iid]) {
              diamondPrices[iid] = perUnit
            }
          }
        }
      }
    }
  }

  function getItemGemValue(iid: string): number | null {
    if (diamondPrices[iid]) return diamondPrices[iid]
    const item = allItems[iid] || {} as any
    const val = Number(item.value) || 0
    if (val > 0 && iid.includes('SpeedUp')) return val * SPEEDUP_RATE
    if (val > 0 && iid.includes('vipPoint')) return val * 1.0
    return null
  }

  function resolveItems(packItems: any[]): any[] {
    return (packItems || []).map(item => {
      const itype = item.type
      const iid = item.id || ''
      const count = item.count || 0
      if (itype === 11) return { name: 'Diamonds', icon: 'icon_zuanshi', count, rarity: 'blue', gemValue: count }
      if (itype === 21) return { name: 'Banknotes', icon: 'icon_chaopiao', count, rarity: 'orange', gemValue: 0 }
      if (itype === 12) return { name: 'VIP EXP', icon: 'icon_vip', count, rarity: 'purple', gemValue: count }
      if (itype === 99 && iid) {
        const itemData = allItems[iid] || {} as any
        const q = itemData.quality
        const g = itemData.itemGrade
        let rarity = 'gray'
        if (q === null || q === undefined) rarity = g === 4 ? 'purple' : g === 3 ? 'blue' : 'orange'
        else if (q === 6) rarity = 'red'
        else if (q === 4) rarity = 'purple'
        else if (q === 3) rarity = 'blue'
        else if (q === 2) rarity = 'green'

        const unitGemValue = getItemGemValue(iid)
        return {
          name: itemData.displayName || iid.replace(/^item_/, '').replace(/_/g, ' '),
          icon: itemData.icon || '', count, rarity,
          gemValue: unitGemValue ? Math.round(unitGemValue * count) : null,
        }
      }
      return { name: 'Unknown', icon: '', count, rarity: 'gray', gemValue: null }
    })
  }

  const tabGroups: Record<number, any[]> = {}
  const uncategorized: any[] = []

  for (const [gid, gift] of Object.entries(gifts) as [string, any][]) {
    const name = gift.giftName || ''
    if (!name) continue

    const resolvedItems = resolveItems(gift.item || [])
    const priceId = gift.actualPriceID || ''
    const priceUsd = PRICE_TIERS[priceId] || 0
    const priceLabel = PRICE_LABELS[priceId] || ''
    const rebate = gift.rebateRatio

    // Calculate total gem value
    const totalGemValue = resolvedItems.reduce((sum: number, i: any) => sum + (i.gemValue || 0), 0)
    const valuedCount = resolvedItems.filter((i: any) => i.gemValue !== null).length
    const totalCount = resolvedItems.length
    const gemCost = priceUsd * GEMS_PER_DOLLAR

    // Value ratio: how much gem value you get per gem spent
    const valueRatio = gemCost > 0 && totalGemValue > 0 ? totalGemValue / gemCost : null

    const pack = {
      id: gid, name, text: gift.text || '', giftType: gift.giftType || '',
      price: priceLabel, priceUsd, rebate: rebate > 0 ? rebate : null,
      icon: gift.giftIcon || '', items: resolvedItems,
      purchaseLimit: gift.purchaseLimit || null, sort: gift.giftSort || 0,
      totalGemValue: totalGemValue > 0 ? Math.round(totalGemValue) : null,
      valueRatio: valueRatio ? Math.round(valueRatio * 10) / 10 : null,
      valueCoverage: totalCount > 0 ? Math.round(valuedCount / totalCount * 100) : 0,
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

  const tabs = Object.entries(SHOP_TABS)
    .map(([tabId, meta]) => ({
      id: Number(tabId), name: meta.name, slogan: meta.slogan, sort: meta.sort,
      packs: (tabGroups[Number(tabId)] || []).sort((a: any, b: any) => (b.sort || 0) - (a.sort || 0)),
    }))
    .filter(t => t.packs.length > 0)
    .sort((a, b) => a.sort - b.sort)

  const eventPacks: Record<string, any[]> = {}
  for (const pack of uncategorized) {
    const gt = pack.giftType || 'other'
    ;(eventPacks[gt] ??= []).push(pack)
  }

  return NextResponse.json({ tabs, eventPacks })
}
