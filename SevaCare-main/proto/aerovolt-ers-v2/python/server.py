import logging
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import uvicorn
import sys

from core.live_inference import inference_engine

# Configure robust logging to stdout to match the deterministic rules
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] [Python_API] %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

app = FastAPI(title="AeroVolt ERS - Python ML Microservice", version="2.0.0")

# --- API Contracts ---

class TelemetryFeatureVector(BaseModel):
    speed_kmh: float = Field(..., description="Vehicle speed in km/h")
    throttle_fraction: float = Field(..., description="Throttle pedal fraction 0.0 to 1.0")
    brake_pressure: float = Field(..., description="Brake pressure fraction 0.0 to 1.0")
    drs_active: bool = Field(..., description="Is DRS active")

class HMMInferenceResponse(BaseModel):
    dominant_state: str
    confidence: float
    deception_risk: bool
    beliefs: dict[str, float]

# --- Exception Handler ---
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.critical(f"Unhandled Exception on {request.method} {request.url.path}: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal Server Error", "details": "The machine learning pipeline encountered a critical failure."}
    )

# --- Routes ---

@app.get("/health")
async def health_check():
    """Simple health probe for orchestrator."""
    try:
        return {"status": "ok", "service": "aerovolt-ml-microservice"}
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Health check logic failed.")

@app.post("/api/v1/hmm/infer", response_model=HMMInferenceResponse)
async def run_hmm_inference(features: TelemetryFeatureVector):
    """
    Core HMM inference endpoint. 
    Accepts 1D telemetry vectors and returns the inferred belief state.
    """
    try:
        logger.info(f"Received inference request for features: {features.dict()}")
        
        # Extract features into an array for the mathematical engine
        obs_vector = [
            features.speed_kmh,
            features.throttle_fraction,
            features.brake_pressure,
            1.0 if features.drs_active else 0.0
        ]
        
        # Execute Live HMM Inference
        result = inference_engine.infer_belief_state(obs_vector)
        
        return HMMInferenceResponse(
            dominant_state=result["dominant_state"],
            confidence=result["confidence"],
            deception_risk=result["deception_risk"],
            beliefs=result["beliefs"]
        )
        
    except ValueError as ve:
        logger.error(f"Validation Error during inference: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.critical(f"Critical Inference Failure: {str(e)}")
        raise HTTPException(status_code=500, detail="Inference engine crashed")

if __name__ == "__main__":
    logger.info("Starting Python ML Microservice on port 8000...")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
