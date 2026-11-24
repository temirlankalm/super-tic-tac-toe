import { NextRequest, NextResponse } from 'next/server';
import { sanitizeNickname, validateNickname } from '@/lib/nickname';
import { eloStore } from '@/lib/elo/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawNickname = body?.nickname;
    const playerId = body?.playerId;

    const validation = validateNickname(String(rawNickname || ''));
    if (!validation.valid) {
      return NextResponse.json({
        valid: false,
        errorKey: validation.errorKey,
        sanitized: validation.sanitized,
      });
    }

    // Check unique nickname constraint for leaderboard
    if (validation.sanitized && playerId) {
      const isAvailable = eloStore.isNicknameAvailable(validation.sanitized, playerId);
      if (!isAvailable) {
        return NextResponse.json({
          valid: false,
          errorKey: 'nicknameTaken',
          sanitized: validation.sanitized,
        });
      }
    }

    return NextResponse.json({
      valid: true,
      sanitized: validation.sanitized,
    });
  } catch {
    return NextResponse.json({ sanitized: sanitizeNickname(''), valid: false }, { status: 400 });
  }
}
