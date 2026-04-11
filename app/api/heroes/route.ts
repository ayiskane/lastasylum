import { getHeroList, heroDisplayName } from '@/lib/gamedata'
import { NextResponse } from 'next/server'

export async function GET() {
  const heroes = getHeroList().map(h => ({
    id: h.id,
    name: heroDisplayName(h),
    quality: h.quality,
    qualityName: h.qualityName,
    armyType: h.armyType,
    armyName: h.armyName,
    campType: h.campType,
    campName: h.campName,
    maxAbility: h.maxAbility,
    heroIcon: h.heroIcon,
  }))
  return NextResponse.json(heroes)
}
