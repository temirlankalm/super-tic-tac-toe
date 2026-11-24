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
  // 1. SUBDOMAIN: admin.ttt.temr.dev (or admin.localhost)
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
    // Server-side enforcement: block requests without session token before they reach handlers
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

    // D. Auth API endpoints (/api/admin/login, /api/admin/logout)
    if (pathname.startsWith('/api/admin/')) {
      const res = NextResponse.next();
      res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
      return res;
    }

    // E. Other API routes (e.g. tracking or nickname sanitization) -> allow with security headers
    if (pathname.startsWith('/api/')) {
      const res = NextResponse.next();
      res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
      return res;
    }

    // F. Root path (/) or (/admin) -> rewrite to /admin so the admin page is served at https://admin.ttt.temr.dev/
    if (pathname === '/' || pathname === '/admin') {
      const url = req.nextUrl.clone();
      url.pathname = '/admin';
      const res = NextResponse.rewrite(url);
      res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
      return res;
    }

    // G. Any non-admin page on the admin subdomain -> redirect to main game site
    const mainSiteUrl = new URL(pathname, 'https://ttt.temr.dev');
    mainSiteUrl.search = req.nextUrl.search;
    return NextResponse.redirect(mainSiteUrl, { status: 307 });
  }

  // ---------------------------------------------------------------------------
  // 2. MAIN SITE: ttt.temr.dev (or standard localhost)
  // "The main site ttt.temr.dev must no longer serve any admin route (return 404 there)."
  // ---------------------------------------------------------------------------
  if (pathname.startsWith('/admin') || pathname === '/admin') {
    // Return 404 for any admin UI route requested on main domain
    const notFoundUrl = req.nextUrl.clone();
    notFoundUrl.pathname = '/_not-found';
    return NextResponse.rewrite(notFoundUrl, { status: 404 });
  }

  if (pathname.startsWith('/api/admin')) {
    // Return 404 JSON for any admin API route requested on main domain
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Allow all standard gameplay, rooms, daily challenge, rules, etc.
  return NextResponse.next();
}
