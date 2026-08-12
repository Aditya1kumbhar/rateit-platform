import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000/api/v1/hmm/infer';

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => null);
    
    // Strict Payload Validation
    if (!payload || !Array.isArray(payload.features)) {
      const errLog = logger.error('API_HMM_Proxy', 'Invalid payload. Expected array of features (numbers).', payload);
      return NextResponse.json({ error: 'Validation failed: Missing features array', logId: errLog.logId }, { status: 400 });
    }

    // Map Next.js generic feature array to Python microservice contract
    const pythonPayload = {
      speed_kmh: payload.features[0] || 0.0,
      throttle_fraction: payload.features[1] || 0.0,
      brake_pressure: payload.features[2] || 0.0,
      drs_active: (payload.features[3] || 0.0) >= 1.0
    };

    // Forward to Python Microservice with strict timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s max for inference
    
    const response = await fetch(PYTHON_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pythonPayload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('API_HMM_Proxy', `Python backend returned ${response.status}`, { errorText });
      throw new Error(`Python API Error: ${response.status}`);
    }

    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      probabilities: result
    });
    
  } catch (error: any) {
    const isAbort = error.name === 'AbortError';
    const errorMsg = isAbort ? 'Python Microservice timed out' : error.message;
    
    const errLog = logger.critical('API_HMM_Proxy', `Inference routing failed: ${errorMsg}`);
    return NextResponse.json({ error: "Inference failed", logId: errLog.logId }, { status: 500 });
  }
}
