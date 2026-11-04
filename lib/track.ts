/**
 * Client-Side Event Tracking Engine (RateIT)
 *
 * In-memory batching, automatic 10s flush interval,
 * and pagehide/visibilitychange beacon flushing.
 */

export interface TrackEventPayload {
  type:
    | "place_view"
    | "place_dwell"
    | "category_browse"
    | "search_query"
    | "search_click"
    | "review_submit"
    | "review_helpful"
    | "place_save"
    | "list_add"
    | "share_click"
    | "feed_impression"
  placeId?: string
  category?: "COACHING" | "PG_HOSTEL" | "LOCAL_SERVICE" | "RESTAURANT" | "CAFE"
  query?: string
  dwellMs?: number
  deviceHash?: string
}

class EventTracker {
  private buffer: TrackEventPayload[] = []
  private sessionId: string = ""
  private flushTimer: ReturnType<typeof setInterval> | null = null
  private dwellStartTimes: Map<string, number> = new Map()

  constructor() {
    if (typeof window !== "undefined") {
      this.initSession()
      this.flushTimer = setInterval(() => this.flush(), 10_000)

      // Flush when page becomes hidden or unloaded
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
          this.flush(true)
        }
      })

      window.addEventListener("pagehide", () => {
        this.flush(true)
      })
    }
  }

  private initSession() {
    try {
      let stored = sessionStorage.getItem("rateit_session_id")
      if (!stored) {
        stored = "sess_" + Math.random().toString(36).substring(2, 15) + "_" + Date.now()
        sessionStorage.setItem("rateit_session_id", stored)
      }
      this.sessionId = stored
    } catch {
      this.sessionId = "sess_" + Math.random().toString(36).substring(2, 15)
    }
  }

  public getSessionId(): string {
    if (!this.sessionId) this.initSession()
    return this.sessionId
  }

  /**
   * Queue an event to be sent in the next batch.
   */
  public track(event: TrackEventPayload) {
    this.buffer.push(event)
    if (this.buffer.length >= 25) {
      this.flush()
    }
  }

  /**
   * Helper to track entry to a place page and record start time for dwell.
   */
  public startPlaceDwell(placeId: string, category?: any) {
    this.dwellStartTimes.set(placeId, Date.now())
    this.track({
      type: "place_view",
      placeId,
      category,
    })
  }

  /**
   * Helper to stop dwell tracking and record dwell event if > 3s (capped at 120s).
   */
  public stopPlaceDwell(placeId: string, category?: any) {
    const start = this.dwellStartTimes.get(placeId)
    if (!start) return

    this.dwellStartTimes.delete(placeId)
    const elapsed = Date.now() - start

    // Dwell events fire only after 3s, capped at 120s
    if (elapsed >= 3000) {
      const cappedDwellMs = Math.min(120_000, elapsed)
      this.track({
        type: "place_dwell",
        placeId,
        category,
        dwellMs: cappedDwellMs,
      })
    }
  }

  /**
   * Flush batched events to the server.
   */
  public flush(useBeacon: boolean = false) {
    if (this.buffer.length === 0) return

    const eventsToSend = this.buffer.splice(0, 25)
    const payload = JSON.stringify({
      sessionId: this.getSessionId(),
      events: eventsToSend,
    })

    if (useBeacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" })
      const sent = navigator.sendBeacon("/api/events", blob)
      if (!sent) {
        // Fallback to fetch if sendBeacon fails
        this.sendViaFetch(payload, eventsToSend)
      }
    } else {
      this.sendViaFetch(payload, eventsToSend)
    }
  }

  private sendViaFetch(payload: string, eventsToSend: TrackEventPayload[]) {
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch((err) => {
      // Re-insert failed events if queue is not full
      if (this.buffer.length < 50) {
        this.buffer.unshift(...eventsToSend)
      }
    })
  }
}

export const tracker = new EventTracker()

