import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const result = await pool.query('SELECT id, name, description, price_cents, duration_minutes FROM public.services ORDER BY id ASC')
  return NextResponse.json(result.rows)
}
