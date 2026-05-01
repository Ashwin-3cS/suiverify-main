import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const PASSCODE = process.env.SITE_PASSCODE ?? '';
const COOKIE = 'suiverify_gate';
const SEVEN_DAYS = 60 * 60 * 24 * 7;

function hash(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export async function POST(req: NextRequest) {
  const { passcode } = await req.json();

  if (!PASSCODE || passcode !== PASSCODE) {
    return NextResponse.json({ error: 'incorrect' }, { status: 401 });
  }

  const h = hash(PASSCODE);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, h, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: SEVEN_DAYS,
    path: '/',
  });
  return res;
}
