import { createClient, PostgrestError } from '@supabase/supabase-js';
import { logger } from './logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

// Fail fast on startup if environment is misconfigured
if (!supabaseUrl || !supabaseAnonKey) {
  logger.critical('Database_Init', 'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
  throw new Error('Database configuration missing. Server cannot start safely.');
}

// Export the raw client for complex chains
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Deterministic Database Executor
 * Wraps Supabase chained queries in strict try-catch boundaries.
 * 
 * Usage: 
 * const data = await executeDbQuery('fetch_circuits', supabase.from('circuits').select('*'));
 */
export async function executeDbQuery<T>(
  context: string,
  queryPromise: Promise<{ data: T | null; error: PostgrestError | null }>
): Promise<T | null> {
  try {
    const { data, error } = await queryPromise;

    if (error) {
      // Supabase-level SQL/Constraint error
      logger.error(`DB_Query::${context}`, error.message, { 
        code: error.code, 
        details: error.details, 
        hint: error.hint 
      });
      throw new Error(`DB Error [${error.code}]: ${error.message}`);
    }

    return data;
  } catch (err: unknown) {
    // Prevent double-logging if we just threw the error above
    if (err instanceof Error && err.message.startsWith('DB Error')) {
      throw err;
    }
    
    // Catch catastrophic network/connection failures
    logger.critical(`DB_Exception::${context}`, 'Unexpected exception during database operation.', err);
    throw new Error(`Critical DB Exception in ${context}`);
  }
}
