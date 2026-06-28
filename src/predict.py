import os
import sys

# Add root directory to path to enable running this script directly
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple
from src.utils import logger, load_artifact

class FraudPredictor:
    """
    Class to load model artifacts and run fraud prediction 
    on raw transaction data inputs.
    """
    def __init__(self, models_dir: str = "models"):
        self.models_dir = models_dir
        self.model_path = os.path.join(models_dir, "best_model.pkl")
        self.scaler_path = os.path.join(models_dir, "scaler.pkl")
        self.features_path = os.path.join(models_dir, "feature_names.pkl")
        
        self.model = None
        self.scaler = None
        self.feature_names = None
        
        # Proactively load artifacts if they are present
        self.load_model_artifacts()
        
    def load_model_artifacts(self) -> None:
        """Loads serialized model, scaler, and features list."""
        try:
            if os.path.exists(self.model_path) and os.path.exists(self.scaler_path) and os.path.exists(self.features_path):
                self.model = load_artifact(self.model_path)
                self.scaler = load_artifact(self.scaler_path)
                self.feature_names = load_artifact(self.features_path)
                logger.info("Successfully loaded all prediction artifacts.")
            else:
                logger.warning("Prediction artifacts not found. Make sure to train a model first.")
        except Exception as e:
            logger.error(f"Error loading prediction artifacts: {e}")
            
    def predict(self, raw_data: Dict[str, Any]) -> Tuple[int, float, float]:
        """
        Predicts whether a single transaction is fraudulent.
        
        Args:
            raw_data (Dict[str, Any]): Dictionary of transaction features (Time, Amount, V1-V28).
            
        Returns:
            Tuple[int, float, float]: (prediction_class, probability_score, confidence_percentage)
        """
        if self.model is None or self.scaler is None or self.feature_names is None:
            # Attempt to load model artifacts if not already loaded
            self.load_model_artifacts()
            if self.model is None:
                raise ValueError("Model artifacts are not loaded. Train the models first.")
                
        # Convert dictionary to DataFrame
        df = pd.DataFrame([raw_data])
        
        # Ensure correct feature alignment
        for col in self.feature_names:
            if col not in df.columns:
                df[col] = 0.0
                
        # Select and reorder columns to match training features exactly
        df = df[self.feature_names]
        
        # Scale 'Time' and 'Amount'
        df_scaled = df.copy()
        cols_to_scale = ['Time', 'Amount']
        df_scaled[cols_to_scale] = self.scaler.transform(df[cols_to_scale])
        
        # Predict probability
        prob = float(self.model.predict_proba(df_scaled.values)[0, 1])
        pred = int(self.model.predict(df_scaled.values)[0])
        
        # Calculate confidence
        confidence = prob if pred == 1 else (1.0 - prob)
        
        return pred, prob, confidence * 100.0
