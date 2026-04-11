'use client'

import { useEffect, useState } from 'react'

interface PackItem {
  name: string; icon: string; count: number; category: string
}
interface Pack {
  id: string; name: string; text: string; giftType: string
  price: string; priceId: string; rebate: number | null
  icon: string; items: PackItem[]; purchaseLimit: number | null; sort: number
}
interface ShopTab {
  id: number; name: string; slogan: string; sort: number; packs: Pack[]
}
interface ShopData {
  tabs: ShopTab[]
  eventPacks: Record<string, Pack[]>
}

const TYPE_LABELS: Record<string, string> = {
  allianceChallenge: 'Alliance Challenge', dailyMustBuy: 'Daily Must-Buy',
  baseGift: 'Pack Shop', hero_pack: 'Hero Pack', battle_pass: 'Battle Pass',
  supremeCommander: 'Supreme Commander', mainUIGiftPack: 'Main UI Gift',
  preparation: 'Preparation', vip_pack: 'VIP Pack', gotoGift: 'Goto Gift',
  joy_coin_pack: 'Joy Spin', ultimate_prize_gift: 'Ultimate Prize',
  weeklyGift: 'Weekly Gift', dailyGift: 'Daily Gift', flip_card: 'Flip Card',
  luckyDraw_gift: 'Lucky Draw', air_drop: 'Air Drop', diamond_pack: 'Diamond',
  easter: 'Easter Event', flash_market: 'Flash Market', radar_task: 'Intel',
}

export default function ShopPage() {
  const [data, setData] = useState<ShopData | null>(null)
  const [activeTab, setActiveTab] = useState<number>(0)
  const [showEvents, setShowEvents] = useState(false)

  useEffect(() => {
    fetch('/api/shop').then(r => r.json()).then(d => {
      setData(d)
      if (d.tabs?.length) setActiveTab(d.tabs[0].id)
    }).catch(() => {})
  }, [])

  if (!data) {
    return (
      <div>
        <h1 className="font-display text-4xl text-asylum-accent tracking-wider mb-2">SHOP</h1>
        <p className="text-asylum-muted">Loading shop data...</p>
      </div>
    )
  }

  const currentTab = data.tabs.find(t => t.id === activeTab)
  const eventTypes = Object.entries(data.eventPacks || {}).sort((a, b) => b[1].length - a[1].length)
  const totalPacks = data.tabs.reduce((s, t) => s + t.packs.length, 0) +
    Object.values(data.eventPacks || {}).reduce((s, p) => s + p.length, 0)

  return (
    <div>
      <h1 className="font-display text-4xl text-asylum-accent tracking-wider mb-2">SHOP</h1>
      <p className="text-asylum-muted mb-6">{totalPacks} packs across {data.tabs.length} shop tabs</p>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto mb-6 pb-1 scrollbar-hide">
        {data.tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setShowEvents(false) }}
            className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === tab.id && !showEvents
                ? 'bg-asylum-accent/15 text-asylum-accent border border-asylum-accent/30'
                : 'bg-asylum-surface border border-asylum-border text-asylum-muted hover:text-asylum-text'
            }`}
          >
            {tab.name}
            <span className="ml-1 text-[10px] opacity-60">{tab.packs.length}</span>
          </button>
        ))}
        {eventTypes.length > 0 && (
          <button
            onClick={() => setShowEvents(true)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              showEvents
                ? 'bg-asylum-accent/15 text-asylum-accent border border-asylum-accent/30'
                : 'bg-asylum-surface border border-asylum-border text-asylum-muted hover:text-asylum-text'
            }`}
          >
            Event Packs
            <span className="ml-1 text-[10px] opacity-60">{Object.values(data.eventPacks).reduce((s, p) => s + p.length, 0)}</span>
          </button>
        )}
      </div>

      {/* Tab content */}
      {!showEvents && currentTab && (
        <div>
          <p className="text-xs text-asylum-muted mb-4">{currentTab.slogan}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentTab.packs.map(pack => <PackCard key={pack.id} pack={pack} />)}
          </div>
        </div>
      )}

      {/* Event packs */}
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
              {packs.length > 12 && (
                <p className="text-xs text-asylum-muted mt-2">+{packs.length - 12} more packs</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PackCard({ pack }: { pack: Pack }) {
  const diamonds = pack.items.find(i => i.name === 'Diamonds')
  const otherItems = pack.items.filter(i => i.name !== 'Diamonds')

  return (
    <div className="bg-asylum-surface border border-asylum-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-asylum-border/50">
        <div className="flex items-center justify-between gap-2">
          <div className="font-semibold text-sm text-asylum-text truncate">{pack.name}</div>
          {pack.price && (
            <span className="text-xs font-mono text-asylum-accent bg-asylum-accent/10 border border-asylum-accent/20 rounded px-2 py-0.5 shrink-0">
              {pack.price}
            </span>
          )}
        </div>
        {(diamonds || pack.rebate) && (
          <div className="flex items-center gap-3 mt-1">
            {diamonds && (
              <span className="text-xs text-asylum-muted">💎 {diamonds.count.toLocaleString()}</span>
            )}
            {pack.rebate && pack.rebate > 0 && (
              <span className="text-[10px] text-green-400">Value {Math.round(pack.rebate)}%</span>
            )}
            {pack.purchaseLimit && (
              <span className="text-[10px] text-asylum-muted">Limit: {pack.purchaseLimit}×</span>
            )}
          </div>
        )}
      </div>

      {/* Items */}
      {otherItems.length > 0 && (
        <div className="p-3">
          <div className="space-y-1">
            {otherItems.slice(0, 5).map((item, i) => (
              <div key={i} className="flex items-center justify-between text-[11px]">
                <span className="text-asylum-muted truncate mr-2">{item.name}</span>
                <span className="text-asylum-text font-mono shrink-0">×{item.count.toLocaleString()}</span>
              </div>
            ))}
            {otherItems.length > 5 && (
              <div className="text-[10px] text-asylum-muted">+{otherItems.length - 5} more items</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
