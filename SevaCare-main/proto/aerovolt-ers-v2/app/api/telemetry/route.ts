import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { supabase, executeDbQuery } from '@/lib/supabase';
import { BAKU_TRAP_SCENARIO } from '@/lib/scenarios/baku-trap';

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => null);
    
    // Strict Payload Validation
    if (!payload || !payload.sessionId) {
      const errLog = logger.error('API_Telemetry', 'Invalid payload. Missing sessionId.', payload);
      return NextResponse.json({ error: 'Validation failed: Missing sessionId', logId: errLog.logId }, { status: 400 });
    }

    // Try executing database query
    try {
      const data = await executeDbQuery(
        'fetch_telemetry',
        supabase.from('telemetry').select('*').eq('session_id', payload.sessionId).limit(100)
      );

      if (data && Array.isArray(data) && data.length > 0) {
        return NextResponse.json({
          success: true,
          source: 'DATABASE',
          features: data
        });
      }
    } catch (dbErr) {
      logger.warn('API_Telemetry', 'Database query failed or table missing. Falling back to Baku scenario dataset.', dbErr);
    }

    // Fallback to offline Baku scenario telemetry features
    return NextResponse.json({
      success: true,
      source: 'BAKU_SCENARIO_DATASET',
      features: BAKU_TRAP_SCENARIO.laps
    });

  } catch (error) {
    const errLog = logger.critical('API_Telemetry', error);
    return NextResponse.json({ error: "Telemetry processing failed", logId: errLog.logId }, { status: 500 });
  }
}
