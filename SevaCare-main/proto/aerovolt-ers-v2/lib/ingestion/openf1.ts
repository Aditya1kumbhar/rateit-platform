import { logger } from '@/lib/logger';

export interface OpenF1CarData {
  session_key: number;
  meeting_key: number;
  driver_number: number;
  date: string;
  rpm: number;
  speed: number;
  n_gear: number;
  throttle: number;
  brake: number;
  drs: number;
}

export interface OpenF1TimingData {
  session_key: number;
  meeting_key: number;
  driver_number: number;
  date: string;
  lap_duration: number;
  is_pit_out_lap: boolean;
  segments: number[];
}

export class OpenF1Client {
  private readonly baseUrl: string;
  private readonly maxRetries: number;
  private readonly timeoutMs: number;

  constructor(baseUrl: string = 'https://api.openf1.org/v1', maxRetries: number = 3, timeoutMs: number = 5000) {
    this.baseUrl = baseUrl;
    this.maxRetries = maxRetries;
    this.timeoutMs = timeoutMs;
  }

  /**
   * Fetches the latest car data (telemetry) for a specific driver and session.
   * Includes exponential backoff and explicit error handling.
   */
  async fetchCarData(sessionKey: number, driverNumber: number): Promise<OpenF1CarData[]> {
    const url = `${this.baseUrl}/car_data?session_key=${sessionKey}&driver_number=${driverNumber}`;
    return this.executeRequest<OpenF1CarData[]>(url, 'fetchCarData');
  }

  /**
   * Fetches the latest live timing data (laps) for a specific driver and session.
   */
  async fetchTimingData(sessionKey: number, driverNumber: number): Promise<OpenF1TimingData[]> {
    const url = `${this.baseUrl}/laps?session_key=${sessionKey}&driver_number=${driverNumber}`;
    return this.executeRequest<OpenF1TimingData[]>(url, 'fetchTimingData');
  }

  /**
   * Core request executor with deterministic retry logic and strict error logging.
   */
  private async executeRequest<T>(url: string, context: string): Promise<T> {
    let attempt = 0;
    
    while (attempt < this.maxRetries) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }

        const data: T = await response.json();
        
        logger.info(`[OpenF1Client::${context}] Successfully fetched data from ${url}`);
        return data;
      } catch (error: any) {
        attempt++;
        const isAbort = error.name === 'AbortError';
        const errorMessage = isAbort ? `Request timeout after ${this.timeoutMs}ms` : error.message;

        logger.error(`[OpenF1Client::${context}] Attempt ${attempt} failed: ${errorMessage}`, { url });

        if (attempt >= this.maxRetries) {
          logger.critical(`[OpenF1Client::${context}] All ${this.maxRetries} attempts failed. Aborting.`, { url });
          throw new Error(`OpenF1Client ${context} failed: ${errorMessage}`);
        }

        // Exponential backoff: 500ms, 1000ms, 2000ms...
        const backoffMs = 500 * Math.pow(2, attempt - 1);
        await this.sleep(backoffMs);
      }
    }

    throw new Error(`[OpenF1Client::${context}] Unreachable execution path hit.`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export a singleton instance for shared use across the application
export const openF1Client = new OpenF1Client();
