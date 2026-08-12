import { NextResponse } from 'next/server';
import { BAKU_TRAP_SCENARIO } from '@/lib/scenarios/baku-trap';

export async function GET() {
  return NextResponse.json(BAKU_TRAP_SCENARIO);
}
