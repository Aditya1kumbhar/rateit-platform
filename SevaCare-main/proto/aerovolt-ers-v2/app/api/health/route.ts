import { NextResponse } from 'next/server';
import { REGULATIONS } from '@/lib/regulations/v19';

export async function GET() {
  return NextResponse.json({
    status: "ok",
    version: "2.0.0",
    regulationVersion: REGULATIONS.version
  });
}
