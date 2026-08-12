import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { ruleEngine, ASTRule } from '@/lib/rules/engine';
import rulesData from '@/lib/regulations/rules.json';

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => null);
    
    // Strict Payload Validation
    if (!payload || typeof payload.carState !== 'object' || typeof payload.recommendation !== 'object') {
      const errLog = logger.error('API_Rules', 'Invalid payload. Expected carState and recommendation objects.', payload);
      return NextResponse.json({ error: 'Validation failed: Missing carState/recommendation', logId: errLog.logId }, { status: 400 });
    }

    // Prepare execution context for the AST Engine
    const context = {
      carState: payload.carState,
      recommendation: payload.recommendation
    };

    // Execute dynamic JSON AST rules
    // Using typing assertion safely as we control the internal schema structure
    const activeRules = rulesData as unknown as ASTRule[];
    const result = ruleEngine.evaluateRuleset(activeRules, context);

    return NextResponse.json({
      success: true,
      result
    });
  } catch (error: any) {
    const errLog = logger.critical('API_Rules', `Dynamic rules execution failed: ${error.message}`);
    return NextResponse.json({ error: "Rules validation failed", logId: errLog.logId }, { status: 500 });
  }
}
