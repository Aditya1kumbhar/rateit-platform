import { openF1Client } from '../lib/ingestion/openf1';
import { supabase, executeDbQuery } from '../lib/supabase';
import { logger } from '../lib/logger';

export class TelemetryStreamer {
  private isStreaming: boolean = false;
  private consecutiveErrors: number = 0;
  private readonly MAX_ERRORS: number = 5;
  private pollIntervalId: NodeJS.Timeout | null = null;
  
  private currentSessionKey: number | null = null;
  private driverNumber: number | null = null;

  constructor(private readonly pollIntervalMs: number = 1000) {}

  /**
   * Starts the background telemetry ingestion stream.
   */
  public start(sessionKey: number, driverNumber: number): void {
    if (this.isStreaming) {
      logger.warn('Telemetry_Streamer', 'Streamer is already running.');
      return;
    }

    this.currentSessionKey = sessionKey;
    this.driverNumber = driverNumber;
    this.isStreaming = true;
    this.consecutiveErrors = 0;
    
    logger.info('Telemetry_Streamer', `Starting telemetry stream for Session ${sessionKey}, Driver ${driverNumber}`);

    this.pollIntervalId = setInterval(() => {
      this.pollCycle().catch((error) => {
        logger.error('Telemetry_Streamer', 'Unhandled exception in poll cycle', { error: error.message });
      });
    }, this.pollIntervalMs);
  }

  /**
   * Stops the background telemetry ingestion stream.
   */
  public stop(): void {
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }
    this.isStreaming = false;
    logger.info('Telemetry_Streamer', 'Streamer stopped.');
  }

  /**
   * One execution cycle of fetching from OpenF1 and pushing to Supabase.
   */
  private async pollCycle(): Promise<void> {
    if (!this.currentSessionKey || !this.driverNumber) return;

    try {
      // 1. Fetch latest data from OpenF1
      const telemetryArray = await openF1Client.fetchCarData(this.currentSessionKey, this.driverNumber);
      
      if (!telemetryArray || telemetryArray.length === 0) {
        return; // No new data
      }

      // 2. Map OpenF1 payload to our Database Schema (telemetry_features)
      const latestData = telemetryArray[telemetryArray.length - 1]; // Grabbing most recent packet
      
      const payload = {
        session_id: '00000000-0000-0000-0000-000000000000', // To be dynamically resolved in Phase 2
        lap_number: 1, // To be dynamically resolved
        speed_kmh: latestData.speed,
        throttle_fraction: latestData.throttle / 100.0,
        brake_pressure: latestData.brake / 100.0,
        timestamp_s: Date.now() / 1000,
        aero_mode: latestData.drs >= 10 ? 'STRAIGHT' : 'CORNER',
      };

      // 3. Push to Database
      await executeDbQuery('insert_telemetry', supabase.from('telemetry_features').insert([payload]));
      
      // Reset error count on success
      this.consecutiveErrors = 0;

    } catch (error: any) {
      this.consecutiveErrors++;
      logger.error('Telemetry_Streamer', `Failed to stream telemetry (Error count: ${this.consecutiveErrors})`, { error: error.message });
      
      // Strict Error Handling: Stop on repeated failures
      if (this.consecutiveErrors >= this.MAX_ERRORS) {
        logger.critical('Telemetry_Streamer', `Max errors (${this.MAX_ERRORS}) reached. Shutting down streamer to prevent runaway loop.`);
        this.stop();
      }
    }
  }
}

// Export singleton
export const telemetryStreamer = new TelemetryStreamer();
