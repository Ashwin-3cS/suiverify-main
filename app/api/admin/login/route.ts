import { NextRequest, NextResponse } from 'next/server';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? '';
const ADMIN_KEY = process.env.ADMIN_KEY ?? '';
const COOKIE = 'suiverify_admin';
const ONE_DAY = 60 * 60 * 24;

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get('suiverify_admin')?.value;
  if (cookie === 'authenticated') return NextResponse.json({ ok: true });
  return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
}

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (!ADMIN_USERNAME || !ADMIN_KEY || username !== ADMIN_USERNAME || password !== ADMIN_KEY) {
    return NextResponse.json({ error: 'invalid credentials' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, 'authenticated', {
    httpOnly: true,
    sameSite: 'strict',
    maxAge: ONE_DAY,
    path: '/',
  });
  return res;
}
