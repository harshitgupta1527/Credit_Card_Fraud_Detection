import os
import time
import joblib
import pandas as pd
from typing import Dict, Any, Tuple
import logging

logger = logging.getLogger("fraud_detection")

class MLService:
    """
    Singleton service class to manage ML model loading, feature scaling, 
    and transaction fraud inference.
    """
    def __init__(self, assets_dir: str = None):
        if assets_dir is None:
            # Locate backend/ml_assets relative to this file
            assets_dir = os.path.abspath(
                os.path.join(os.path.dirname(__file__), "..", "ml_assets")
            )
            
        self.model_path = os.path.join(assets_dir, "best_model.pkl")
        self.scaler_path = os.path.join(assets_dir, "scaler.pkl")
        self.features_path = os.path.join(assets_dir, "feature_names.pkl")
        self.meta_path = os.path.join(assets_dir, "best_model_meta.pkl")
        
        self.model = None
        self.scaler = None
        self.feature_names = None
        self.metadata = None
        
        self.load_assets()
        
    def load_assets(self) -> None:
        """Loads model, scaler, feature list and metadata from files."""
        try:
            if os.path.exists(self.model_path) and os.path.exists(self.scaler_path):
                self.model = joblib.load(self.model_path)
                self.scaler = joblib.load(self.scaler_path)
                self.feature_names = joblib.load(self.features_path)
                if os.path.exists(self.meta_path):
                    self.metadata = joblib.load(self.meta_path)
                logger.info("ML Service successfully loaded all assets.")
            else:
                logger.warning(
                    f"ML assets files not found. Expected: {self.model_path}"
                )
        except Exception as e:
            logger.error(f"Error loading ML assets in MLService: {e}")
            
    def predict(self, raw_data: Dict[str, Any]) -> Tuple[str, float, str, str, str, float]:
        """
        Ingests a raw transaction, aligns features, scales numeric columns,
        runs model prediction, and outputs security response details.
        
        Returns:
            Tuple[str, float, str, str, str, float]: 
            (prediction_label, probability_score, confidence, risk_level, recommendation, response_time_ms)
        """
        start_time = time.time()
        
        if self.model is None or self.scaler is None or self.feature_names is None:
            self.load_assets()
            if self.model is None:
                raise ValueError("ML model assets are not initialized or loaded.")
                
        # Convert dictionary to DataFrame
        df = pd.DataFrame([raw_data])
        
        # Ensure correct column alignment (fill missing with 0.0)
        for col in self.feature_names:
            if col not in df.columns:
                df[col] = 0.0
                
        # Restructure to match trained order
        df = df[self.feature_names]
        
        # Scale 'Time' and 'Amount'
        df_scaled = df.copy()
        cols_to_scale = ['Time', 'Amount']
        df_scaled[cols_to_scale] = self.scaler.transform(df[cols_to_scale])
        
        # Predict Class and Probability
        prob = float(self.model.predict_proba(df_scaled.values)[0, 1])
        pred = int(self.model.predict(df_scaled.values)[0])
        
        # Label & Confidence calculations
        label = "Fraud" if pred == 1 else "Genuine"
        confidence = prob if pred == 1 else (1.0 - prob)
        confidence_str = f"{confidence * 100.0:.0f}%"
        
        # Risk Mapping and Recommended Operations
        if prob > 0.8:
            risk = "High"
            rec = "Block Transaction"
        elif prob > 0.35:
            risk = "Medium"
            rec = "Review Manually"
        else:
            risk = "Low"
            rec = "Approve Transaction"
            
        elapsed_time_ms = (time.time() - start_time) * 1000.0
        
        return label, prob, confidence_str, risk, rec, elapsed_time_ms

# Export singleton instance
ml_service = MLService()
