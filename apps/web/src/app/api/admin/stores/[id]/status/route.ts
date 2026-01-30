import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const apiBase = process.env.API_BASE_URL ?? 'http://localhost:4000';
  const cookieStore = await cookies();
  const token = cookieStore.get('api_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Missing api_token cookie' }, { status: 401 });
  }

  const body = await req.json();

  const res = await fetch(`${apiBase}/admin/stores/${id}/status`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}`, Cookie: `api_token=${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
