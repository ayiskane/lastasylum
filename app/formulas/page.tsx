'use client'

import { useEffect, useState } from 'react'
import { evaluateFormula, extractVariables } from '@/lib/formula'

// Formulas are loaded client-side since this page is interactive
export default function FormulasPage() {
  const [formulas, setFormulas] = useState<Record<string, { id?: number; expression: string }>>({})
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [params, setParams] = useState<Record<string, Record<string, number>>>({})

  useEffect(() => {
    fetch('/api/formulas')
      .then(r => r.json())
      .then(setFormulas)
      .catch(() => {})
  }, [])

  const formulaList = Object.entries(formulas).sort(
    ([a], [b]) => Number(a) - Number(b)
  )

  function toggleFormula(id: string) {
    if (expandedId === id) {
      setExpandedId(null)
    } else {
      setExpandedId(id)
      // Initialize params if needed
      if (!params[id]) {
        const vars = extractVariables(formulas[id].expression)
        const defaults: Record<string, number> = {}
        for (const v of vars) defaults[v] = 1
        setParams(p => ({ ...p, [id]: defaults }))
      }
    }
  }

  function updateParam(formulaId: string, varName: string, value: number) {
    setParams(p => ({
      ...p,
      [formulaId]: { ...p[formulaId], [varName]: value },
    }))
  }

  return (
    <div>
      <h1 className="font-display text-4xl text-asylum-accent tracking-wider mb-2">FORMULAS</h1>
      <p className="text-asylum-muted mb-8">
        {formulaList.length} game formulas — click any to open the interactive calculator
      </p>

      <div className="space-y-2">
        {formulaList.map(([id, formula]) => {
          const isOpen = expandedId === id
          const vars = extractVariables(formula.expression)
          const currentParams = params[id] || {}
          const result = isOpen ? evaluateFormula(formula.expression, currentParams) : 0

          return (
            <div key={id} className="bg-asylum-surface border border-asylum-border rounded-xl overflow-hidden">
              <button
                onClick={() => toggleFormula(id)}
                className="w-full text-left p-4 hover:bg-asylum-bg/30 transition-colors flex items-center gap-3"
              >
                <span className="font-mono text-asylum-accent text-sm w-20 shrink-0">#{id}</span>
                <code className="text-xs text-asylum-text break-all flex-1 font-mono">
                  {formula.expression}
                </code>
                <span className="text-asylum-muted text-xs shrink-0">
                  {vars.length} var{vars.length !== 1 ? 's' : ''}
                </span>
                <span className="text-asylum-muted">{isOpen ? '▾' : '▸'}</span>
              </button>

              {isOpen && (
                <div className="border-t border-asylum-border p-4 bg-asylum-bg/30">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-xs uppercase tracking-wider text-asylum-muted mb-3">Variables</h3>
                      <div className="space-y-2">
                        {vars.map(v => (
                          <div key={v} className="flex items-center gap-3">
                            <label className="font-mono text-sm text-asylum-accent w-8">{v}</label>
                            <input
                              type="number"
                              value={currentParams[v] ?? 1}
                              onChange={e => updateParam(id, v, Number(e.target.value))}
                              className="bg-asylum-surface border border-asylum-border rounded px-3 py-1.5 text-sm font-mono text-asylum-text w-32 focus:border-asylum-accent outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xs uppercase tracking-wider text-asylum-muted mb-3">Result</h3>
                      <div className="bg-asylum-surface border border-asylum-accent/30 rounded-lg p-4 text-center">
                        <div className="font-display text-3xl text-asylum-accent">
                          {isNaN(result) ? 'Error' : result.toLocaleString()}
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-asylum-muted">
                        <span className="font-mono break-all">{formula.expression}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
