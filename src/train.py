import os
import sys
import time

# Add root directory to path to enable running this script directly
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple, List
from imblearn.over_sampling import SMOTE
from imblearn.under_sampling import RandomUnderSampler
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
import xgboost as xgb
import lightgbm as lgb
from catboost import CatBoostClassifier
from sklearn.model_selection import RandomizedSearchCV

from src.utils import logger, download_dataset, save_artifact
from src.preprocessing import DataPreprocessor
from src.evaluate import calculate_metrics

# SHAP compatibility check (handles C-extension issues on newer python versions)
try:
    import shap
    HAS_SHAP = True
except ImportError:
    HAS_SHAP = False

def train_and_evaluate_model(
    model_name: str,
    model: Any,
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series
) -> Dict[str, Any]:
    """
    Fits a model and calculates test metrics.
    """
    logger.info(f"Training {model_name}...")
    start_time = time.time()
    
    # Handle lightgbm warnings for categorical columns if any (none in this dataset)
    model.fit(X_train.values, y_train.values)
    
    elapsed_time = time.time() - start_time
    logger.info(f"{model_name} trained in {elapsed_time:.2f} seconds.")
    
    # Predict and evaluate
    y_pred = model.predict(X_test.values)
    try:
        y_prob = model.predict_proba(X_test.values)[:, 1]
    except AttributeError:
        # Fallback for models without predict_proba if any
        y_prob = y_pred.astype(float)
        
    metrics = calculate_metrics(y_test.values, y_pred, y_prob)
    metrics["Train Time (s)"] = elapsed_time
    return metrics

def run_experiment(
    X_tr: pd.DataFrame,
    y_tr: pd.Series,
    X_te: pd.DataFrame,
    y_te: pd.Series,
    sampling_name: str
) -> pd.DataFrame:
    """
    Trains all six models on the given training set (e.g. SMOTE, RUS, or Original)
    and returns a summary of their performances.
    """
    logger.info(f"--- Running experiment with sampling strategy: {sampling_name} ---")
    
    models = {
        "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42, n_jobs=-1),
        "Decision Tree": DecisionTreeClassifier(max_depth=10, random_state=42),
        "Random Forest": RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1),
        "XGBoost": xgb.XGBClassifier(n_estimators=100, max_depth=5, learning_rate=0.1, random_state=42, eval_metric="logloss", n_jobs=-1),
        "LightGBM": lgb.LGBMClassifier(n_estimators=100, max_depth=5, learning_rate=0.1, random_state=42, verbosity=-1, n_jobs=-1),
        "CatBoost": CatBoostClassifier(iterations=100, depth=6, learning_rate=0.1, random_state=42, verbose=0, thread_count=-1)
    }
    
    results = []
    for model_name, model in models.items():
        try:
            metrics = train_and_evaluate_model(model_name, model, X_tr, y_tr, X_te, y_te)
            metrics["Model"] = model_name
            metrics["Sampling"] = sampling_name
            results.append(metrics)
        except Exception as e:
            logger.error(f"Error training {model_name} on {sampling_name} data: {e}")
            
    return pd.DataFrame(results)

def main() -> None:
    # 1. Download dataset if not exists
    url = "https://huggingface.co/datasets/JEFFREY-VERDIERE/Creditcard/resolve/main/creditcard.csv"
    data_dir = "data"
    csv_path = os.path.join(data_dir, "creditcard.csv")
    
    download_dataset(url, csv_path)
    
    # 2. Preprocess data
    preprocessor = DataPreprocessor(random_state=42)
    df = preprocessor.load_data(csv_path)
    X, y = preprocessor.preprocess(df)
    X_train, X_test, y_train, y_test = preprocessor.split_and_scale(X, y)
    
    # 3. Create resampled datasets
    # SMOTE
    logger.info("Applying SMOTE resampling on training set...")
    smote = SMOTE(random_state=42)
    X_train_smote_arr, y_train_smote_arr = smote.fit_resample(X_train.values, y_train.values)
    X_train_smote = pd.DataFrame(X_train_smote_arr, columns=X_train.columns)
    y_train_smote = pd.Series(y_train_smote_arr)
    logger.info(f"SMOTE training set shape: {X_train_smote.shape}, Genuine={sum(y_train_smote==0)}, Fraud={sum(y_train_smote==1)}")
    
    # Random Under Sampler
    logger.info("Applying Random Under-Sampling on training set...")
    rus = RandomUnderSampler(random_state=42)
    X_train_rus_arr, y_train_rus_arr = rus.fit_resample(X_train.values, y_train.values)
    X_train_rus = pd.DataFrame(X_train_rus_arr, columns=X_train.columns)
    y_train_rus = pd.Series(y_train_rus_arr)
    logger.info(f"RUS training set shape: {X_train_rus.shape}, Genuine={sum(y_train_rus==0)}, Fraud={sum(y_train_rus==1)}")
    
    # 4. Compare performance across strategies
    # To save time, we can run experiments on:
    # - Original (imbalanced)
    # - SMOTE
    # - RUS
    df_orig = run_experiment(X_train, y_train, X_test, y_test, "Original")
    df_smote = run_experiment(X_train_smote, y_train_smote, X_test, y_test, "SMOTE")
    df_rus = run_experiment(X_train_rus, y_train_rus, X_test, y_test, "RUS")
    
    # Combine results
    all_results = pd.concat([df_orig, df_smote, df_rus], ignore_index=True)
    logger.info("Comparison Results:\n" + all_results.to_string())
    
    # Save comparison metrics as project metadata for Streamlit to view
    os.makedirs("models", exist_ok=True)
    all_results.to_csv("models/comparison_results.csv", index=False)
    
    # 5. Select best model based on F1-Score on test set
    # (Since this is highly imbalanced, F1-Score is the best selector)
    best_row = all_results.loc[all_results["F1-Score"].idxmax()]
    best_model_name = best_row["Model"]
    best_sampling = best_row["Sampling"]
    logger.info(f"Best model based on F1-Score is: {best_model_name} with {best_sampling} data. F1-Score: {best_row['F1-Score']:.4f}")
    
    # Prepare training set for best model
    if best_sampling == "SMOTE":
        X_train_best, y_train_best = X_train_smote, y_train_smote
    elif best_sampling == "RUS":
        X_train_best, y_train_best = X_train_rus, y_train_rus
    else:
        X_train_best, y_train_best = X_train, y_train
        
    # 6. Hyperparameter Tuning of the Best Model
    logger.info(f"Tuning hyperparameters for {best_model_name}...")
    
    # Define hyperparameter spaces and base estimators
    if best_model_name == "Logistic Regression":
        base_estimator = LogisticRegression(max_iter=1000, random_state=42)
        param_grid = {"C": [0.01, 0.1, 1.0, 10.0]}
    elif best_model_name == "Decision Tree":
        base_estimator = DecisionTreeClassifier(random_state=42)
        param_grid = {"max_depth": [5, 10, 15], "min_samples_split": [2, 5]}
    elif best_model_name == "Random Forest":
        base_estimator = RandomForestClassifier(random_state=42, n_jobs=-1)
        param_grid = {"n_estimators": [50, 100], "max_depth": [5, 10]}
    elif best_model_name == "XGBoost":
        base_estimator = xgb.XGBClassifier(random_state=42, eval_metric="logloss", n_jobs=-1)
        param_grid = {"n_estimators": [50, 100], "max_depth": [3, 5], "learning_rate": [0.05, 0.1, 0.2]}
    elif best_model_name == "LightGBM":
        base_estimator = lgb.LGBMClassifier(random_state=42, verbosity=-1, n_jobs=-1)
        param_grid = {"n_estimators": [50, 100], "max_depth": [3, 5], "learning_rate": [0.05, 0.1, 0.2]}
    else:  # CatBoost
        base_estimator = CatBoostClassifier(random_state=42, verbose=0, thread_count=-1)
        param_grid = {"iterations": [50, 100], "depth": [4, 6], "learning_rate": [0.05, 0.1, 0.2]}
        
    # Hyperparameter search using RandomizedSearchCV to control execution time
    search = RandomizedSearchCV(
        estimator=base_estimator,
        param_distributions=param_grid,
        n_iter=4,
        cv=3,
        scoring="f1",
        random_state=42,
        n_jobs=-1
    )
    
    logger.info("Fitting Hyperparameter Search...")
    search.fit(X_train_best.values, y_train_best.values)
    
    tuned_model = search.best_estimator_
    logger.info(f"Best parameters: {search.best_params_}")
    
    # Evaluate Tuned Model
    y_pred_tuned = tuned_model.predict(X_test.values)
    try:
        y_prob_tuned = tuned_model.predict_proba(X_test.values)[:, 1]
    except AttributeError:
        y_prob_tuned = y_pred_tuned.astype(float)
        
    tuned_metrics = calculate_metrics(y_test.values, y_pred_tuned, y_prob_tuned)
    logger.info(f"Tuned Model Metrics: {tuned_metrics}")
    
    # Save best models and artifacts
    logger.info("Saving best model and scaler artifacts...")
    save_artifact(tuned_model, "models/best_model.pkl")
    save_artifact(preprocessor.get_scaler(), "models/scaler.pkl")
    save_artifact(preprocessor.get_feature_names(), "models/feature_names.pkl")
    
    # Save metadata for model training summary
    best_model_meta = {
        "model_name": best_model_name,
        "sampling_strategy": best_sampling,
        "best_params": search.best_params_,
        "metrics": tuned_metrics
    }
    save_artifact(best_model_meta, "models/best_model_meta.pkl")
    
    # Save a small representative test dataframe for Streamlit interactive prediction page
    # Combine some Genuine and Fraud records to make it interesting
    test_df = pd.DataFrame(X_test, columns=X_train.columns)
    test_df['Class'] = y_test.values
    
    frauds = test_df[test_df['Class'] == 1]
    genuine = test_df[test_df['Class'] == 0].sample(n=min(500, len(test_df[test_df['Class'] == 0])), random_state=42)
    sample_test_df = pd.concat([frauds, genuine]).sample(frac=1.0, random_state=42).reset_index(drop=True)
    sample_test_df.to_csv("models/sample_test_data.csv", index=False)
    logger.info(f"Saved test samples dataset of shape {sample_test_df.shape} to models/sample_test_data.csv")
    
    # 7. Generate and save SHAP Explainer and values on a subset (if SHAP is available)
    if HAS_SHAP:
        try:
            logger.info("Pre-calculating SHAP values for Explainability dashboard...")
            # Sample 100 observations to keep it fast
            shap_sample = sample_test_df.drop(columns=['Class']).head(100)
            
            # Choose explainer based on model class
            if isinstance(tuned_model, (DecisionTreeClassifier, RandomForestClassifier, xgb.XGBClassifier, lgb.LGBMClassifier)):
                explainer = shap.TreeExplainer(tuned_model)
                shap_values = explainer.shap_values(shap_sample.values)
            elif isinstance(tuned_model, LogisticRegression):
                explainer = shap.LinearExplainer(tuned_model, shap_sample.values)
                shap_values = explainer.shap_values(shap_sample.values)
            else:
                explainer = shap.Explainer(tuned_model, shap_sample.values)
                shap_values = explainer(shap_sample.values)
                
            save_artifact(explainer, "models/shap_explainer.pkl")
            save_artifact(shap_values, "models/shap_values.pkl")
            save_artifact(shap_sample, "models/shap_sample.pkl")
            logger.info("SHAP values and explainer successfully saved.")
        except Exception as shap_err:
            logger.error(f"Error occurred during SHAP calculation: {shap_err}")
    else:
        logger.warning("SHAP calculation skipped due to missing SHAP package or compatibility error.")

if __name__ == "__main__":
    main()
