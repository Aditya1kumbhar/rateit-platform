import json
import logging
import os
import sys
from pathlib import Path
import urllib.request
import urllib.error
import numpy as np
from hmmlearn import hmm

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] [Retrainer] %(message)s', handlers=[logging.StreamHandler(sys.stdout)])
logger = logging.getLogger(__name__)

class DynamicRetrainer:
    def __init__(self):
        self.supabase_url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
        self.supabase_key = os.environ.get('NEXT_PUBLIC_SUPABASE_ANON_KEY')
        self.params_out_path = Path(__file__).parent.parent.parent / "lib" / "hmm" / "params.json"
        
        if not self.supabase_url or not self.supabase_key:
            logger.critical("Missing Supabase credentials in environment variables.")
            sys.exit(1)

    def fetch_historical_telemetry(self, session_id: str) -> np.ndarray:
        """Fetches telemetry data from Supabase for a specific session."""
        logger.info(f"Fetching historical telemetry for session: {session_id}")
        
        # Build REST API URL
        endpoint = f"{self.supabase_url}/rest/v1/telemetry_features?session_id=eq.{session_id}&select=speed_kmh,throttle_fraction,brake_pressure,aero_mode"
        
        req = urllib.request.Request(endpoint, headers={
            "apikey": self.supabase_key,
            "Authorization": f"Bearer {self.supabase_key}",
            "Content-Type": "application/json"
        })

        try:
            with urllib.request.urlopen(req) as response:
                if response.status != 200:
                    raise Exception(f"HTTP {response.status}")
                data = json.loads(response.read().decode('utf-8'))
                
                if not data or len(data) < 10:
                    raise ValueError(f"Insufficient telemetry data ({len(data)} rows). Need at least 10 observations.")
                
                # Format into 2D feature matrix
                features = []
                for row in data:
                    features.append([
                        float(row.get('speed_kmh', 0.0)),
                        float(row.get('throttle_fraction', 0.0)),
                        float(row.get('brake_pressure', 0.0)),
                        1.0 if row.get('aero_mode') == 'STRAIGHT' else 0.0
                    ])
                
                return np.array(features)
        except urllib.error.URLError as e:
            logger.critical(f"Failed to connect to Supabase: {str(e)}")
            raise
        except Exception as e:
            logger.critical(f"Failed to parse telemetry data: {str(e)}")
            raise

    def retrain_model(self, X: np.ndarray, num_states: int = 40):
        """Fits a new Gaussian HMM to the feature matrix and saves the parameters."""
        logger.info(f"Training new {num_states}-state Gaussian HMM on {X.shape[0]} observations...")
        
        try:
            # Initialize and fit the model
            model = hmm.GaussianHMM(n_components=num_states, covariance_type="diag", n_iter=100, random_state=42)
            model.fit(X)
            
            logger.info("Training complete. Exporting parameters to JSON AST.")
            
            # Extract parameters safely
            params = {
                'A': model.transmat_.tolist(),
                'means': model.means_.tolist(),
                'variances': model.covars_.tolist(),
                'pi': model.startprob_.tolist()
            }
            
            # Save atomic write to avoid corrupting active inference
            temp_path = self.params_out_path.with_suffix('.tmp')
            with open(temp_path, 'w') as f:
                json.dump(params, f, indent=2)
            temp_path.replace(self.params_out_path)
            
            logger.info(f"Successfully saved new HMM parameters to {self.params_out_path}")
            
        except Exception as e:
            logger.critical(f"Catastrophic failure during model training: {str(e)}")
            raise

if __name__ == "__main__":
    retrainer = DynamicRetrainer()
    
    # Example Target Session
    # In production, this would be triggered by a cron job or webhook passing the session ID
    TARGET_SESSION = '00000000-0000-0000-0000-000000000000'
    
    try:
        X_train = retrainer.fetch_historical_telemetry(TARGET_SESSION)
        retrainer.retrain_model(X_train)
    except Exception as e:
        logger.error("Dynamic retraining pipeline failed.")
        sys.exit(1)
