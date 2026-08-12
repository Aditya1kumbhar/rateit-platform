// services/circuitLoader.js – static circuit profiles (no DB dependency)

const PROFILES = {
  Baku:     { type: "asymmetric",    regenCap: 8.5, straightBias: "HIGH",     saturationThreshold: 80 },
  Monza:    { type: "harvest_poor",  regenCap: 8.0, straightBias: "CRITICAL", saturationThreshold: 60 },
  Shanghai: { type: "harvest_rich",  regenCap: 8.5, straightBias: "MEDIUM",   saturationThreshold: 90 },
};

const DEFAULT_PROFILE = { type: "harvest_poor", regenCap: 8.0, straightBias: "MEDIUM", saturationThreshold: 70 };

export function loadCircuitProfile(circuitName) {
  return PROFILES[circuitName] || DEFAULT_PROFILE;
}
