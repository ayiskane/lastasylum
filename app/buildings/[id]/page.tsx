import { getBuildings } from '@/lib/gamedata'
import GameImage from '@/components/GameImage'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export async function generateStaticParams() {
  const buildings = getBuildings()
  return Object.values(buildings)
    .filter((b: any) => b.id < 10000 && b.name)
    .map((b: any) => ({ id: String(b.id) }))
}

function formatTime(seconds: number): string {
  if (!seconds) return '—'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const parts = []
  if (d > 0) parts.push(`${d}d`)
  if (h > 0) parts.push(`${h}h`)
  if (m > 0) parts.push(`${m}m`)
  if (s > 0 && d === 0) parts.push(`${s}s`)
  return parts.join(' ') || '0s'
}

function formatNum(n: number): string {
  if (!n) return '—'
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

export default function BuildingDetailPage({ params }: { params: { id: string } }) {
  const buildings = getBuildings()
  const building = Object.values(buildings).find((b: any) => String(b.id) === params.id) as any
  if (!building) return notFound()

  const allBuildings = buildings as Record<string, any>
  const levels = Object.values(building.levels || {})
    .sort((a: any, b: any) => a.level - b.level) as any[]

  // Compute totals
  let totalGrain = 0, totalTimber = 0, totalHerb = 0, totalTime = 0
  for (const lv of levels) {
    totalGrain += lv.grain || 0
    totalTimber += lv.timber || 0
    totalHerb += lv.herb || 0
    totalTime += lv.time || 0
  }

  return (
    <div className="max-w-[960px] mx-auto px-4 py-8">
      <Link href="/buildings" className="text-xs text-asylum-muted hover:text-asylum-accent mb-4 inline-block">← Back to Buildings</Link>

      {/* Header */}
      <div className="flex gap-4 items-start mb-6">
        <div className="w-20 h-20 shrink-0 bg-asylum-surface border border-asylum-border rounded-xl overflow-hidden flex items-center justify-center">
          <GameImage src={`/images/buildings/${building.icon}.png`} alt={building.name}
            fallbackSrc={`/images/buildings/${building.id}.png`} className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-asylum-accent" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
            {building.name}
          </h1>
          {building.description && (
            <p className="text-sm text-asylum-muted mt-0.5">{building.description}</p>
          )}
          <div className="flex gap-4 mt-2 text-xs text-asylum-hint">
            <span>Max Level: <span className="text-asylum-text font-semibold">{building.maxLevel}</span></span>
            <span>Total Time: <span className="text-asylum-text font-semibold">{formatTime(totalTime)}</span></span>
          </div>
        </div>
      </div>

      {/* Resource totals */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="bg-asylum-surface border border-asylum-border rounded-lg px-3 py-2 text-center">
          <div className="text-[9px] text-asylum-hint uppercase tracking-wider mb-0.5">Total Grain</div>
          <div className="text-sm font-bold text-[#e8c44e] font-mono">{formatNum(totalGrain)}</div>
        </div>
        <div className="bg-asylum-surface border border-asylum-border rounded-lg px-3 py-2 text-center">
          <div className="text-[9px] text-asylum-hint uppercase tracking-wider mb-0.5">Total Timber</div>
          <div className="text-sm font-bold text-[#8b6b3e] font-mono">{formatNum(totalTimber)}</div>
        </div>
        <div className="bg-asylum-surface border border-asylum-border rounded-lg px-3 py-2 text-center">
          <div className="text-[9px] text-asylum-hint uppercase tracking-wider mb-0.5">Total Herb</div>
          <div className="text-sm font-bold text-[#5ea060] font-mono">{formatNum(totalHerb)}</div>
        </div>
      </div>

      {/* Upgrade table */}
      {levels.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-asylum-border bg-asylum-surface">
                <th className="text-left text-[9px] text-asylum-hint uppercase tracking-wider py-2 px-2 font-semibold">Lv</th>
                <th className="text-right text-[9px] text-asylum-hint uppercase tracking-wider py-2 px-2 font-semibold">Grain</th>
                <th className="text-right text-[9px] text-asylum-hint uppercase tracking-wider py-2 px-2 font-semibold">Timber</th>
                <th className="text-right text-[9px] text-asylum-hint uppercase tracking-wider py-2 px-2 font-semibold">Herb</th>
                <th className="text-right text-[9px] text-asylum-hint uppercase tracking-wider py-2 px-2 font-semibold">Time</th>
                <th className="text-right text-[9px] text-asylum-hint uppercase tracking-wider py-2 px-2 font-semibold">Power</th>
                <th className="text-left text-[9px] text-asylum-hint uppercase tracking-wider py-2 px-2 font-semibold">Requires</th>
              </tr>
            </thead>
            <tbody>
              {levels.map((lv: any) => {
                const prereqs = (lv.prerequisites || [])
                  .filter((p: any) => p.buildingId && p.level)
                  .map((p: any) => {
                    const prereqBuilding = Object.values(allBuildings).find((b: any) => b.id === p.buildingId) as any
                    return `${prereqBuilding?.name || `#${p.buildingId}`} Lv.${p.level}`
                  })
                return (
                  <tr key={lv.level} className="border-b border-white/[0.03] hover:bg-asylum-surface/50">
                    <td className="py-1.5 px-2 font-semibold text-asylum-text">{lv.level}</td>
                    <td className="py-1.5 px-2 text-right font-mono text-[#e8c44e]">{lv.grain ? formatNum(lv.grain) : '—'}</td>
                    <td className="py-1.5 px-2 text-right font-mono text-[#8b6b3e]">{lv.timber ? formatNum(lv.timber) : '—'}</td>
                    <td className="py-1.5 px-2 text-right font-mono text-[#5ea060]">{lv.herb ? formatNum(lv.herb) : '—'}</td>
                    <td className="py-1.5 px-2 text-right font-mono text-asylum-muted">{formatTime(lv.time)}</td>
                    <td className="py-1.5 px-2 text-right font-mono text-asylum-muted">{lv.power ? lv.power.toLocaleString() : '—'}</td>
                    <td className="py-1.5 px-2 text-asylum-hint text-[10px]">{prereqs.join(', ') || '—'}</td>
                  </tr>
                )
              })}
              {/* Totals row */}
              <tr className="border-t-2 border-asylum-accent/30 bg-asylum-surface/30 font-semibold">
                <td className="py-2 px-2 text-asylum-accent">Total</td>
                <td className="py-2 px-2 text-right font-mono text-[#e8c44e]">{formatNum(totalGrain)}</td>
                <td className="py-2 px-2 text-right font-mono text-[#8b6b3e]">{formatNum(totalTimber)}</td>
                <td className="py-2 px-2 text-right font-mono text-[#5ea060]">{formatNum(totalHerb)}</td>
                <td className="py-2 px-2 text-right font-mono text-asylum-muted">{formatTime(totalTime)}</td>
                <td className="py-2 px-2" />
                <td className="py-2 px-2" />
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
