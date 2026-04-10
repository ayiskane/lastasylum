import { getItems } from '@/lib/gamedata'
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(getItems())
}
