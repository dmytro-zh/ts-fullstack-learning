import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const apiBase = process.env.API_BASE_URL ?? 'http://localhost:4000';
  const token = cookies().get('api_token')?.value;

  const res = await fetch(`${apiBase}/admin/metrics`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
