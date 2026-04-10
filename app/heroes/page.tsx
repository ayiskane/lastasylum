import Link from 'next/link'
import { getHeroList, heroDisplayName, heroImagePath } from '@/lib/gamedata'
import GameImage from '@/components/GameImage'

export default function HeroesPage() {
  const heroes = getHeroList()

  const byQuality: Record<number, typeof heroes> = {}
  for (const h of heroes) {
    ;(byQuality[h.quality] ??= []).push(h)
  }

  const qualityOrder = [6, 5, 4, 0]
  const qualityLabels: Record<number, string> = {
    6: 'UR+', 5: 'UR', 4: 'SSR', 0: 'SR',
  }
  const qualityAccent: Record<number, string> = {
    6: 'text-red-400 border-red-500/30', 5: 'text-orange-400 border-orange-500/30',
    4: 'text-purple-400 border-purple-500/30', 0: 'text-blue-400 border-blue-500/30',
  }

  return (
    <div>
      <h1 className="font-display text-4xl text-asylum-accent tracking-wider mb-2">HEROES</h1>
      <p className="text-asylum-muted mb-8">{heroes.length} heroes across all rarity tiers</p>

      {qualityOrder.map(q => {
        const list = byQuality[q]
        if (!list?.length) return null
        const accent = qualityAccent[q] || 'text-gray-400 border-gray-500/30'
        return (
          <section key={q} className="mb-10">
            <h2 className={`font-display text-xl tracking-wide mb-4 ${accent.split(' ')[0]}`}>
              {qualityLabels[q] || `Quality ${q}`} ({list.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {list.map(hero => {
                const imgSrc = heroImagePath(hero, 'portrait')
                return (
                  <Link key={hero.id} href={`/heroes/${hero.id}`}
                    className={`hero-card bg-asylum-surface border rounded-lg p-3 hover:border-opacity-60 transition-all ${accent.split(' ')[1]}`}>
                    <div className={`w-16 h-16 mx-auto mb-2 rounded-full border overflow-hidden ${accent.split(' ')[1]}`}>
                      <GameImage src={imgSrc} alt={heroDisplayName(hero)} className="w-full h-full" />
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-sm text-asylum-text truncate">{heroDisplayName(hero)}</div>
                      <div className={`text-xs ${accent.split(' ')[0]}`}>{hero.qualityName}</div>
                      <div className="text-xs text-asylum-muted mt-0.5">{hero.armyName}</div>
                      {hero.maxAbility > 0 && (
                        <div className="text-xs text-asylum-accent mt-1">⚡ {hero.maxAbility.toLocaleString()}</div>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
