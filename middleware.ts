import { NextRequest, NextResponse } from 'next/server';

const COOKIE = 'suiverify_gate';
const PASSCODE = process.env.SITE_PASSCODE ?? '';

async function hash(v: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(v));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const PUBLIC_PREFIXES = ['/gate', '/api/gate', '/_next', '/favicon', '/connect', '/callback'];

export async function middleware(req: NextRequest) {
  // Gate disabled if no passcode configured
  if (!PASSCODE) return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const cookie = req.cookies.get(COOKIE)?.value;
  const expected = await hash(PASSCODE);
  if (cookie === expected) return NextResponse.next();

  const gateUrl = req.nextUrl.clone();
  gateUrl.pathname = '/gate';
  return NextResponse.redirect(gateUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
