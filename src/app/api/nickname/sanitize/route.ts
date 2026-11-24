import { NextRequest, NextResponse } from 'next/server';
import { sanitizeNickname, validateNickname } from '@/lib/nickname';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawNickname = body?.nickname;

    const validation = validateNickname(String(rawNickname || ''));
    const sanitized = sanitizeNickname(rawNickname);

    return NextResponse.json({
      valid: validation.valid,
      errorKey: validation.errorKey,
      sanitized,
    });
  } catch {
    return NextResponse.json({ sanitized: sanitizeNickname(''), valid: false }, { status: 400 });
  }
}
