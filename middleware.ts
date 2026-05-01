import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const COOKIE = 'suiverify_gate';
const PASSCODE = process.env.SITE_PASSCODE ?? '';

function hash(v: string) {
  return crypto.createHash('sha256').update(v).digest('hex');
}

const PUBLIC_PREFIXES = ['/gate', '/api/gate', '/_next', '/favicon'];

export function middleware(req: NextRequest) {
  // Gate disabled if no passcode configured
  if (!PASSCODE) return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const cookie = req.cookies.get(COOKIE)?.value;
  if (cookie === hash(PASSCODE)) return NextResponse.next();

  const gateUrl = req.nextUrl.clone();
  gateUrl.pathname = '/gate';
  return NextResponse.redirect(gateUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
