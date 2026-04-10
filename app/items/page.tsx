'use client'

import { useEffect, useState, useMemo } from 'react'
import GameImage from '@/components/GameImage'

interface ItemData {
  id: string
  type: string
  typeSub: number
  grade: number
  icon: string
  displayName: string
  description: string
  [key: string]: any
}

const GRADE_COLORS: Record<number, string> = {
  0: 'text-gray-500', 2: 'text-green-400', 3: 'text-blue-400',
  4: 'text-purple-400', 5: 'text-orange-400', 6: 'text-red-400',
}
const GRADE_LABELS: Record<number, string> = {
  0: '—', 2: '★★', 3: '★★★', 4: '★★★★', 5: '★★★★★', 6: '★★★★★★',
}

const TYPE_LABELS: Record<string, string> = {
  '': 'General',
  'Worker': 'Worker',
  'Box': 'Chest / Box',
  'Skin': 'Skin',
  'UavEquip': 'Raven Gear',
  'Resource': 'Resource',
  'Material': 'Material',
  'SpeedUp': 'Speed Up',
  'Decorate': 'Decoration',
  'Wingman': 'Wingman',
  'UavModule': 'Raven Module',
  'Activity': 'Event',
  'Score': 'Score Item',
  'UseUp': 'Consumable',
  'BoxCastle': 'Castle Chest',
  'HeroEquip': 'Hero Equipment',
  'Benefit': 'Buff',
  'Component': 'Component',
  'Virtual': 'Virtual',
  'Display': 'Display',
  'Other': 'Other',
  'ClinicCopper': 'Clinic',
  'Present': 'Gift',
  'VipActivate': 'VIP',
  'Synthesis': 'Synthesis',
  'Radar': 'Radar',
  'ItemEgg': 'Egg',
  'Building': 'Building',
  'DecorateExchange': 'Decor Exchange',
  'dailyBuy': 'Daily Purchase',
  'AvatarUploadActivate': 'Avatar',
}

type SortField = 'name' | 'grade' | 'type'
type SortDir = 'asc' | 'desc'

export default function ItemsPage() {
  const [allItems, setAllItems] = useState<ItemData[]>([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [gradeFilter, setGradeFilter] = useState<number | 'all'>('all')
  const [sortField, setSortField] = useState<SortField>('grade')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(0)

  const PAGE_SIZE = 50

  useEffect(() => {
    fetch('/api/items')
      .then(r => r.json())
      .then((data: Record<string, ItemData>) => {
        setAllItems(Object.values(data))
      })
      .catch(() => {})
  }, [])

  // Only items with a display name (hide internal/code-only items)
  const visibleItems = useMemo(() => allItems.filter(i => i.displayName), [allItems])

  // Derive available filter options from data
  const types = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const item of visibleItems) {
      const t = item.type || ''
      counts[t] = (counts[t] || 0) + 1
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ type, count, label: TYPE_LABELS[type] || type || 'General' }))
  }, [visibleItems])

  const grades = useMemo(() => {
    const set = new Set<number>()
    for (const item of visibleItems) set.add(item.grade || 0)
    return Array.from(set).sort((a, b) => b - a)
  }, [visibleItems])

  // Filter + sort
  const filtered = useMemo(() => {
    let list = visibleItems

    if (search.length >= 2) {
      const q = search.toLowerCase()
      list = list.filter(item =>
        (item.displayName || '').toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q)
      )
    }

    if (typeFilter !== 'all') {
      list = list.filter(item => (item.type || '') === typeFilter)
    }

    if (gradeFilter !== 'all') {
      list = list.filter(item => (item.grade || 0) === gradeFilter)
    }

    list = [...list].sort((a, b) => {
      let cmp = 0
      if (sortField === 'name') {
        cmp = (a.displayName || '').localeCompare(b.displayName || '')
      } else if (sortField === 'grade') {
        cmp = (a.grade || 0) - (b.grade || 0)
      } else if (sortField === 'type') {
        cmp = (a.type || '').localeCompare(b.type || '')
      }
      return sortDir === 'desc' ? -cmp : cmp
    })

    return list
  }, [visibleItems, search, typeFilter, gradeFilter, sortField, sortDir])

  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  // Reset page when filters change
  useEffect(() => { setPage(0) }, [search, typeFilter, gradeFilter, sortField, sortDir])

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir(field === 'name' ? 'asc' : 'desc')
    }
  }

  const sortIcon = (field: SortField) => {
    if (sortField !== field) return '↕'
    return sortDir === 'asc' ? '↑' : '↓'
  }

  if (!allItems.length) {
    return (
      <div>
        <h1 className="font-display text-4xl text-asylum-accent tracking-wider mb-2">ITEMS</h1>
        <p className="text-asylum-muted">Loading items...</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-display text-4xl text-asylum-accent tracking-wider mb-2">ITEMS</h1>
      <p className="text-asylum-muted mb-6">{visibleItems.length} items in the game database</p>

      {/* Search + Filters */}
      <div className="space-y-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search items by name or description..."
          className="w-full bg-asylum-surface border border-asylum-border rounded-lg px-4 py-2.5 text-sm text-asylum-text placeholder:text-asylum-muted/50 focus:border-asylum-accent outline-none"
        />

        <div className="flex flex-wrap gap-2">
          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="bg-asylum-surface border border-asylum-border rounded-lg px-3 py-2 text-sm text-asylum-text focus:border-asylum-accent outline-none"
          >
            <option value="all">All Types ({visibleItems.length})</option>
            {types.map(t => (
              <option key={t.type} value={t.type}>{t.label} ({t.count})</option>
            ))}
          </select>

          {/* Grade filter */}
          <select
            value={gradeFilter === 'all' ? 'all' : String(gradeFilter)}
            onChange={e => setGradeFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="bg-asylum-surface border border-asylum-border rounded-lg px-3 py-2 text-sm text-asylum-text focus:border-asylum-accent outline-none"
          >
            <option value="all">All Grades</option>
            {grades.map(g => (
              <option key={g} value={g}>{GRADE_LABELS[g] || `Grade ${g}`}</option>
            ))}
          </select>

          {/* Clear filters */}
          {(search || typeFilter !== 'all' || gradeFilter !== 'all') && (
            <button
              onClick={() => { setSearch(''); setTypeFilter('all'); setGradeFilter('all') }}
              className="bg-asylum-bg border border-asylum-border rounded-lg px-3 py-2 text-sm text-asylum-muted hover:text-asylum-text transition-colors"
            >
              Clear Filters
            </button>
          )}

          <div className="ml-auto text-sm text-asylum-muted self-center">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-asylum-surface border border-asylum-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-asylum-border text-asylum-muted text-xs uppercase tracking-wider">
              <th className="text-left p-3 w-10"></th>
              <th className="text-left p-3 cursor-pointer select-none hover:text-asylum-text transition-colors"
                  onClick={() => toggleSort('name')}>
                Name {sortIcon('name')}
              </th>
              <th className="text-left p-3 cursor-pointer select-none hover:text-asylum-text transition-colors w-28"
                  onClick={() => toggleSort('type')}>
                Type {sortIcon('type')}
              </th>
              <th className="text-center p-3 cursor-pointer select-none hover:text-asylum-text transition-colors w-28"
                  onClick={() => toggleSort('grade')}>
                Grade {sortIcon('grade')}
              </th>
              <th className="text-left p-3 hidden lg:table-cell">Description</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((item) => (
              <tr key={item.id} className="border-b border-asylum-border/30 hover:bg-asylum-bg/50 transition-colors">
                <td className="p-2">
                  <div className="w-8 h-8 rounded bg-asylum-bg border border-asylum-border/50 overflow-hidden">
                    <GameImage src={item.icon ? `/images/items/${item.icon}.png` : ''} alt={item.displayName || 'Item'} fallback="🎒" className="w-full h-full" />
                  </div>
                </td>
                <td className="p-3">
                  <div className="text-asylum-text font-semibold text-sm">{item.displayName}</div>
                </td>
                <td className="p-3">
                  <span className="text-xs text-asylum-muted bg-asylum-bg rounded px-2 py-0.5">
                    {TYPE_LABELS[item.type] || item.type || 'General'}
                  </span>
                </td>
                <td className={`p-3 text-center font-semibold ${GRADE_COLORS[item.grade] || 'text-asylum-muted'}`}>
                  {GRADE_LABELS[item.grade] || '—'}
                </td>
                <td className="p-3 text-xs text-asylum-muted hidden lg:table-cell max-w-sm">
                  <span className="line-clamp-2">{item.description || '—'}</span>
                </td>
              </tr>
            ))}
            {pageItems.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-asylum-muted">
                  No items match your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 rounded-lg border border-asylum-border text-sm text-asylum-muted hover:text-asylum-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← Prev
          </button>
          <span className="text-sm text-asylum-muted px-3">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 rounded-lg border border-asylum-border text-sm text-asylum-muted hover:text-asylum-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
