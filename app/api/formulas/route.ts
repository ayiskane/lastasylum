import { getFormulas } from '@/lib/gamedata'
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(getFormulas())
}
