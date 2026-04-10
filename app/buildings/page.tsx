import { getBuildings, getBuildingUpgrades } from '@/lib/gamedata'

export default function BuildingsPage() {
  const buildings = getBuildings()
  const upgrades = getBuildingUpgrades()
  const buildingList = Object.values(buildings).sort((a: any, b: any) => (a.type || 0) - (b.type || 0))

  return (
    <div>
      <h1 className="font-display text-4xl text-asylum-accent tracking-wider mb-2">BUILDINGS</h1>
      <p className="text-asylum-muted mb-8">
        {buildingList.length} building types, {Object.keys(upgrades).length} upgrade levels
      </p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {buildingList.map((b: any) => (
          <div key={b.id} className="bg-asylum-surface border border-asylum-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded bg-asylum-accent/10 border border-asylum-accent/20 flex items-center justify-center text-lg">🏗️</div>
              <div>
                <div className="font-semibold text-asylum-text text-sm">{b.displayName || `Building #${b.id}`}</div>
                <div className="text-xs text-asylum-muted">ID: {b.id} | Type: {b.type}</div>
              </div>
            </div>
            {(b.buildDes || b.createDes) && (
              <p className="text-xs text-asylum-muted mb-2">{b.buildDes || b.createDes}</p>
            )}
            <div className="space-y-1 text-xs text-asylum-muted">
              {b.abc_1_info_translate && <div>• {b.abc_1_info_translate}</div>}
              {b.abc_2_info_translate && <div>• {b.abc_2_info_translate}</div>}
              {b.abc_3_info_translate && <div>• {b.abc_3_info_translate}</div>}
              {b.abc_4_info_translate && <div>• {b.abc_4_info_translate}</div>}
              {b.canMove !== undefined && <div>Moveable: {b.canMove ? 'Yes' : 'No'}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
