import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lzufceaahntznkxxauqd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6dWZjZWFhaG50em5reHhhdXFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MDEwNzEsImV4cCI6MjEwMTA3NzA3MX0.l0g_N3FkmH75C1LUN6NCHrdPEdHsUwpkuoIxGQRm2l4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSupabase() {
  console.log('Testing Supabase connection...');
  const start = performance.now();
  
  try {
    // try to fetch something, or just use a health check if available. We can query a standard table or just get the current time.
    const { data, error } = await supabase.from('circuits').select('*').limit(1);
    
    const end = performance.now();
    const latency = (end - start).toFixed(2);

    if (error) {
      console.error(`❌ Connection failed in ${latency}ms`);
      console.error('Error Details:', error.message);
      process.exit(1);
    } else {
      console.log(`✅ Connection successful in ${latency}ms`);
      console.log('Data returned:', data);
      process.exit(0);
    }
  } catch (err) {
    console.error('❌ Exception occurred:', err.message);
    process.exit(1);
  }
}

testSupabase();
