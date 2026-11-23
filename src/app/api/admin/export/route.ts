import { NextRequest, NextResponse } from 'next/server';
import { analyticsStore } from '@/lib/analytics/store';
import { verifyAdminRequest } from '@/lib/analytics/auth';

export async function GET(req: NextRequest) {
  const isAuthed = verifyAdminRequest(req);
  if (!isAuthed) {
    // Everyone else gets a 404
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const url = new URL(req.url);
    const rangeParam = url.searchParams.get('range') as '24h' | '7d' | '30d' | 'all' | null;
    const range = rangeParam || '7d';

    const csvData = analyticsStore.exportCsv(range);
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `tic3-analytics-${range}-${dateStr}.csv`;

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[Admin Export] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
