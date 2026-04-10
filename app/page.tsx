import Link from 'next/link'
import { getHeroList, heroDisplayName, heroImagePath, getItems, getBuildings, getFormulas, getMonsters, getResearch } from '@/lib/gamedata'
import GameImage from '@/components/GameImage'
import { readFileSync } from 'fs'
import { join } from 'path'

function getVersion(): string {
  try {
    const raw = readFileSync(join(process.cwd(), 'data', 'wiki', '_summary.json'), 'utf-8')
    return JSON.parse(raw).version || 'unknown'
  } catch { return 'unknown' }
}

const SECTIONS = [
  { href: '/heroes',    label: 'Heroes',    icon: '⚔️', desc: 'All playable heroes with stats, skills & upgrade paths' },
  { href: '/items',     label: 'Items',     icon: '🎒', desc: 'Every item, fragment, material & equipment piece' },
  { href: '/buildings', label: 'Buildings', icon: '🏗️', desc: 'Building types, upgrade costs & production rates' },
  { href: '/troops',    label: 'Troops',    icon: '🔫', desc: 'Soldier types, tiers, and combat stats' },
  { href: '/research',  label: 'Research',  icon: '🔬', desc: 'All tech tree nodes with costs & benefits' },
  { href: '/formulas',  label: 'Formulas',  icon: '🧮', desc: 'Interactive calculators for every game formula' },
  { href: '/search',    label: 'Search',    icon: '🔍', desc: 'Search across all game data' },
]

export default function HomePage() {
  const heroes = getHeroList()
  const version = getVersion()
  const stats = [
    { label: 'Heroes', value: heroes.length },
    { label: 'Items', value: Object.keys(getItems()).length },
    { label: 'Buildings', value: Object.keys(getBuildings()).length },
    { label: 'Monsters', value: Object.keys(getMonsters()).length },
    { label: 'Research', value: Object.keys(getResearch()).length },
    { label: 'Formulas', value: Object.keys(getFormulas()).length },
  ]

  return (
    <div>
      <div className="text-center mb-12">
        <h1 className="font-display text-6xl text-asylum-accent tracking-widest mb-3">LAST ASYLUM</h1>
        <p className="text-lg text-asylum-muted max-w-xl mx-auto">
          Complete game database — every hero, item, building, formula, and mechanic, extracted from game data v{version}
        </p>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-12">
        {stats.map(s => (
          <div key={s.label} className="bg-asylum-surface border border-asylum-border rounded-lg p-3 text-center">
            <div className="font-display text-2xl text-asylum-accent">{s.value.toLocaleString()}</div>
            <div className="text-xs text-asylum-muted uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
        {SECTIONS.map(s => (
          <Link key={s.href} href={s.href}
            className="group bg-asylum-surface border border-asylum-border rounded-lg p-6 hover:border-asylum-accent/40 transition-colors">
            <div className="text-3xl mb-3">{s.icon}</div>
            <h2 className="font-display text-xl text-asylum-text tracking-wide group-hover:text-asylum-accent transition-colors">{s.label}</h2>
            <p className="text-sm text-asylum-muted mt-1">{s.desc}</p>
          </Link>
        ))}
      </div>

      <section>
        <h2 className="font-display text-2xl text-asylum-accent tracking-wide mb-4">TOP HEROES</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {heroes.filter(h => h.quality === 5).slice(0, 12).map(hero => (
            <Link key={hero.id} href={`/heroes/${hero.id}`}
              className="hero-card bg-asylum-surface border border-orange-500/30 rounded-lg p-3 text-center hover:border-orange-500/50 transition-all">
              <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-orange-500/10 border border-orange-500/30 overflow-hidden">
                <GameImage src={heroImagePath(hero, 'portrait')} alt={heroDisplayName(hero)} className="w-full h-full" />
              </div>
              <div className="font-semibold text-sm text-asylum-text truncate">{heroDisplayName(hero)}</div>
              <div className="text-xs text-orange-400">{hero.qualityName}</div>
              <div className="text-xs text-asylum-muted">{hero.armyName}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
