import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { isAdminHost } from '@/lib/analytics/auth';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers();
  const host = headersList.get('x-forwarded-host') || headersList.get('host') || '';

  if (isAdminHost(host)) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/'],
    },
    sitemap: 'https://ttt.temr.dev/sitemap.xml',
  };
}
