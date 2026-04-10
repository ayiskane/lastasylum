import { getSoldiers } from '@/lib/gamedata'

export default function TroopsPage() {
  const soldiers = getSoldiers()
  const list = Object.values(soldiers).sort(
    (a: any, b: any) => (a.type || 0) - (b.type || 0) || (a.level || 0) - (b.level || 0)
  )

  const byType: Record<number, any[]> = {}
  for (const s of list as any[]) {
    ;(byType[s.type] ??= []).push(s)
  }

  const ARMY_CATEGORY: Record<number, string> = {
    1: '🔫 Infantry', 2: '🔫 Infantry', 3: '🔫 Infantry',
    4: '🚗 Vehicle', 5: '🚗 Vehicle', 6: '🚗 Vehicle',
    7: '✈️ Aircraft', 8: '✈️ Aircraft', 9: '✈️ Aircraft',
  }

  return (
    <div>
      <h1 className="font-display text-4xl text-asylum-accent tracking-wider mb-2">TROOPS</h1>
      <p className="text-asylum-muted mb-8">{list.length} troop tiers across all army types</p>

      {Object.entries(byType).map(([typeStr, troops]) => {
        const type = Number(typeStr)
        const firstName = (troops[0] as any)?.displayName || `Type ${type}`
        return (
          <section key={type} className="mb-8">
            <h2 className="font-display text-lg text-asylum-accent tracking-wide mb-3">
              {ARMY_CATEGORY[type] || '⚔️'} — {firstName.replace(/ T\d+$/, '').replace(/ Lv\.\d+$/, '')}
            </h2>
            <div className="bg-asylum-surface border border-asylum-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-asylum-border text-asylum-muted text-xs uppercase tracking-wider">
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">Tier</th>
                    <th className="text-right p-3">Recruit Cost</th>
                    <th className="text-right p-3">Heal Time</th>
                  </tr>
                </thead>
                <tbody>
                  {troops.map((s: any) => (
                    <tr key={`${s.type}-${s.level}`} className="border-b border-asylum-border/30 hover:bg-asylum-bg/50">
                      <td className="p-3 font-semibold text-asylum-text">{s.displayName || `Troop T${s.level}`}</td>
                      <td className="p-3 text-asylum-accent font-mono">T{s.level}</td>
                      <td className="p-3 text-right font-mono text-asylum-muted">
                        {Array.isArray(s.recruit) ? s.recruit.map((r: any) => `${r.count}×T${r.type}`).join(', ') : '—'}
                      </td>
                      <td className="p-3 text-right font-mono text-asylum-muted">
                        {s.hospitalCostTime ? `${s.hospitalCostTime}s` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )
      })}
    </div>
  )
}
