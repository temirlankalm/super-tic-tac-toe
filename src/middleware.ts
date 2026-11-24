import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, isAdminHost } from '@/lib/analytics/constants';

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon.svg, canva-assets, etc.
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|canva-assets).*)',
  ],
};

function hasPotentialSessionToken(req: NextRequest): boolean {
  const cookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (cookie && cookie.includes('.')) {
    return true;
  }
  const auth = req.headers.get('authorization');
  if (auth && auth.length > 10) {
    return true;
  }
  return false;
}

export function middleware(req: NextRequest) {
  const host =
    req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
  const pathname = req.nextUrl.pathname;
  const isAdmin = isAdminHost(host);

  // ---------------------------------------------------------------------------
  // 1. DEDICATED SUBDOMAIN: admin.ttt.temr.dev (or admin.localhost)
  // ---------------------------------------------------------------------------
  if (isAdmin) {
    // A. Robots.txt on admin subdomain -> disallow all crawlers
    if (pathname === '/robots.txt') {
      return new NextResponse('User-agent: *\nDisallow: /\n', {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    // B. Sitemap on admin subdomain -> 404 (keep admin out of sitemap)
    if (pathname === '/sitemap.xml') {
      return new NextResponse('Not Found', {
        status: 404,
        headers: {
          'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
        },
      });
    }

    // C. Data API endpoints (/api/admin/stats, /api/admin/export)
    if (pathname === '/api/admin/stats' || pathname === '/api/admin/export') {
      if (!hasPotentialSessionToken(req)) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          {
            status: 401,
            headers: {
              'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
            },
          }
        );
      }

      const res = NextResponse.next();
      res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
      return res;
    }

    // D. Auth & other API routes
    if (pathname.startsWith('/api/')) {
      const res = NextResponse.next();
      res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
      return res;
    }

    // E. Root path (/) or (/admin) -> rewrite to /admin so the admin dashboard is served at root
    if (pathname === '/' || pathname === '/admin') {
      const url = req.nextUrl.clone();
      url.pathname = '/admin';
      const res = NextResponse.rewrite(url);
      res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
      return res;
    }

    // F. Non-admin page on the admin subdomain -> redirect to main game site
    const mainSiteUrl = new URL(pathname, 'https://ttt.temr.dev');
    mainSiteUrl.search = req.nextUrl.search;
    return NextResponse.redirect(mainSiteUrl, { status: 307 });
  }

  // ---------------------------------------------------------------------------
  // 2. MAIN SITE: ttt.temr.dev (or standard localhost)
  // Allow direct access to /admin with full security headers & auth guards
  // ---------------------------------------------------------------------------
  if (pathname.startsWith('/admin')) {
    const res = NextResponse.next();
    res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
    return res;
  }

  if (pathname.startsWith('/api/admin/stats') || pathname === '/api/admin/export') {
    if (!hasPotentialSessionToken(req)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        {
          status: 401,
          headers: {
            'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
          },
        }
      );
    }
    const res = NextResponse.next();
    res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
    return res;
  }

  if (pathname.startsWith('/api/admin/')) {
    const res = NextResponse.next();
    res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
    return res;
  }

  // Allow all standard gameplay, rooms, daily challenge, rules, etc.
  return NextResponse.next();
}
