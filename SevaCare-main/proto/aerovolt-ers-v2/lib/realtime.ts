import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { logger } from './logger';

export type TelemetryCallback = (payload: any) => void;
export type BeliefCallback = (payload: any) => void;

export class RealtimeManager {
  private telemetryChannel: RealtimeChannel | null = null;
  private beliefChannel: RealtimeChannel | null = null;

  /**
   * Subscribes to the live telemetry stream via Supabase WebSockets.
   * Eliminates the need for HTTP polling intervals.
   */
  public subscribeToTelemetry(sessionId: string, callback: TelemetryCallback): void {
    if (this.telemetryChannel) {
      logger.warn('Realtime_Manager', 'Telemetry channel already active. Unsubscribe first.');
      return;
    }

    try {
      this.telemetryChannel = supabase
        .channel(`telemetry_stream_${sessionId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'telemetry_features', filter: `session_id=eq.${sessionId}` },
          (payload) => {
            callback(payload.new);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            logger.info('Realtime_Manager', `Successfully connected WebSocket to Telemetry stream for session ${sessionId}`);
          } else if (status === 'CHANNEL_ERROR') {
            logger.error('Realtime_Manager', `WebSocket channel error on telemetry stream.`);
          }
        });
    } catch (error: any) {
      logger.critical('Realtime_Manager', `Failed to initialize telemetry WebSocket: ${error.message}`);
    }
  }

  /**
   * Subscribes to the live opponent belief stream.
   */
  public subscribeToBeliefs(sessionId: string, callback: BeliefCallback): void {
    if (this.beliefChannel) {
      logger.warn('Realtime_Manager', 'Belief channel already active. Unsubscribe first.');
      return;
    }

    try {
      this.beliefChannel = supabase
        .channel(`belief_stream_${sessionId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'opponent_beliefs', filter: `session_id=eq.${sessionId}` },
          (payload) => {
            callback(payload.new);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            logger.info('Realtime_Manager', `Successfully connected WebSocket to Belief stream for session ${sessionId}`);
          }
        });
    } catch (error: any) {
      logger.critical('Realtime_Manager', `Failed to initialize belief WebSocket: ${error.message}`);
    }
  }

  /**
   * Safely terminates all WebSocket connections.
   */
  public async unsubscribeAll(): Promise<void> {
    try {
      if (this.telemetryChannel) {
        await supabase.removeChannel(this.telemetryChannel);
        this.telemetryChannel = null;
      }
      if (this.beliefChannel) {
        await supabase.removeChannel(this.beliefChannel);
        this.beliefChannel = null;
      }
      logger.info('Realtime_Manager', 'All WebSocket channels terminated safely.');
    } catch (error: any) {
      logger.error('Realtime_Manager', `Error during WebSocket teardown: ${error.message}`);
    }
  }
}

// Export singleton
export const realtimeManager = new RealtimeManager();
