import { getBuildings } from '@/lib/gamedata'
import GameImage from '@/components/GameImage'
import Link from 'next/link'

function formatTime(seconds: number): string {
  if (!seconds) return '—'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m`
  return `${seconds}s`
}

export default function BuildingsPage() {
  const buildings = getBuildings()

  const actual = Object.values(buildings)
    .filter((b: any) => b.id < 10000 && b.name)
    .sort((a: any, b: any) => a.id - b.id)
  const decorations = Object.values(buildings)
    .filter((b: any) => b.id >= 10000 && b.name)
    .sort((a: any, b: any) => a.id - b.id)

  return (
    <div className="max-w-[960px] mx-auto px-4 py-8">
      <Link href="/" className="text-xs text-asylum-muted hover:text-asylum-accent mb-4 inline-block">← Home</Link>
      <h1 className="text-2xl font-bold text-asylum-accent mb-1" style={{ fontFamily: "'Rajdhani', sans-serif" }}>Buildings</h1>
      <p className="text-sm text-asylum-muted mb-6">{actual.length} buildings · {decorations.length} decorations</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {actual.map((b: any) => {
          const maxLvData = b.levels?.[String(b.maxLevel)]
          return (
            <Link key={b.id} href={`/buildings/${b.id}`}
              className="bg-asylum-surface border border-asylum-border rounded-xl p-3 hover:border-asylum-accent/40 transition-colors flex gap-3 items-start">
              <div className="w-14 h-14 shrink-0 bg-asylum-bg rounded-lg overflow-hidden flex items-center justify-center">
                <GameImage src={`/images/buildings/${b.icon}.png`} alt={b.name}
                  fallbackSrc={`/images/buildings/${b.id}.png`} className="w-full h-full object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-asylum-text truncate">{b.name}</div>
                {b.description && <div className="text-[11px] text-asylum-muted truncate">{b.description}</div>}
                <div className="flex gap-3 mt-1 text-[10px] text-asylum-hint">
                  {b.maxLevel > 0 && <span>Max Lv.{b.maxLevel}</span>}
                  {maxLvData?.time > 0 && <span>{formatTime(maxLvData.time)}</span>}
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {decorations.length > 0 && (
        <>
          <h2 className="text-lg font-bold text-asylum-accent mb-3" style={{ fontFamily: "'Rajdhani', sans-serif" }}>Decorations</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {decorations.map((b: any) => (
              <div key={b.id} className="bg-asylum-surface border border-asylum-border rounded-lg p-2 flex gap-2 items-center opacity-70">
                <div className="w-8 h-8 shrink-0 bg-asylum-bg rounded overflow-hidden">
                  <GameImage src={`/images/buildings/${b.icon}.png`} alt={b.name}
                    fallbackSrc={`/images/buildings/${b.id}.png`} className="w-full h-full object-contain" />
                </div>
                <div className="text-xs text-asylum-muted truncate">{b.name}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
