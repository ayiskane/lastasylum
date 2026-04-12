'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'

// ── Types ──────────────────────────────────────────────────
interface HeroData {
  id: number; name: string; quality: number; qualityName: string
  campType: number; campName: string; armyType: number; armyName: string
  attackCd: number; heroIcon: string; levelTemplate: number; maxAbility: number
  levelRatio: { Type: number; Value: number }[]
  starRatio: { Type: number; Value: number }[]
  levelBenefit: { Type: number; Value: number }[]
  skills?: any[]
}
interface OwnedHero {
  id: number; level: number; stars: number
  equipment: { quality: number; strengthenLv: number }[]
  skillLevels?: Record<number, number>
}
interface ComputedHero {
  hero: HeroData; config: OwnedHero
  stats: { hp: number; atk: number; def: number; cmd: number; critRate: number; critDmg: number; dmgRate: number; dmgRes: number; monsterDmg: number; power: number; equipPower: number; skillPower: number; levelBenefitLabel: string; levelBenefitValue: number }
}
interface SquadResult {
  heroes: ComputedHero[]; totalPower: number
  synergy: { bonus: number; label: string }; score: number; reason: string
}

// ── Constants ───────────────────────────────────────────
const CAMP_NAMES: Record<number, string> = { 0: 'Warrior', 1: 'Ranger', 2: 'Warlock' }
const CAMP_ICONS: Record<number, string> = { 0: '⚔️', 1: '🏹', 2: '🔮' }
const ARMY_NAMES: Record<number, string> = { 0: 'Support', 1: 'Tank', 3: 'Damage' }
const Q_STYLES: Record<number, { bg: string; border: string; text: string }> = {
  5: { bg: 'bg-amber-950/40', border: 'border-amber-600/60', text: 'text-amber-400' },
  4: { bg: 'bg-purple-950/40', border: 'border-purple-600/60', text: 'text-purple-400' },
  0: { bg: 'bg-blue-950/40', border: 'border-blue-600/60', text: 'text-blue-400' },
}
const EQ_TIERS = [
  { value: 0, label: 'Empty', color: 'text-zinc-600' },
  { value: 3, label: 'SR', color: 'text-blue-400' },
  { value: 4, label: 'SSR', color: 'text-purple-400' },
  { value: 5, label: 'UR', color: 'text-amber-400' },
]
const EQ_MAX: Record<number, number> = { 0: 0, 3: 15, 4: 30, 5: 40 }
const EQ_SLOTS = ['Weapon', 'Armor', 'Gauntlets', 'Boots']
const EQ_ICONS = ['⚔️', '🛡️', '🧤', '👢']
const SLOT_MAP: Record<number, Record<number, string>> = {
  0: { 3: '100301', 4: '100401', 5: '100501' },
  1: { 3: '100302', 4: '100402', 5: '100502' },
  2: { 3: '100303', 4: '100403', 5: '100503' },
  3: { 3: '100304', 4: '100404', 5: '100504' },
}
const BENEFIT: Record<number, string> = {
  10008:'Ranger HP↑',10009:'Ranger ATK↑',10010:'Ranger DEF↑',
  10011:'Warlock HP↑',10012:'Warlock ATK↑',10013:'Warlock DEF↑',
  10014:'Warrior HP↑',10015:'Warrior ATK↑',10016:'Warrior DEF↑',
}

// ── Stat computation ───────────────────────────────────────
function compute(hero: HeroData, cfg: OwnedHero, hl: any, hs: any, eq: any): ComputedHero['stats'] {
  const t = hero.levelTemplate || 1
  const gr = (ty: number) => hero.levelRatio?.find((r: any) => r.Type === ty)?.Value || 1
  const hR = gr(10201), aR = gr(10202), dR = gr(10203)
  let bH=0,bA=0,bD=0,bC=0
  if (hl) {
    let best: any=null, bd=Infinity
    for (const e of Object.values(hl) as any[]) {
      if (e.type===t && Math.abs(e.level-cfg.level)<bd) { bd=Math.abs(e.level-cfg.level); best=e }
    }
    if (best) { bH=(best.attrs?.['10002']||0)*hR; bA=(best.attrs?.['10003']||0)*aR; bD=(best.attrs?.['10004']||0)*dR; bC=best.attrs?.['10001']||0 }
  }
  let sH=0,sA=0,sD=0
  if (hs) for (const e of Object.values(hs) as any[]) {
    const s=e.star??e.level??0
    if (s<=cfg.stars*5) { sH+=(e.attrs?.['10002']||0)*hR; sA+=(e.attrs?.['10003']||0)*aR; sD+=(e.attrs?.['10004']||0)*dR }
  }
  let eH=0,eA=0,eD=0,eHP=0,eC=0,eCD=0,eDR=0,eDRS=0,eMD=0,eP=0
  for (let s=0;s<4;s++) {
    const ec=cfg.equipment[s]; if(!ec||ec.quality<3) continue
    const eid=SLOT_MAP[s]?.[ec.quality]; if(!eid||!eq?.[eid]) continue
    const en=eq[eid].strengthen?.[String(Math.min(ec.strengthenLv,eq[eid].maxStrengthen||0))]
    if (en) {
      const st=en.stats||{}
      eH+=st['10002']||0;eA+=st['10003']||0;eD+=st['10004']||0;eHP+=st['10005']||0
      eC+=st['10006']||0;eCD+=st['10007']||0;eMD+=st['10026']||0;eDR+=st['10030']||0;eDRS+=st['10037']||0
      eP+=en.ability||0
    }
  }
  let lbl='',lv=0
  if (hero.levelBenefit?.[0]) { const lb=hero.levelBenefit[0]; lv=lb.Value*cfg.level; lbl=BENEFIT[lb.Type]||'' }
  const hp=Math.round((bH+sH+eH)*(1+eHP)),atk=Math.round(bA+sA+eA),def=Math.round(bD+sD+eD),cmd=Math.round(bC)
  // Skill power: sum each skill's active-tier power formula evaluated at user-input level
  let skP=0
  const internalStars=cfg.stars*5
  for (const sk of (hero.skills||[])) {
    const n1=cfg.skillLevels?.[sk.slot]??1
    let active:any=null
    for (const slv of (sk.levels||[])) {
      const us=slv.unlockStar||0
      if (us<=internalStars && (!active||(slv.star||0)>(active.star||0))) active=slv
    }
    if (active?.power) {
      try {
        const expr=String(active.power).replace(/n1/g,String(n1))
        const val=Function('"use strict";return('+expr+')')()
        if (typeof val==='number'&&isFinite(val)) skP+=val
      } catch {}
    }
  }
  return { hp,atk,def,cmd,critRate:eC,critDmg:eCD,dmgRate:eDR,dmgRes:eDRS,monsterDmg:eMD,
    power:Math.round(hp+atk*5+def*3+cmd*2+eP+skP),equipPower:Math.round(eP),skillPower:Math.round(skP),levelBenefitLabel:lbl,levelBenefitValue:lv }
}

// ── Squad optimizer ────────────────────────────────────────
function optimize(pool: ComputedHero[]): SquadResult[] {
  if (pool.length<5) return []
  const results: SquadResult[] = []
  const n=pool.length
  const combos: number[][] = []
  if (n<=12) {
    for(let a=0;a<n-4;a++)for(let b=a+1;b<n-3;b++)for(let c=b+1;c<n-2;c++)for(let d=c+1;d<n-1;d++)for(let e=d+1;e<n;e++)combos.push([a,b,c,d,e])
  } else {
    // Heuristic combos
    const si=[...pool].sort((a,b)=>b.stats.power-a.stats.power).map(c=>pool.indexOf(c))
    combos.push(si.slice(0,5))
    for (const camp of [0,1,2]) {
      const ch=pool.map((c,i)=>({c,i})).filter(x=>x.c.hero.campType===camp).sort((a,b)=>b.c.stats.power-a.c.stats.power)
      if (ch.length>=4) {
        const p=ch.slice(0,5).map(x=>x.i)
        if (p.length<5) { const r=pool.map((_,i)=>i).filter(i=>!p.includes(i)).sort((a,b)=>pool[b].stats.power-pool[a].stats.power); while(p.length<5&&r.length)p.push(r.shift()!) }
        if (p.length===5)combos.push(p)
      }
    }
    // All 5x same camp if possible
    for (const camp of [0,1,2]) {
      const ch=pool.map((c,i)=>({c,i})).filter(x=>x.c.hero.campType===camp).sort((a,b)=>b.c.stats.power-a.c.stats.power)
      if (ch.length>=5) combos.push(ch.slice(0,5).map(x=>x.i))
    }
  }
  for (const combo of combos) {
    const heroes=combo.map(i=>pool[i])
    const tp=heroes.reduce((s,h)=>s+h.stats.power,0)
    const cc:Record<number,number>={}
    for (const h of heroes) cc[h.hero.campType]=(cc[h.hero.campType]||0)+1
    let sb=0,sl='No synergy'
    for (const [camp,count] of Object.entries(cc)) {
      const c=Number(camp)
      if (count>=5&&sb<.20){sb=.20;sl=`5× ${CAMP_NAMES[c]} (+20%)`}
      else if(count>=4&&sb<.15){sb=.15;sl=`4× ${CAMP_NAMES[c]} (+15%)`}
      else if(count>=2&&sb<.10){sb=.10;sl=`${count}× ${CAMP_NAMES[c]} (+10%)`}
    }
    const roles=heroes.map(h=>h.hero.armyType)
    const rb=(roles.includes(1)?.05:0)+(roles.includes(3)?.05:0)
    const score=tp*(1+sb)*(1+rb)
    const reasons:string[]=[]
    if(sb>0)reasons.push(sl)
    if(roles.includes(1)&&roles.includes(3))reasons.push('Tank+DPS')
    else if(roles.includes(1))reasons.push('Tank frontline')
    if(!reasons.length)reasons.push('Max power')
    results.push({heroes,totalPower:tp,synergy:{bonus:sb,label:sl},score,reason:reasons.join(' · ')})
  }
  results.sort((a,b)=>b.score-a.score)
  const seen=new Set<string>(),unique:SquadResult[]=[]
  for (const r of results) { const k=r.heroes.map(h=>h.hero.id).sort().join(','); if(!seen.has(k)){seen.add(k);unique.push(r)} }
  return unique.slice(0,8)
}

const fmt=(n:number)=>n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':n.toLocaleString()
const pct=(n:number)=>(n*100).toFixed(1)+'%'

// ── Main Page ─────────────────────────────────────────────
export default function SquadPage() {
  const [data,setData]=useState<any>(null)
  const [loading,setLoading]=useState(true)
  const [step,setStep]=useState<'select'|'configure'|'results'>('select')
  const [owned,setOwned]=useState<Set<number>>(new Set())
  const [cfgs,setCfgs]=useState<Record<number,OwnedHero>>({})
  const [expanded,setExpanded]=useState<number|null>(null)

  useEffect(()=>{ fetch('/api/squad-data').then(r=>r.json()).then(d=>{setData(d);setLoading(false)}) },[])

  const toggle=useCallback((id:number)=>{
    setOwned(prev=>{
      const n=new Set(prev)
      if(n.has(id)){n.delete(id)}else{
        n.add(id)
        if(!cfgs[id])setCfgs(c=>({...c,[id]:{id,level:150,stars:10,equipment:Array.from({length:4},()=>({quality:5,strengthenLv:40})),skillLevels:{0:50,1:50,2:50,3:50,4:50,5:50}}}))
      }
      return n
    })
  },[cfgs])

  const updCfg=useCallback((id:number,p:Partial<OwnedHero>)=>{setCfgs(c=>({...c,[id]:{...c[id],...p}}))},[])
  const updEq=useCallback((hid:number,si:number,p:any)=>{
    setCfgs(c=>{const h=c[hid];if(!h)return c;const eq=[...h.equipment];eq[si]={...eq[si],...p};return{...c,[hid]:{...h,equipment:eq}}})
  },[])
  const updSkill=useCallback((hid:number,slot:number,lv:number)=>{
    setCfgs(c=>{const h=c[hid];if(!h)return c;const sl={...(h.skillLevels||{}),[slot]:Math.min(50,Math.max(1,lv||1))};return{...c,[hid]:{...h,skillLevels:sl}}})
  },[])

  const computed=useMemo<ComputedHero[]>(()=>{
    if(!data)return[]
    return Array.from(owned).map(id=>{
      const hero=data.heroes.find((h:HeroData)=>h.id===id)
      const cfg=cfgs[id]
      if(!hero||!cfg)return null
      return{hero,config:cfg,stats:compute(hero,cfg,data.heroLevels,data.heroStars,data.equipment)}as ComputedHero
    }).filter(Boolean) as ComputedHero[]
  },[data,owned,cfgs])

  const squads=useMemo(()=>step==='results'?optimize(computed):[],[step,computed])

  if(loading)return<div className="min-h-screen flex items-center justify-center"><div className="text-zinc-500">Loading...</div></div>

  const ur=data.heroes.filter((h:HeroData)=>h.quality===5).sort((a:HeroData,b:HeroData)=>a.name.localeCompare(b.name))
  const ssr=data.heroes.filter((h:HeroData)=>h.quality===4).sort((a:HeroData,b:HeroData)=>a.name.localeCompare(b.name))

  return(
  <div className="max-w-6xl mx-auto px-4 py-8">
    <div className="mb-6">
      <h1 className="text-3xl font-bold text-zinc-100" style={{fontFamily:'Rajdhani,sans-serif'}}>Squad Calculator</h1>
      <p className="text-zinc-500 text-sm mt-1">Select your heroes → enter stats → get optimal formations</p>
      <div className="flex items-center gap-2 mt-4">
        {[{k:'select',l:'1. Select Heroes',i:'👥'},{k:'configure',l:'2. Enter Stats',i:'📊'},{k:'results',l:'3. Best Squads',i:'🏆'}].map(s=>(
          <button key={s.k} onClick={()=>{if(s.k!=='select'&&owned.size<5)return;setStep(s.k as any)}}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              step===s.k?'bg-amber-600/20 text-amber-400 border border-amber-600/40'
              :owned.size>=5||s.k==='select'?'bg-zinc-800/60 text-zinc-400 hover:text-zinc-300 border border-zinc-700/30'
              :'bg-zinc-900/40 text-zinc-600 border border-zinc-800/30 cursor-not-allowed'}`}>
            <span>{s.i}</span><span>{s.l}</span>
          </button>
        ))}
        <span className="ml-auto text-sm text-zinc-500">{owned.size} heroes</span>
      </div>
    </div>

    {/* STEP 1 */}
    {step==='select'&&(
    <div className="space-y-6">
      {[{label:'UR Heroes',heroes:ur,q:5,color:'text-amber-400'},{label:'SSR Heroes',heroes:ssr,q:4,color:'text-purple-400'}].map(group=>(
      <div key={group.q}>
        <div className="flex items-center gap-2 mb-3">
          <span className={`${group.color} font-bold text-sm`}>{group.label}</span>
          <span className="text-zinc-600 text-xs">({group.heroes.length})</span>
          <button onClick={()=>{
            const ids=group.heroes.map((h:HeroData)=>h.id)
            const allIn=ids.every((id:number)=>owned.has(id))
            if(allIn)setOwned(p=>{const n=new Set(p);ids.forEach((id:number)=>n.delete(id));return n})
            else ids.forEach((id:number)=>{if(!owned.has(id))toggle(id)})
          }} className={`ml-auto text-xs text-zinc-500 hover:${group.color} transition-colors`}>
            {group.heroes.every((h:HeroData)=>owned.has(h.id))?'Deselect all':'Select all'}
          </button>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-2">
          {group.heroes.map((h:HeroData)=>{
            const on=owned.has(h.id),qc=Q_STYLES[h.quality]||Q_STYLES[0]
            return(
            <button key={h.id} onClick={()=>toggle(h.id)}
              className={`relative rounded-xl overflow-hidden border transition-all ${on?`${qc.border} ${qc.bg} ring-2 ring-amber-500/50 ring-offset-1 ring-offset-zinc-950`:'border-zinc-700/30 bg-zinc-900/40 opacity-50 hover:opacity-80'}`}>
              {on&&<div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center z-10"><span className="text-white text-[10px]">✓</span></div>}
              <div className="aspect-square">
                <img src={`/images/heroes/${h.heroIcon}.png`} alt={h.name} className="w-full h-full object-cover"
                  onError={e=>{(e.target as HTMLImageElement).style.display='none'}}/>
              </div>
              <div className="px-1 py-1 bg-zinc-900/80">
                <div className={`text-[10px] font-bold truncate ${on?qc.text:'text-zinc-500'}`}>{h.name}</div>
                <div className="text-[8px] text-zinc-600 flex justify-between"><span>{CAMP_ICONS[h.campType]}</span><span>{ARMY_NAMES[h.armyType]}</span></div>
              </div>
            </button>)
          })}
        </div>
      </div>))}
      <div className="flex justify-end pt-4">
        <button onClick={()=>owned.size>=5&&setStep('configure')} disabled={owned.size<5}
          className={`px-6 py-3 rounded-xl font-medium text-sm transition-all ${owned.size>=5?'bg-amber-600 hover:bg-amber-500 text-black':'bg-zinc-800 text-zinc-600 cursor-not-allowed'}`}>
          Next: Enter Stats →{owned.size<5&&<span className="ml-2 text-zinc-500">(need {5-owned.size} more)</span>}
        </button>
      </div>
    </div>)}

    {/* STEP 2 */}
    {step==='configure'&&(
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-zinc-400 text-sm">Enter level, stars, and equipment for each hero. Click a row to expand equipment details.</p>
        <div className="flex gap-2">
          <button onClick={()=>setStep('select')} className="text-xs text-zinc-500 hover:text-zinc-300 px-3 py-1.5 rounded-lg bg-zinc-800">← Back</button>
          <button onClick={()=>setStep('results')} className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-black text-sm font-medium">Generate Squads 🏆</button>
        </div>
      </div>
      {/* Quick-set */}
      <div className="flex gap-2 flex-wrap">
        <span className="text-xs text-zinc-600 py-1">Quick set all equipment:</span>
        {[{l:'UR Lv40',q:5,v:40},{l:'SSR Lv30',q:4,v:30},{l:'SR Lv15',q:3,v:15},{l:'Empty',q:0,v:0}].map(p=>(
          <button key={p.l} onClick={()=>setCfgs(c=>{const n={...c};for(const id of owned)if(n[id])n[id]={...n[id],equipment:Array.from({length:4},()=>({quality:p.q,strengthenLv:p.v}))};return n})}
            className="text-xs px-3 py-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 border border-zinc-700/30">{p.l}</button>
        ))}
        <span className="text-xs text-zinc-600 py-1 ml-2">Skills:</span>
        {[{l:'Max (50)',v:50},{l:'Lv25',v:25},{l:'Lv1',v:1}].map(p=>(
          <button key={p.l} onClick={()=>setCfgs(c=>{const n={...c};for(const id of owned)if(n[id])n[id]={...n[id],skillLevels:{0:p.v,1:p.v,2:p.v,3:p.v,4:p.v,5:p.v}};return n})}
            className="text-xs px-3 py-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 border border-zinc-700/30">{p.l}</button>
        ))}
      </div>

      {Array.from(owned).map(id=>({h:data.heroes.find((h:HeroData)=>h.id===id),c:cfgs[id]}))
        .filter((x:any)=>x.h&&x.c).sort((a:any,b:any)=>b.h.quality-a.h.quality||a.h.name.localeCompare(b.h.name))
        .map(({h:hero,c:cfg}:any)=>{
        const qc=Q_STYLES[hero.quality]||Q_STYLES[0],ex=expanded===hero.id
        const st=compute(hero,cfg,data.heroLevels,data.heroStars,data.equipment)
        return(
        <div key={hero.id} className={`rounded-xl border ${qc.border} ${qc.bg} overflow-hidden`}>
          <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-white/5" onClick={()=>setExpanded(ex?null:hero.id)}>
            <div className={`w-10 h-10 rounded-lg overflow-hidden border ${qc.border} flex-shrink-0`}>
              <img src={`/images/heroes/${hero.heroIcon}.png`} alt={hero.name} className="w-full h-full object-cover" onError={e=>{(e.target as HTMLImageElement).style.display='none'}}/>
            </div>
            <div className="min-w-0 flex-shrink-0 w-28">
              <div className={`font-bold text-sm truncate ${qc.text}`} style={{fontFamily:'Rajdhani,sans-serif'}}>{hero.name}</div>
              <div className="text-[10px] text-zinc-500">{hero.qualityName} {CAMP_ICONS[hero.campType]} {ARMY_NAMES[hero.armyType]}</div>
            </div>
            <div className="flex items-center gap-3 flex-1">
              <div className="flex items-center gap-1">
                <label className="text-[10px] text-zinc-600">Lv</label>
                <input type="number" min={1} max={150} value={cfg.level} onClick={e=>e.stopPropagation()}
                  onChange={e=>updCfg(hero.id,{level:Math.min(150,Math.max(1,Number(e.target.value)||1))})}
                  className="w-14 bg-zinc-900/80 border border-zinc-700/50 rounded px-1.5 py-0.5 text-xs text-zinc-200 text-center focus:outline-none focus:border-amber-600/50"/>
              </div>
              <div className="flex items-center gap-1">
                <label className="text-[10px] text-zinc-600">★</label>
                <input type="number" min={0} max={10} value={cfg.stars} onClick={e=>e.stopPropagation()}
                  onChange={e=>updCfg(hero.id,{stars:Math.min(10,Math.max(0,Number(e.target.value)||0))})}
                  className="w-14 bg-zinc-900/80 border border-zinc-700/50 rounded px-1.5 py-0.5 text-xs text-zinc-200 text-center focus:outline-none focus:border-amber-600/50"/>
              </div>
              <div className="flex gap-1 ml-2">
                {cfg.equipment.map((eq:any,i:number)=>{
                  const tier=EQ_TIERS.find(t=>t.value===eq.quality)
                  return<div key={i} className={`text-[10px] px-1.5 py-0.5 rounded ${eq.quality===0?'bg-zinc-800/50 text-zinc-600':'bg-zinc-800/80 '+(tier?.color||'')}`}
                    title={`${EQ_SLOTS[i]}: ${tier?.label} Lv${eq.strengthenLv}`}>{eq.quality===0?'—':`${tier?.label?.charAt(0)}${eq.strengthenLv}`}</div>
                })}
              </div>
            </div>
            <div className="text-right flex-shrink-0 w-20">
              <div className="text-xs text-amber-400 font-mono font-bold">{fmt(st.power)}</div>
              <div className="text-[10px] text-zinc-600">power</div>
            </div>
            <div className={`text-zinc-600 transition-transform ${ex?'rotate-180':''}`}>▾</div>
          </div>
          {ex&&(
          <div className="border-t border-zinc-700/30 p-4 bg-black/20">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {EQ_SLOTS.map((sn,i)=>{
                const eq=cfg.equipment[i]
                return<div key={i} className="space-y-2">
                  <div className="flex items-center gap-1.5"><span>{EQ_ICONS[i]}</span><span className="text-xs text-zinc-400">{sn}</span></div>
                  <select value={eq.quality} onChange={e=>{const q=Number(e.target.value);updEq(hero.id,i,{quality:q,strengthenLv:Math.min(eq.strengthenLv,EQ_MAX[q]||0)})}}
                    className="w-full bg-zinc-900 border border-zinc-700/50 rounded px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-amber-600/50">
                    {EQ_TIERS.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  {eq.quality>0&&<div className="flex items-center gap-1">
                    <label className="text-[10px] text-zinc-600">Lv</label>
                    <input type="number" min={0} max={EQ_MAX[eq.quality]||0} value={eq.strengthenLv}
                      onChange={e=>updEq(hero.id,i,{strengthenLv:Math.min(EQ_MAX[eq.quality]||0,Math.max(0,Number(e.target.value)||0))})}
                      className="w-full bg-zinc-900 border border-zinc-700/50 rounded px-1.5 py-0.5 text-xs text-zinc-200 text-center focus:outline-none focus:border-amber-600/50"/>
                    <span className="text-[10px] text-zinc-600">/{EQ_MAX[eq.quality]}</span>
                  </div>}
                </div>
              })}
            </div>
            {hero.skills&&hero.skills.length>0&&(<div className="mb-4">
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Skill Levels</div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {(hero.skills as any[]).map((sk:any)=>{
                  const cur=cfg.skillLevels?.[sk.slot]??1
                  const lbl=sk.typeLabel||sk.name||`Skill ${sk.slot+1}`
                  return <div key={sk.slot} className="flex items-center gap-2 bg-zinc-900/60 rounded-lg px-2 py-1.5">
                    <div className="min-w-0 flex-1"><div className="text-[10px] text-zinc-500 uppercase truncate">{sk.typeLabel||'Skill'}</div><div className="text-[11px] text-zinc-300 truncate">{sk.name||lbl}</div></div>
                    <input type="number" min={1} max={50} value={cur} onChange={e=>updSkill(hero.id,sk.slot,Number(e.target.value)||1)} className="w-12 bg-zinc-900 border border-zinc-700/50 rounded px-1 py-0.5 text-xs text-zinc-200 text-center focus:outline-none focus:border-amber-600/50 shrink-0"/>
                  </div>
                })}
              </div>
            </div>)}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 text-center">
              {[{l:'ATK',v:fmt(st.atk),c:'text-red-400'},{l:'HP',v:fmt(st.hp),c:'text-green-400'},{l:'DEF',v:fmt(st.def),c:'text-blue-400'},{l:'CMD',v:fmt(st.cmd),c:'text-yellow-400'},
                {l:'Crit%',v:pct(st.critRate),c:'text-orange-400'},{l:'DMG Rate',v:pct(st.dmgRate),c:'text-rose-400'},{l:'SKL Pwr',v:fmt(st.skillPower),c:'text-cyan-400'},{l:'Power',v:fmt(st.power),c:'text-amber-400'}
              ].map(s=><div key={s.l} className="bg-zinc-900/60 rounded-lg py-1.5 px-1"><div className={`text-xs font-mono font-bold ${s.c}`}>{s.v}</div><div className="text-[9px] text-zinc-600">{s.l}</div></div>)}
            </div>
          </div>)}
        </div>)})}

      <div className="flex justify-end pt-4">
        <button onClick={()=>setStep('results')} className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-black font-medium text-sm">Generate Best Squads 🏆</button>
      </div>
    </div>)}

    {/* STEP 3 */}
    {step==='results'&&(
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-zinc-400 text-sm">Top squad formations from your {owned.size} heroes.</p>
        <button onClick={()=>setStep('configure')} className="text-xs text-zinc-500 hover:text-zinc-300 px-3 py-1.5 rounded-lg bg-zinc-800">← Edit Stats</button>
      </div>
      {squads.length===0?<div className="bg-zinc-900/60 rounded-xl border border-zinc-700/30 p-12 text-center"><div className="text-4xl mb-3">⚠️</div><div className="text-zinc-400">Need at least 5 heroes</div></div>
      :squads.map((sq,rank)=>(
      <div key={rank} className={`rounded-xl border overflow-hidden ${rank===0?'border-amber-600/50 bg-amber-950/10':'border-zinc-700/30 bg-zinc-900/60'}`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700/20">
          <div className="flex items-center gap-3">
            <span className={`text-lg font-bold ${rank===0?'text-amber-400':rank===1?'text-zinc-300':'text-zinc-500'}`} style={{fontFamily:'Rajdhani,sans-serif'}}>#{rank+1}</span>
            <div><div className="text-sm text-zinc-300 font-medium">{sq.reason}</div>
              {sq.synergy.bonus>0&&<div className="text-xs text-emerald-400">🔗 {sq.synergy.label}</div>}</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-amber-400 font-mono" style={{fontFamily:'Rajdhani,sans-serif'}}>{fmt(sq.totalPower)}</div>
            <div className="text-[10px] text-zinc-600">total power</div>
          </div>
        </div>
        <div className="grid grid-cols-5 divide-x divide-zinc-800/50">
          {sq.heroes.map((ch,i)=>{
            const qc=Q_STYLES[ch.hero.quality]||Q_STYLES[0]
            return<div key={i} className="p-3 text-center">
              <div className={`w-12 h-12 mx-auto rounded-lg overflow-hidden border ${qc.border} mb-1`}>
                <img src={`/images/heroes/${ch.hero.heroIcon}.png`} alt={ch.hero.name} className="w-full h-full object-cover" onError={e=>{(e.target as HTMLImageElement).style.display='none'}}/>
              </div>
              <div className={`text-xs font-bold truncate ${qc.text}`}>{ch.hero.name}</div>
              <div className="text-[10px] text-zinc-600">Lv{ch.config.level} {ch.config.stars}★</div>
              <div className="mt-1 space-y-0.5 text-[10px]">
                <div><span className="text-zinc-600">ATK</span> <span className="text-red-400 font-mono">{fmt(ch.stats.atk)}</span></div>
                <div><span className="text-zinc-600">HP</span> <span className="text-green-400 font-mono">{fmt(ch.stats.hp)}</span></div>
                <div><span className="text-zinc-600">PWR</span> <span className="text-amber-400 font-mono">{fmt(ch.stats.power)}</span></div>
              </div>
            </div>
          })}
        </div>
        {rank===0&&(()=>{
          const sqIds=new Set(sq.heroes.map(h=>h.hero.id))
          const bench=computed.filter(h=>!sqIds.has(h.hero.id))
          const tips:string[]=[]
          for(const sh of sq.heroes)for(const bh of bench)if(bh.stats.equipPower>sh.stats.equipPower*1.3)
            tips.push(`Move ${bh.hero.name}'s gear (${fmt(bh.stats.equipPower)}) → ${sh.hero.name} (${fmt(sh.stats.equipPower)})`)
          const eps=sq.heroes.map(h=>h.stats.equipPower).sort((a,b)=>a-b)
          const med=eps[Math.floor(eps.length/2)]
          for(const sh of sq.heroes)if(sh.stats.equipPower<med*.5)tips.push(`${sh.hero.name}'s gear is much weaker — upgrade it`)
          if(!tips.length)return null
          return<div className="border-t border-zinc-700/20 px-4 py-3 bg-zinc-900/40">
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">💡 Equipment Suggestions</div>
            {tips.slice(0,3).map((t,i)=><div key={i} className="text-xs text-zinc-400 flex items-start gap-2 mb-1"><span className="text-amber-500">▸</span><span>{t}</span></div>)}
          </div>
        })()}
      </div>))}
    </div>)}
  </div>)
}
