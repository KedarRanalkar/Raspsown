import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export const dynamic = 'force-dynamic'
const statuses = ['Booked', 'Confirmed', 'In service', 'Completed', 'Cancelled']

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get('code')
  const values = code ? [code.trim().toUpperCase()] : []
  const result = await pool.query(`SELECT b.id, b.booking_code, b.customer_name, b.customer_email, b.scheduled_at, b.status, b.notes, s.id AS service_id, s.name AS service_name, s.price_cents, v.id AS vehicle_id, v.make, v.model, v.registration, v.owner_name FROM public.bookings b JOIN public.services s ON s.id = b.service_id JOIN public.vehicles v ON v.id = b.vehicle_id ${code ? 'WHERE b.booking_code = $1' : ''} ORDER BY b.scheduled_at ASC`, values)
  return NextResponse.json(code ? result.rows[0] ?? null : result.rows)
}

function makeBookingCode() { return `AC-${Date.now().toString().slice(-6)}-${Math.floor(10 + Math.random() * 90)}` }

export async function POST(request: Request) {
  const body = await request.json()
  const customerName = String(body.customerName ?? '').trim()
  const customerEmail = String(body.customerEmail ?? '').trim()
  const vehicleId = String(body.vehicleId ?? '').trim()
  const serviceId = Number(body.serviceId)
  const scheduledAt = String(body.scheduledAt ?? '').trim()
  const notes = String(body.notes ?? '').trim()
  if (!customerName || !vehicleId || !Number.isInteger(serviceId) || !scheduledAt || Number.isNaN(Date.parse(scheduledAt))) return NextResponse.json({ error: 'Customer, vehicle, service, and a valid schedule are required.' }, { status: 400 })
  const code = makeBookingCode()
  try {
    const result = await pool.query(`INSERT INTO public.bookings (booking_code, vehicle_id, service_id, customer_name, customer_email, scheduled_at, notes) SELECT $1, v.id, s.id, $3, $4, $5, $6 FROM public.vehicles v CROSS JOIN public.services s WHERE v.id = $2 AND s.id = $7 RETURNING id, booking_code, customer_name, customer_email, scheduled_at, status, vehicle_id, service_id`, [code, vehicleId, customerName, customerEmail, scheduledAt, notes, serviceId])
    if (!result.rowCount) return NextResponse.json({ error: 'Vehicle or service was not found.' }, { status: 400 })
    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error: any) {
    if (error?.code === '23505') return NextResponse.json({ error: 'Please retry creating the booking.' }, { status: 409 })
    throw error
  }
}

export async function PATCH(request: Request) {
  const body = await request.json()
  const id = String(body.id ?? '').trim()
  const status = String(body.status ?? '').trim()
  if (!id || !statuses.includes(status)) return NextResponse.json({ error: 'A valid booking id and status are required.' }, { status: 400 })
  const result = await pool.query('UPDATE public.bookings SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING id, booking_code, status, updated_at', [id, status])
  if (!result.rowCount) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 })
  return NextResponse.json(result.rows[0])
}
