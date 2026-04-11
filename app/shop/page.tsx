'use client'

import { useEffect, useState, useMemo } from 'react'
import GameImage from '@/components/GameImage'

interface PackItem {
  name: string; icon: string; count: number; rarity: string; gemValue: number | null
}
interface Pack {
  id: string; name: string; text: string; giftType: string
  price: string; priceUsd: number; rebate: number | null
  icon: string; items: PackItem[]; purchaseLimit: number | null; sort: number
  totalGemValue: number | null; valueRatio: number | null; valueCoverage: number
}
interface ShopTab {
  id: number; name: string; slogan: string; sort: number; packs: Pack[]
}
interface ShopData {
  tabs: ShopTab[]; eventPacks: Record<string, Pack[]>
}

const TYPE_LABELS: Record<string, string> = {
  allianceChallenge: 'Alliance Challenge', dailyMustBuy: 'Daily Must-Buy',
  baseGift: 'Pack Shop', hero_pack: 'Hero Pack', battle_pass: 'Battle Pass',
  supremeCommander: 'Supreme Commander', mainUIGiftPack: 'Special Pack',
  preparation: 'Preparation', vip_pack: 'VIP Pack', gotoGift: 'Goto Gift',
  joy_coin_pack: 'Joy Spin', ultimate_prize_gift: 'Ultimate Prize',
  weeklyGift: 'Weekly Gift', dailyGift: 'Daily Gift', flip_card: 'Flip Card',
  luckyDraw_gift: 'Lucky Draw', air_drop: 'Air Drop', diamond_pack: 'Diamond',
  easter: 'Easter Event', flash_market: 'Flash Market', radar_task: 'Intel',
}

type SortMode = 'default' | 'value' | 'price_low' | 'price_high'

export default function ShopPage() {
  const [data, setData] = useState<ShopData | null>(null)
  const [activeTab, setActiveTab] = useState<number>(0)
  const [showEvents, setShowEvents] = useState(false)
  const [sortMode, setSortMode] = useState<SortMode>('default')

  useEffect(() => {
    fetch('/api/shop').then(r => r.json()).then(d => {
      setData(d)
      if (d.tabs?.length) setActiveTab(d.tabs[0].id)
    }).catch(() => {})
  }, [])

  const currentTab = data?.tabs.find(t => t.id === activeTab)

  const sortedPacks = useMemo(() => {
    if (!currentTab) return []
    const packs = [...currentTab.packs]
    switch (sortMode) {
      case 'value': return packs.sort((a, b) => (b.valueRatio || 0) - (a.valueRatio || 0))
      case 'price_low': return packs.sort((a, b) => (a.priceUsd || 999) - (b.priceUsd || 999))
      case 'price_high': return packs.sort((a, b) => (b.priceUsd || 0) - (a.priceUsd || 0))
      default: return packs
    }
  }, [currentTab, sortMode])

  if (!data) {
    return (
      <div>
        <h1 className="font-display text-4xl text-asylum-accent tracking-wider mb-2">SHOP</h1>
        <p className="text-asylum-muted">Loading shop data...</p>
      </div>
    )
  }

  const eventTypes = Object.entries(data.eventPacks || {}).sort((a, b) => b[1].length - a[1].length)
  const totalPacks = data.tabs.reduce((s, t) => s + t.packs.length, 0) +
    Object.values(data.eventPacks || {}).reduce((s, p) => s + p.length, 0)

  return (
    <div>
      <h1 className="font-display text-4xl text-asylum-accent tracking-wider mb-2">SHOP</h1>
      <p className="text-asylum-muted mb-1">{totalPacks} packs across {data.tabs.length} shop tabs</p>
      <p className="text-[10px] text-asylum-muted/60 mb-6">Gem values based on exchange shop diamond prices. Higher ratio = better deal.</p>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto mb-4 pb-1 scrollbar-hide">
        {data.tabs.map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setShowEvents(false) }}
            className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === tab.id && !showEvents
                ? 'bg-asylum-accent/15 text-asylum-accent border border-asylum-accent/30'
                : 'bg-asylum-surface border border-asylum-border text-asylum-muted hover:text-asylum-text'
            }`}>
            {tab.name}<span className="ml-1 text-[10px] opacity-60">{tab.packs.length}</span>
          </button>
        ))}
        {eventTypes.length > 0 && (
          <button onClick={() => setShowEvents(true)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              showEvents ? 'bg-asylum-accent/15 text-asylum-accent border border-asylum-accent/30'
                : 'bg-asylum-surface border border-asylum-border text-asylum-muted hover:text-asylum-text'
            }`}>
            Event Packs<span className="ml-1 text-[10px] opacity-60">{Object.values(data.eventPacks).reduce((s, p) => s + p.length, 0)}</span>
          </button>
        )}
      </div>

      {/* Sort controls */}
      {!showEvents && (
        <div className="flex gap-2 mb-4">
          {(['default', 'value', 'price_low', 'price_high'] as SortMode[]).map(mode => (
            <button key={mode} onClick={() => setSortMode(mode)}
              className={`text-[10px] px-2 py-1 rounded transition-colors ${
                sortMode === mode ? 'bg-asylum-accent/15 text-asylum-accent' : 'text-asylum-muted hover:text-asylum-text'
              }`}>
              {mode === 'default' ? 'Default' : mode === 'value' ? 'Best Value' : mode === 'price_low' ? 'Price ↑' : 'Price ↓'}
            </button>
          ))}
        </div>
      )}

      {/* Tab content */}
      {!showEvents && currentTab && (
        <div>
          <p className="text-xs text-asylum-muted mb-4">{currentTab.slogan}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sortedPacks.map(pack => <PackCard key={pack.id} pack={pack} />)}
          </div>
        </div>
      )}

      {showEvents && (
        <div className="space-y-6">
          {eventTypes.map(([giftType, packs]) => (
            <div key={giftType}>
              <h3 className="text-sm font-semibold text-asylum-text mb-3">
                {TYPE_LABELS[giftType] || giftType}
                <span className="ml-2 text-xs text-asylum-muted font-normal">{packs.length} packs</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {packs.slice(0, 12).map(pack => <PackCard key={pack.id} pack={pack} />)}
              </div>
              {packs.length > 12 && <p className="text-xs text-asylum-muted mt-2">+{packs.length - 12} more</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function getValueColor(ratio: number | null): string {
  if (!ratio) return 'text-asylum-muted'
  if (ratio >= 10) return 'text-emerald-400'
  if (ratio >= 5) return 'text-green-400'
  if (ratio >= 2) return 'text-blue-400'
  if (ratio >= 1) return 'text-asylum-accent'
  return 'text-red-400'
}

function getValueLabel(ratio: number | null): string {
  if (!ratio) return ''
  if (ratio >= 10) return 'Exceptional'
  if (ratio >= 5) return 'Great'
  if (ratio >= 2) return 'Good'
  if (ratio >= 1) return 'Fair'
  return 'Poor'
}

function PackCard({ pack }: { pack: Pack }) {
  const valueColor = getValueColor(pack.valueRatio)
  const valueLabel = getValueLabel(pack.valueRatio)

  return (
    <div className="bg-asylum-surface border border-asylum-border rounded-xl overflow-hidden">
      {/* Header with price and value */}
      <div className="p-3 border-b border-asylum-border/50">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="font-semibold text-sm text-asylum-text truncate">{pack.name}</div>
          {pack.price && (
            <span className="text-xs font-mono text-asylum-accent bg-asylum-accent/10 border border-asylum-accent/20 rounded px-2 py-0.5 shrink-0">
              {pack.price}
            </span>
          )}
        </div>
        {/* Value analysis bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {pack.totalGemValue && (
            <span className="text-[10px] text-asylum-muted">
              💎 {pack.totalGemValue.toLocaleString()} gem value
            </span>
          )}
          {pack.valueRatio && (
            <span className={`text-[10px] font-semibold ${valueColor}`}>
              {pack.valueRatio}x {valueLabel}
            </span>
          )}
          {pack.valueCoverage < 100 && pack.valueCoverage > 0 && (
            <span className="text-[10px] text-asylum-muted/50">{pack.valueCoverage}% priced</span>
          )}
          {pack.purchaseLimit && (
            <span className="text-[10px] text-asylum-muted">Limit: {pack.purchaseLimit}×</span>
          )}
        </div>
      </div>

      {/* Item grid with icons */}
      <div className="p-3">
        <div className="grid grid-cols-4 gap-2">
          {pack.items.slice(0, 8).map((item, i) => (
            <ItemIcon key={i} item={item} />
          ))}
        </div>
        {pack.items.length > 8 && (
          <div className="text-[10px] text-asylum-muted text-center mt-2">+{pack.items.length - 8} more</div>
        )}
      </div>
    </div>
  )
}

const RARITY_FRAME: Record<string, string> = {
  gray: 'Icon_item_white', green: 'Icon_item_green', blue: 'Icon_item_blue',
  purple: 'Icon_item_purple', orange: 'Icon_item_yellow', red: 'Icon_item_red',
}
const RARITY_TEXT: Record<string, string> = {
  gray: 'text-gray-400', green: 'text-emerald-400', blue: 'text-blue-400',
  purple: 'text-purple-400', orange: 'text-amber-400', red: 'text-red-400',
}

function ItemIcon({ item }: { item: PackItem }) {
  const frame = RARITY_FRAME[item.rarity] || RARITY_FRAME.gray
  const textColor = RARITY_TEXT[item.rarity] || RARITY_TEXT.gray

  return (
    <div className="flex flex-col items-center text-center group relative">
      <div className="w-11 h-11 relative mb-1">
        <img src={`/images/items/${frame}.png`} alt="" className="absolute inset-0 w-full h-full" />
        <div className="absolute inset-1 overflow-hidden">
          <GameImage src={item.icon ? `/images/items/${item.icon}.png` : ''} alt={item.name} fallback="📦" className="w-full h-full" />
        </div>
      </div>
      <span className={`text-[10px] font-mono font-semibold leading-tight ${textColor}`}>
        {item.count >= 1000 ? `${(item.count / 1000).toFixed(item.count % 1000 === 0 ? 0 : 1)}K` : item.count.toLocaleString()}
      </span>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-asylum-bg border border-asylum-border rounded text-[10px] text-asylum-text whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
        {item.name}{item.gemValue ? ` (💎${item.gemValue.toLocaleString()})` : ''}
      </div>
    </div>
  )
}
