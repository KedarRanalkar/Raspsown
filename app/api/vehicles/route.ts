import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const result = await pool.query(`SELECT id, owner_name, owner_email, make, model, registration, year, created_at, updated_at FROM public.vehicles ORDER BY created_at DESC`)
  return NextResponse.json(result.rows)
}

export async function POST(request: Request) {
  const body = await request.json()
  const ownerName = String(body.ownerName ?? '').trim()
  const ownerEmail = String(body.ownerEmail ?? '').trim()
  const make = String(body.make ?? '').trim()
  const model = String(body.model ?? '').trim()
  const registration = String(body.registration ?? '').trim().toUpperCase()
  const year = body.year == null || body.year === '' ? null : Number(body.year)
  if (!ownerName || !make || !model || !registration || (year !== null && (!Number.isInteger(year) || year < 1900 || year > new Date().getFullYear() + 1))) return NextResponse.json({ error: 'Owner, make, model, and registration are required.' }, { status: 400 })
  try {
    const result = await pool.query(`INSERT INTO public.vehicles (owner_name, owner_email, make, model, registration, year) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [ownerName, ownerEmail, make, model, registration, year])
    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error: any) {
    if (error?.code === '23505') return NextResponse.json({ error: 'A vehicle with this registration already exists.' }, { status: 409 })
    throw error
  }
}

export async function PATCH(request: Request) {
  const body = await request.json()
  const id = String(body.id ?? '').trim()
  if (!id) return NextResponse.json({ error: 'Vehicle id is required.' }, { status: 400 })
  const result = await pool.query(`UPDATE public.vehicles SET owner_name = COALESCE($2, owner_name), owner_email = COALESCE($3, owner_email), make = COALESCE($4, make), model = COALESCE($5, model), registration = COALESCE($6, registration), year = COALESCE($7, year), updated_at = NOW() WHERE id = $1 RETURNING *`, [id, body.ownerName || null, body.ownerEmail || null, body.make || null, body.model || null, body.registration || null, body.year ? Number(body.year) : null])
  if (!result.rowCount) return NextResponse.json({ error: 'Vehicle not found.' }, { status: 404 })
  return NextResponse.json(result.rows[0])
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Vehicle id is required.' }, { status: 400 })
  const result = await pool.query('DELETE FROM public.vehicles WHERE id = $1 RETURNING id', [id])
  if (!result.rowCount) return NextResponse.json({ error: 'Vehicle not found.' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
