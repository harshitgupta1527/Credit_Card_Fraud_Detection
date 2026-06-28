import os
import sys

# Add root directory to path to enable running this script directly
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from typing import Tuple, List
from src.utils import logger

class DataPreprocessor:
    """
    Handles loading, cleaning, stratified splitting, and feature scaling 
    for the credit card fraud detection dataset.
    """
    def __init__(self, random_state: int = 42):
        self.random_state = random_state
        self.scaler = StandardScaler()
        self.feature_names: List[str] = []
        
    def load_data(self, filepath: str) -> pd.DataFrame:
        """
        Loads dataset from the specified CSV filepath.
        
        Args:
            filepath (str): Path to the CSV dataset.
            
        Returns:
            pd.DataFrame: Loaded dataset.
        """
        logger.info(f"Loading raw data from {filepath}...")
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Data file not found at {filepath}")
        df = pd.read_csv(filepath)
        logger.info(f"Loaded dataset of shape: {df.shape}")
        return df
        
    def preprocess(self, df: pd.DataFrame, target_col: str = 'Class') -> Tuple[pd.DataFrame, pd.Series]:
        """
        Cleans data by checking missing values and removing duplicate transactions.
        
        Args:
            df (pd.DataFrame): Raw DataFrame.
            target_col (str): Target column name.
            
        Returns:
            Tuple[pd.DataFrame, pd.Series]: Cleaned features (X) and target variable (y).
        """
        logger.info("Starting preprocessing step...")
        
        # Check and report missing values
        missing_count = df.isnull().sum().sum()
        if missing_count > 0:
            logger.warning(f"Found {missing_count} missing values. Filling with column medians...")
            df = df.fillna(df.median(numeric_only=True))
        else:
            logger.info("No missing values found.")
            
        # Duplicate removal (essential for avoiding data leakage)
        duplicates_count = df.duplicated().sum()
        if duplicates_count > 0:
            logger.info(f"Found {duplicates_count} duplicate rows. Removing them to prevent data leakage...")
            df = df.drop_duplicates().reset_index(drop=True)
            logger.info(f"Dataset shape after duplicate removal: {df.shape}")
        else:
            logger.info("No duplicate rows found.")
            
        X = df.drop(columns=[target_col])
        y = df[target_col]
        return X, y
        
    def split_and_scale(self, X: pd.DataFrame, y: pd.Series, test_size: float = 0.2) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
        """
        Splits data into train and test sets using stratified split and scales the 
        non-PCA features ('Time' and 'Amount') using StandardScaler.
        
        Args:
            X (pd.DataFrame): Features.
            y (pd.Series): Target.
            test_size (float): Proportion of dataset to include in test split.
            
        Returns:
            Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]: Train features, test features, train targets, test targets.
        """
        logger.info("Splitting dataset into train/test sets using Stratified Split...")
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=self.random_state, stratify=y
        )
        
        logger.info(f"Train set shape: {X_train.shape}, Test set shape: {X_test.shape}")
        logger.info(f"Train class distribution: Genuine={sum(y_train==0)}, Fraud={sum(y_train==1)} ({(sum(y_train==1)/len(y_train))*100:.3f}%)")
        logger.info(f"Test class distribution: Genuine={sum(y_test==0)}, Fraud={sum(y_test==1)} ({(sum(y_test==1)/len(y_test))*100:.3f}%)")
        
        # Feature Scaling: Only 'Time' and 'Amount' need scaling. V1-V28 are PCA dimensions already scaled/centered.
        logger.info("Scaling 'Time' and 'Amount' features using StandardScaler...")
        cols_to_scale = ['Time', 'Amount']
        
        # Work on copies to avoid SettingWithCopyWarning
        X_train_scaled = X_train.copy()
        X_test_scaled = X_test.copy()
        
        X_train_scaled[cols_to_scale] = self.scaler.fit_transform(X_train[cols_to_scale])
        X_test_scaled[cols_to_scale] = self.scaler.transform(X_test[cols_to_scale])
        
        self.feature_names = list(X_train.columns)
        
        return X_train_scaled, X_test_scaled, y_train, y_test
        
    def get_scaler(self) -> StandardScaler:
        """Returns the fitted StandardScaler instance."""
        return self.scaler
        
    def get_feature_names(self) -> List[str]:
        """Returns the list of features."""
        return self.feature_names
