import { getItems, itemImagePath } from '@/lib/gamedata'
import GameImage from '@/components/GameImage'

const GRADE_COLORS: Record<number, string> = {
  1: 'text-gray-400', 2: 'text-green-400', 3: 'text-blue-400',
  4: 'text-purple-400', 5: 'text-orange-400', 6: 'text-red-400',
}

export default function ItemsPage() {
  const items = getItems()
  const itemList = Object.values(items).sort((a: any, b: any) => (b.grade || 0) - (a.grade || 0))

  const byType: Record<string, any[]> = {}
  for (const item of itemList) {
    const typeName = String(item.type || 'Other')
    ;(byType[typeName] ??= []).push(item)
  }

  return (
    <div>
      <h1 className="font-display text-4xl text-asylum-accent tracking-wider mb-2">ITEMS</h1>
      <p className="text-asylum-muted mb-8">{itemList.length} items in the game database</p>

      {Object.entries(byType).sort((a, b) => b[1].length - a[1].length).map(([typeName, items]) => (
        <section key={typeName} className="mb-8">
          <h2 className="font-display text-lg text-asylum-accent tracking-wide mb-3">
            {typeName.toUpperCase()} ({items.length})
          </h2>
          <div className="bg-asylum-surface border border-asylum-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-asylum-border text-asylum-muted text-xs uppercase tracking-wider">
                  <th className="text-left p-3 w-10"></th>
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Grade</th>
                  <th className="text-left p-3 hidden md:table-cell">Description</th>
                </tr>
              </thead>
              <tbody>
                {items.slice(0, 50).map((item: any) => (
                  <tr key={item.id} className="border-b border-asylum-border/30 hover:bg-asylum-bg/50">
                    <td className="p-2">
                      <div className="w-8 h-8 rounded bg-asylum-bg border border-asylum-border/50 overflow-hidden">
                        <GameImage src={itemImagePath(item.icon)} alt={item.displayName || item.id} fallback="🎒" className="w-full h-full" />
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-asylum-text font-semibold text-sm">{item.displayName || item.id}</div>
                      <div className="text-xs text-asylum-muted font-mono">{item.id}</div>
                    </td>
                    <td className={`p-3 font-semibold ${GRADE_COLORS[item.grade] || 'text-asylum-muted'}`}>
                      {item.grade > 0 ? '★'.repeat(item.grade) : '—'}
                    </td>
                    <td className="p-3 text-xs text-asylum-muted hidden md:table-cell max-w-xs truncate">
                      {item.description || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {items.length > 50 && (
              <div className="p-3 text-center text-xs text-asylum-muted">
                Showing 50 of {items.length} — full pagination coming soon
              </div>
            )}
          </div>
        </section>
      ))}
    </div>
  )
}
