import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { recommendStrategy } from '@/lib/strategy/recommender';

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => null);
    
    // Strict Payload Validation
    if (!payload || !payload.opponentBelief || !payload.carState) {
      const errLog = logger.error('API_Strategy', 'Invalid payload. Expected carState and opponentBelief.', payload);
      return NextResponse.json({ error: 'Validation failed: Missing carState/opponentBelief', logId: errLog.logId }, { status: 400 });
    }

    // Strategy Execution
    const strategy = recommendStrategy(payload.carState, payload.opponentBelief, payload.circuitSegment || {});

    return NextResponse.json({
      success: true,
      strategy
    });
  } catch (error) {
    const errLog = logger.critical('API_Strategy', error);
    return NextResponse.json({ error: "Strategy generation failed", logId: errLog.logId }, { status: 500 });
  }
}
