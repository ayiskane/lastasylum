import Link from 'next/link'
import { getHeroList, heroDisplayName, heroImagePath } from '@/lib/gamedata'
import GameImage from '@/components/GameImage'

const QUALITY_CARD: Record<number, { border: string; bg: string; text: string }> = {
  2: { border: 'border-green-500/50', bg: 'bg-gradient-to-b from-[#1a4a2a] to-[#0f2818]', text: 'text-green-400' },
  3: { border: 'border-[#4a7ec2]/50', bg: 'bg-gradient-to-b from-[#2a4a7a] to-[#162845]', text: 'text-blue-400' },
  4: { border: 'border-[#9855d4]/50', bg: 'bg-gradient-to-b from-[#6b2fa0] to-[#351660]', text: 'text-purple-400' },
  5: { border: 'border-[#d4943a]/50', bg: 'bg-gradient-to-b from-[#c88520] to-[#704010]', text: 'text-amber-400' },
  6: { border: 'border-red-500/50', bg: 'bg-gradient-to-b from-[#a02020] to-[#501010]', text: 'text-red-400' },
}

export default function HeroesPage() {
  const heroes = getHeroList()

  const byQuality: Record<number, typeof heroes> = {}
  for (const h of heroes) {
    ;(byQuality[h.quality] ??= []).push(h)
  }

  const qualityOrder = [6, 5, 4, 3, 0]
  const qualityLabels: Record<number, string> = {
    6: 'UR+', 5: 'UR', 4: 'SSR', 3: 'SR', 0: 'SR',
  }

  return (
    <div>
      <h1 className="font-display text-4xl text-asylum-accent tracking-wider mb-2">HEROES</h1>
      <p className="text-asylum-muted mb-8">{heroes.length} heroes across all rarity tiers</p>

      {qualityOrder.map(q => {
        const list = byQuality[q]
        if (!list?.length) return null
        const style = QUALITY_CARD[q] || QUALITY_CARD[4]
        return (
          <section key={q} className="mb-10">
            <h2 className={`font-display text-xl tracking-wide mb-4 ${style.text}`}>
              {qualityLabels[q] || `Quality ${q}`}
              <span className="text-sm text-asylum-muted font-normal ml-2">({list.length})</span>
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {list.map(hero => {
                const name = heroDisplayName(hero)
                const iconSrc = heroImagePath(hero, 'portrait') // pic_card4 = 144×144 square
                return (
                  <Link key={hero.id} href={`/heroes/${hero.id}`}
                    className="group flex flex-col items-center gap-1.5 transition-transform hover:scale-105">
                    {/* Square icon with rarity frame */}
                    <div className={`w-[72px] h-[72px] rounded-xl border-2 ${style.border} ${style.bg} p-0.5 overflow-hidden transition-all group-hover:border-opacity-100 group-hover:shadow-lg`}>
                      <div className="w-full h-full rounded-[10px] overflow-hidden">
                        <GameImage
                          src={iconSrc}
                          alt={name}
                          fallback="⚔️"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    {/* Name */}
                    <span className="text-[11px] font-semibold text-asylum-text text-center leading-tight group-hover:text-asylum-accent transition-colors truncate max-w-[80px]">
                      {name}
                    </span>
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
