import { getResearch } from '@/lib/gamedata'
import { readFileSync } from 'fs'
import { join } from 'path'

function getResearchTypes(): Record<string, any> {
  try {
    const raw = readFileSync(join(process.cwd(), 'data', 'wiki', 'research_types.json'), 'utf-8')
    return JSON.parse(raw)
  } catch { return {} }
}

export default function ResearchPage() {
  const research = getResearch()
  const researchTypes = getResearchTypes()
  const list = Object.values(research) as any[]

  const byType: Record<number, any[]> = {}
  for (const r of list) {
    ;(byType[r.techType] ??= []).push(r)
  }

  // Build type name lookup from localized research_types.json
  const typeNames: Record<number, string> = {}
  for (const rt of Object.values(researchTypes) as any[]) {
    typeNames[rt.id ?? rt.techType] = rt.displayName || rt.name || ''
  }

  return (
    <div>
      <h1 className="font-display text-4xl text-asylum-accent tracking-wider mb-2">RESEARCH</h1>
      <p className="text-asylum-muted mb-8">{list.length} research nodes across all tech trees</p>

      {Object.entries(byType).sort(([a], [b]) => Number(a) - Number(b)).map(([typeStr, techs]) => {
        const type = Number(typeStr)
        return (
          <section key={type} className="mb-8">
            <h2 className="font-display text-lg text-asylum-accent tracking-wide mb-3">
              {typeNames[type] || `Tech Tree ${type}`} ({techs.length} nodes)
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {techs.sort((a: any, b: any) => (a.pos || 0) - (b.pos || 0)).map((tech: any) => (
                <div key={tech.id} className="bg-asylum-surface border border-asylum-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded bg-asylum-accent/10 border border-asylum-accent/20 flex items-center justify-center text-sm">🔬</div>
                    <div>
                      <div className="font-semibold text-sm text-asylum-text">{tech.displayName || `Tech #${tech.id}`}</div>
                      <div className="text-xs text-asylum-muted">Max Lv.{tech.maxLevel}</div>
                    </div>
                  </div>
                  {tech.description && (
                    <p className="text-xs text-asylum-muted mb-1">{tech.description}</p>
                  )}
                  <div className="text-xs text-asylum-muted/60 space-y-0.5">
                    {tech.preLine && Array.isArray(tech.preLine) && tech.preLine.length > 0 && (
                      <div>Requires: {tech.preLine.map((p: any) => typeof p === 'object' ? p.pos : p).filter(Boolean).join(', ')}</div>
                    )}
                    {tech.maxValue && <div>Max Value: {tech.maxValue}</div>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
