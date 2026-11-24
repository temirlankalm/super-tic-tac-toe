import type { Metadata } from 'next';
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { connection } from 'next/server';
import { ADMIN_COOKIE_NAME, verifySessionToken } from '@/lib/analytics/auth';
import { AdminDashboardClient } from './AdminDashboardClient';

export const metadata: Metadata = {
  title: 'Admin Analytics · Tic³',
  description: 'Private administration and analytics dashboard for Tic³.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noarchive: true,
    nosnippet: true,
  },
};

async function AdminContent() {
  await connection();
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const isAuthed = verifySessionToken(sessionToken);

  return <AdminDashboardClient initialAuthenticated={isAuthed} />;
}

export default function AdminPage() {
  return (
    <Suspense fallback={null}>
      <AdminContent />
    </Suspense>
  );
}
