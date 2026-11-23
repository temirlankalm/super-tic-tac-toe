import type { Metadata } from 'next';
import { AdminDashboardClient } from './AdminDashboardClient';

export const metadata: Metadata = {
  title: 'Admin Analytics · Tic³',
  description: 'Private administration and analytics dashboard for Tic³.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function AdminPage() {
  return <AdminDashboardClient />;
}
