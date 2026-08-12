import fetch from 'node-fetch'; // Next.js polyfills this globally, but in a raw script we can just use the global fetch in Node 18+

const ENDPOINTS = [
  '/api/health',
  '/api/scenario',
  '/api/telemetry',
  '/api/rules',
  '/api/strategy',
  '/api/hmm'
];

const BASE_URL = 'http://localhost:3000';

async function testEndpoints() {
  console.log('--- AEROVOLT ERS API ENDPOINT TEST ---');
  let allPass = true;
  
  for (const endpoint of ENDPOINTS) {
    const url = `${BASE_URL}${endpoint}`;
    const method = endpoint === '/api/health' || endpoint === '/api/scenario' ? 'GET' : 'POST';
    console.log(`Testing ${method} ${url}...`);
    const start = performance.now();
    try {
      const res = await fetch(url, {
        method,
        headers: method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
        body: method === 'POST' ? JSON.stringify({}) : undefined
      });
      const end = performance.now();
      const latency = (end - start).toFixed(2);
      
      const rawText = await res.text();
      let body;
      try {
        body = JSON.parse(rawText);
      } catch (e) {
        body = rawText;
      }
      
      if (res.ok) {
        console.log(`✅ [${res.status} OK] ${endpoint} in ${latency}ms`);
      } else {
        console.log(`❌ [${res.status} ERROR] ${endpoint} in ${latency}ms - Error: ${JSON.stringify(body)}`);
        allPass = false;
      }
    } catch (e) {
      console.log(`❌ [NETWORK ERROR] ${endpoint} - ${e.message}`);
      allPass = false;
    }
    console.log('----------------------------------------');
  }
  
  if (allPass) {
    console.log('🎉 All API endpoints responded successfully!');
    process.exit(0);
  } else {
    console.log('⚠️ Some API endpoints failed or returned errors.');
    process.exit(1);
  }
}

testEndpoints();
