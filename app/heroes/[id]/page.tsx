import { getHeroes, getHeroList, getSkills, heroDisplayName, heroImagePath, skillImagePath, benefitTypeName } from '@/lib/gamedata'
import GameImage from '@/components/GameImage'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export async function generateStaticParams() {
  return getHeroList().map(h => ({ id: h.id }))
}

function stripTags(s: string): string {
  return s.replace(/\[c\]\[[^\]]*\]/g, '').replace(/\[-\]\[\/c\]/g, '').replace(/\{(\d+)\}/g, 'X')
}

export default function HeroPage({ params }: { params: { id: string } }) {
  const hero = getHeroes()[params.id]
  if (!hero) return notFound()
  const skills = getSkills()

  const qc: Record<number, string> = {
    4: 'border-purple-500/50 text-purple-400', 5: 'border-orange-500/50 text-orange-400', 6: 'border-red-500/50 text-red-400',
  }
  const accent = qc[hero.quality] || 'border-asylum-border text-asylum-muted'
  const name = heroDisplayName(hero)

  return (
    <div>
      <Link href="/heroes" className="text-sm text-asylum-muted hover:text-asylum-accent mb-4 inline-block">← Back to Heroes</Link>

      <div className={`bg-asylum-surface border rounded-xl p-6 mb-6 ${accent.split(' ')[0]}`}>
        <div className="flex items-start gap-6">
          <div className={`w-28 h-28 rounded-xl border-2 overflow-hidden shrink-0 ${accent}`}>
            <GameImage src={heroImagePath(hero, 'portrait')} alt={name} className="w-full h-full" />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-4xl tracking-wider text-asylum-text">{name}</h1>
            <div className="flex gap-3 mt-2 flex-wrap">
              <span className={`text-sm font-semibold ${accent.split(' ')[1]}`}>{hero.qualityName}</span>
              <span className="text-sm text-asylum-muted">•</span>
              <span className="text-sm text-asylum-text">{hero.armyName}</span>
              {hero.campName && hero.campName !== 'None' && hero.campType > 0 && (
                <><span className="text-sm text-asylum-muted">•</span><span className="text-sm text-asylum-text">{hero.campName}</span></>
              )}
            </div>
            {hero.characterDes && <div className="text-sm text-asylum-muted mt-1 italic">{hero.characterDes}</div>}
            {hero.maxAbility > 0 && (
              <div className="mt-3 text-asylum-accent font-display text-xl">⚡ Max Power: {hero.maxAbility.toLocaleString()}</div>
            )}
          </div>
        </div>
        {hero.heroStory && <p className="mt-4 text-sm text-asylum-muted leading-relaxed border-t border-asylum-border/50 pt-4">{hero.heroStory}</p>}
        {hero.descRecruitPreview && <p className="mt-2 text-sm text-asylum-text/80 italic">{hero.descRecruitPreview}</p>}
      </div>

      {/* Thumbnail / Bust / Honor preview row */}
      <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
        {(['thumbnail', 'portrait', 'bust', 'honor'] as const).map(type => {
          const src = heroImagePath(hero, type)
          if (!src) return null
          const labels = { thumbnail: 'Card', portrait: 'Portrait', bust: 'Bust', honor: 'Honor' }
          return (
            <div key={type} className="shrink-0 text-center">
              <div className="w-20 h-24 rounded-lg border border-asylum-border overflow-hidden bg-asylum-surface">
                <GameImage src={src} alt={`${name} ${labels[type]}`} className="w-full h-full" />
              </div>
              <div className="text-xs text-asylum-muted mt-1">{labels[type]}</div>
            </div>
          )
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="bg-asylum-surface border border-asylum-border rounded-xl p-5">
          <h2 className="font-display text-lg text-asylum-accent tracking-wide mb-4">STATS</h2>
          <div className="space-y-2 text-sm">
            <StatRow label="Attack Speed" value={`${hero.attackCd}ms`} />
            <StatRow label="Attack Range" value={String(hero.attackRadius)} />
            {hero.rpgAttackRadius > 0 && <StatRow label="RPG Attack Range" value={String(hero.rpgAttackRadius)} />}
            <StatRow label="Max Honor Level" value={String(hero.maxHonorLevel)} />
            <StatRow label="Star Rating" value={String(hero.heroStarRating)} />
            <StatRow label="Skill Count" value={String(hero.skill_count)} />
            {hero.buildingLevel > 0 && <StatRow label="Unlock" value={`Building Lv.${hero.buildingLevel}`} />}
          </div>
        </section>

        <section className="bg-asylum-surface border border-asylum-border rounded-xl p-5">
          <h2 className="font-display text-lg text-asylum-accent tracking-wide mb-4">LEVEL SCALING</h2>
          {hero.levelRatio?.length > 0 ? (
            <div className="space-y-2 text-sm">
              {hero.levelRatio.map((r, i) => (
                <div key={`lr-${i}`} className="flex justify-between">
                  <span className="text-asylum-muted">{benefitTypeName(r.Type)}</span>
                  <span className="text-asylum-text font-mono">{(r.Value * 100).toFixed(1)}%/lv</span>
                </div>
              ))}
            </div>
          ) : <p className="text-asylum-muted text-sm">No level scaling data</p>}
          {hero.starRatio?.length > 0 && (
            <>
              <h3 className="font-display text-sm text-asylum-accent tracking-wide mt-5 mb-3">STAR SCALING</h3>
              <div className="space-y-2 text-sm">
                {hero.starRatio.map((r, i) => (
                  <div key={`sr-${i}`} className="flex justify-between">
                    <span className="text-asylum-muted">{benefitTypeName(r.Type)}</span>
                    <span className="text-asylum-text font-mono">{(r.Value * 100).toFixed(1)}%/★</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="bg-asylum-surface border border-asylum-border rounded-xl p-5 md:col-span-2">
          <h2 className="font-display text-lg text-asylum-accent tracking-wide mb-4">SKILLS ({hero.skills.length})</h2>
          {hero.skills.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-3">
              {hero.skills.map((sk, i) => {
                const skillData = skills[String(sk.skillId)]
                return (
                  <div key={sk.id || `sk-${i}`} className="bg-asylum-bg border border-asylum-border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded bg-asylum-accent/10 border border-asylum-accent/20 overflow-hidden shrink-0">
                        <GameImage src={skillImagePath(sk.icon)} alt={sk.displayName || 'Skill'} fallback="⚡" className="w-full h-full" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-asylum-text">{sk.displayName || `Skill #${sk.skillId}`}</span>
                          {sk.typeDesc && <span className="text-xs text-blue-400">{stripTags(sk.typeDesc)}</span>}
                        </div>
                        {sk.description && <p className="text-xs text-asylum-muted mt-1">{stripTags(sk.description)}</p>}
                        <div className="text-xs text-asylum-muted/60 mt-1">
                          {sk.unlockLevel > 0 && <span className="mr-3">Unlock: Lv.{sk.unlockLevel}</span>}
                          {sk.unlockStar > 0 && <span className="mr-3">Unlock: {sk.unlockStar}★</span>}
                          {skillData?.initCd > 0 && <span>CD: {skillData.initCd}ms</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : <p className="text-asylum-muted text-sm">No skill data for this hero variant</p>}
        </section>

        {(hero.medalId || hero.fragmentItemId) && (
          <section className="bg-asylum-surface border border-asylum-border rounded-xl p-5 md:col-span-2">
            <h2 className="font-display text-lg text-asylum-accent tracking-wide mb-4">FRAGMENTS</h2>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              {hero.medalId && (
                <div className="flex justify-between bg-asylum-bg rounded-lg p-3">
                  <span className="text-asylum-muted">Medal</span>
                  <span className="text-asylum-text font-mono">{hero.medalId} ×{hero.medalAmount}</span>
                </div>
              )}
              {hero.fragmentItemId && (
                <div className="flex justify-between bg-asylum-bg rounded-lg p-3">
                  <span className="text-asylum-muted">Universal Fragment</span>
                  <span className="text-asylum-text font-mono">{hero.fragmentItemId} ×{hero.fragmentItemCount}</span>
                </div>
              )}
            </div>
          </section>
        )}

        {hero.honorLevelUnlockEffect?.length > 0 && (
          <section className="bg-asylum-surface border border-asylum-border rounded-xl p-5 md:col-span-2">
            <h2 className="font-display text-lg text-asylum-accent tracking-wide mb-4">HONOR MILESTONES</h2>
            <div className="flex flex-wrap gap-2">
              {hero.honorLevelUnlockEffect.map((lvl, i) => (
                <div key={`hon-${i}`} className="bg-asylum-bg border border-asylum-border rounded px-3 py-1.5 text-sm">
                  <span className="text-asylum-accent font-mono">Lv.{lvl}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1 border-b border-asylum-border/50 last:border-0">
      <span className="text-asylum-muted">{label}</span>
      <span className="text-asylum-text font-mono">{value}</span>
    </div>
  )
}
