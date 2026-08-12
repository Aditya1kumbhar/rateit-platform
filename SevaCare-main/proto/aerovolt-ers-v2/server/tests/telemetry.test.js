// server/tests/telemetry.test.js
import request from "supertest";
import app from "../src/index.js";

/**
 * Minimal integration test for the /api/telemetry endpoint.
 * Uses a mock Supabase client by setting environment variables to a local instance.
 * In CI you may point SUPABASE_URL to the test project.
 */

describe("POST /api/telemetry", () => {
  it("should return a valid decision JSON for a good packet", async () => {
    const payload = {
      timestamp: new Date().toISOString(),
      lap: 10,
      sector: 2,
      speed: 320,
      throttle: 95,
      brake: 0,
      gear: 8,
      lap_time: 90,
      sector_time: 30,
      gap_ahead: 2,
      track_temp: 35,
      circuit_name: "Baku",
      own_soc: 0.7,
      opponent_speed_delta: -5,
      aero_state: "open",
    };

    const res = await request(app).post("/api/telemetry").send(payload);
    expect(res.statusCode).toBe(200);
    const decision = res.body;
    expect(decision).toHaveProperty("action");
    expect(decision).toHaveProperty("confidence");
    expect(decision).toHaveProperty("reason");
    expect(decision).toHaveProperty("expected_gain");
    expect(decision).toHaveProperty("battery_impact");
    expect(decision).toHaveProperty("fallback_action");
    expect(decision).toHaveProperty("radio_text");
  });
});
