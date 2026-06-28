import streamlit as st
import pandas as pd
import numpy as np
import os
import joblib
import plotly.express as px
import plotly.graph_objects as go

# Import our modular functions
from src.predict import FraudPredictor
from src.evaluate import (
    plot_confusion_matrix, plot_roc_curve, plot_pr_curve,
    plot_feature_importance, plot_class_distribution,
    plot_amount_distribution, plot_correlation_heatmap
)

# Set page layout and config
st.set_page_config(
    page_title="Credit Card Fraud Detection Portal",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Premium Custom CSS Styling for Modern Glassmorphism/Dark Theme
st.markdown("""
<style>
    /* Main body background styling */
    .stApp {
        background-color: #0d1117;
        color: #c9d1d9;
    }
    
    /* Center titles and modify headers */
    h1, h2, h3 {
        font-family: 'Outfit', 'Inter', sans-serif;
        font-weight: 700;
        color: #58a6ff !important;
    }
    
    /* Styling cards */
    .metric-card {
        background: rgba(22, 27, 34, 0.8);
        border: 1px solid #30363d;
        border-radius: 12px;
        padding: 20px;
        margin: 10px 0px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s ease-in-out;
    }
    
    .metric-card:hover {
        transform: translateY(-5px);
        border-color: #58a6ff;
    }
    
    .metric-title {
        font-size: 14px;
        color: #8b949e;
        text-transform: uppercase;
        letter-spacing: 1px;
    }
    
    .metric-value {
        font-size: 28px;
        font-weight: 700;
        color: #ffffff;
        margin-top: 5px;
    }
    
    /* Prediction Badges */
    .badge-fraud {
        background-color: #f85149;
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-weight: bold;
        display: inline-block;
        font-size: 16px;
        box-shadow: 0 0 10px rgba(248, 81, 73, 0.5);
    }
    
    .badge-genuine {
        background-color: #56d364;
        color: black;
        padding: 8px 16px;
        border-radius: 20px;
        font-weight: bold;
        display: inline-block;
        font-size: 16px;
        box-shadow: 0 0 10px rgba(86, 211, 100, 0.5);
    }
</style>
""", unsafe_allow_html=True)

# Helper function to load data safely
@st.cache_data
def load_raw_dataset(path: str) -> pd.DataFrame:
    if os.path.exists(path):
        return pd.read_csv(path)
    return pd.DataFrame()

@st.cache_data
def load_sample_test_data(path: str) -> pd.DataFrame:
    if os.path.exists(path):
        return pd.read_csv(path)
    return pd.DataFrame()

# Initialize predictor
predictor = FraudPredictor()

# Load required metadata
comparison_path = "models/comparison_results.csv"
meta_path = "models/best_model_meta.pkl"

has_results = os.path.exists(comparison_path)
has_meta = os.path.exists(meta_path)

# Sidebar navigation
st.sidebar.markdown("<h2 style='text-align: center; color: #58a6ff;'>🛡️ Fraud Guard</h2>", unsafe_allow_html=True)
st.sidebar.markdown("<p style='text-align: center; font-style: italic; color: #8b949e;'>Real-time AI Transaction Monitor</p>", unsafe_allow_html=True)
st.sidebar.write("---")

page = st.sidebar.selectbox(
    "Navigation Menu",
    ["Home", "Dataset Overview", "EDA", "Model Performance", "Fraud Prediction", "About Project"]
)

# App Data Paths
raw_data_path = "data/creditcard.csv"
sample_data_path = "models/sample_test_data.csv"

raw_df = load_raw_dataset(raw_data_path)
sample_df = load_sample_test_data(sample_data_path)

# ----------------- PAGE 1: HOME -----------------
if page == "Home":
    st.title("💳 Credit Card Fraud Detection Portal")
    st.write("---")
    
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.markdown("""
        ### Securing Transactions with Advanced AI
        Welcome to the **Fraud Guard Credit Card Fraud Detection Portal**. This platform demonstrates an end-to-end, industry-grade Machine Learning solution designed to detect fraudulent credit card transactions in real-time.
        
        Using anonymized PCA features alongside transaction metadata, this application classifies transactions as **Genuine** or **Fraudulent** with high precision, minimizing costly false alarms for financial institutions and customers alike.
        
        #### Core Capabilities:
        - **Resampling Pipeline**: Handles extreme class imbalance using SMOTE and Random Under-Sampling.
        - **Multi-Model Benchmark**: Evaluates and compares Logistic Regression, Decision Trees, Random Forests, XGBoost, LightGBM, and CatBoost.
        - **Hyperparameter Optimization**: Automated tuning of the top-performing model structure.
        - **Model Explainability**: Precomputed SHAP feature contribution charts.
        - **Real-time Prediction**: Interactive sandbox to inspect and classify raw transaction metrics.
        """)
        
        st.write("")
        if st.button("Access Live Predictor"):
            st.info("Select 'Fraud Prediction' from the sidebar menu to start testing.")
            
    with col2:
        st.markdown("""
        <div class='metric-card' style='text-align: center;'>
            <div class='metric-title'>Dataset Size</div>
            <div class='metric-value'>284,807</div>
            <div style='color: #8b949e; margin-top: 5px;'>Transactions Analyzed</div>
        </div>
        <div class='metric-card' style='text-align: center;'>
            <div class='metric-title'>Imbalance Ratio</div>
            <div class='metric-value'>0.172%</div>
            <div style='color: #EF5350; margin-top: 5px;'>Fraudulent Transactions</div>
        </div>
        <div class='metric-card' style='text-align: center;'>
            <div class='metric-title'>Production Model</div>
            <div class='metric-value'>LightGBM</div>
            <div style='color: #66BB6A; margin-top: 5px;'>Optimized with SMOTE</div>
        </div>
        """, unsafe_allow_html=True)

# ----------------- PAGE 2: DATASET OVERVIEW -----------------
elif page == "Dataset Overview":
    st.title("📊 Dataset Overview")
    st.write("---")
    
    if raw_df.empty:
        st.warning("Dataset CSV not found. Please run model training first to download the dataset.")
    else:
        st.markdown("### Kaggle Credit Card Fraud Detection Dataset")
        st.write("This dataset contains transactions made by credit cards in September 2013 by European cardholders. It contains only numerical input variables which are the result of a PCA transformation.")
        
        # Metric row
        col1, col2, col3, col4 = st.columns(4)
        
        num_rows = len(raw_df)
        num_fraud = int(raw_df['Class'].sum())
        num_genuine = num_rows - num_fraud
        fraud_percentage = (num_fraud / num_rows) * 100
        
        with col1:
            st.markdown(f"<div class='metric-card'><div class='metric-title'>Total Transactions</div><div class='metric-value'>{num_rows:,}</div></div>", unsafe_allow_html=True)
        with col2:
            st.markdown(f"<div class='metric-card'><div class='metric-title'>Genuine Transactions</div><div class='metric-value'>{num_genuine:,}</div></div>", unsafe_allow_html=True)
        with col3:
            st.markdown(f"<div class='metric-card'><div class='metric-title'>Fraudulent Transactions</div><div class='metric-value'>{num_fraud:,}</div></div>", unsafe_allow_html=True)
        with col4:
            st.markdown(f"<div class='metric-card'><div class='metric-title'>Fraud Ratio</div><div class='metric-value' style='color:#EF5350;'>{fraud_percentage:.3f}%</div></div>", unsafe_allow_html=True)
            
        st.write("### Sample Data Table")
        st.dataframe(raw_df.head(25), use_container_width=True)
        
        # Display dataset features summary
        st.write("### Dataset Columns and Summary Statistics")
        st.dataframe(raw_df.describe().T, use_container_width=True)

# ----------------- PAGE 3: EDA -----------------
elif page == "EDA":
    st.title("📈 Exploratory Data Analysis")
    st.write("---")
    
    if raw_df.empty:
        st.warning("Dataset CSV not found. Please run training to enable EDA page.")
    else:
        # Create tabs for different EDA plots
        tab1, tab2, tab3 = st.tabs(["Class Distribution & Amounts", "PCA Correlation Map", "Time Distribution"])
        
        with tab1:
            col1, col2 = st.columns(2)
            with col1:
                st.write("#### Class Imbalance visualization")
                fig_dist = plot_class_distribution(raw_df['Class'])
                st.plotly_chart(fig_dist, use_container_width=True)
                st.info("Insight: Accuracy is not a valid metric since a baseline model predicting 0 would yield 99.828% accuracy.")
                
            with col2:
                st.write("#### Transaction Amounts Distribution")
                fig_amount = plot_amount_distribution(raw_df)
                st.plotly_chart(fig_amount, use_container_width=True)
                st.info("Insight: The average fraud amount is slightly higher than genuine transactions, but has a smaller maximum value.")
                
        with tab2:
            st.write("#### Correlation Matrix of Core Features")
            # Select first 10 V features + Time + Amount + Class
            cols_corr = ['Time', 'Amount', 'Class'] + [f'V{i}' for i in range(1, 11)]
            fig_heatmap = plot_correlation_heatmap(raw_df, cols_corr)
            st.plotly_chart(fig_heatmap, use_container_width=True)
            st.info("Insight: PCA features V1-V28 are completely uncorrelated with one another (correlation = 0.00). However, some V features correlate strongly with the Class column, making them highly predictive features.")
            
        with tab3:
            st.write("#### Day/Night Transaction Cycles")
            # Group by class and generate distributions for Time
            fig_time = px.histogram(
                raw_df, x="Time", color="Class",
                marginal="box", nbins=100,
                color_discrete_map={0: '#66BB6A', 1: '#EF5350'},
                title="Transaction Frequencies Over Time (Seconds)",
                log_y=True
            )
            fig_time.update_layout(template="plotly_dark")
            st.plotly_chart(fig_time, use_container_width=True)
            st.info("Insight: Genuine transactions show a clear cyclical drop (night-time hours). Fraudulent transactions show a much more uniform distribution across time.")

# ----------------- PAGE 4: MODEL PERFORMANCE -----------------
elif page == "Model Performance":
    st.title("🏆 Model Performance & Comparison")
    st.write("---")
    
    if not has_results:
        st.warning("Performance results not found. Proactively run training scripts in your environment to build and benchmark models.")
    else:
        results_df = pd.read_csv(comparison_path)
        
        st.markdown("### Resampling & Model Benchmark Matrix")
        st.write("Below are the metrics achieved by six classifiers across three sampling settings (Original, SMOTE, and Random Under-sampling) on the holdout test set.")
        
        # Display table
        st.dataframe(results_df.style.background_gradient(cmap='Blues', subset=['F1-Score', 'Precision', 'Recall', 'ROC-AUC', 'PR-AUC']), use_container_width=True)
        
        # Comparison plots
        st.write("### Interactive Benchmark Visualizer")
        metric_choice = st.selectbox("Select Evaluation Metric to Compare", ["F1-Score", "Precision", "Recall", "ROC-AUC", "PR-AUC"])
        
        fig_compare = px.bar(
            results_df, x="Model", y=metric_choice, color="Sampling",
            barmode="group",
            color_discrete_map={"Original": "#29B6F6", "SMOTE": "#26A69A", "RUS": "#AB47BC"},
            title=f"Classifier Comparison: {metric_choice}"
        )
        fig_compare.update_layout(template="plotly_dark", yaxis_range=[0, 1.05])
        st.plotly_chart(fig_compare, use_container_width=True)
        
        # Show best model details
        if has_meta:
            best_meta = joblib.load(meta_path)
            st.success(f"🤖 **Production Model Selected**: **{best_meta['model_name']}** trained on **{best_meta['sampling_strategy']}** data.")
            
            col1, col2 = st.columns(2)
            with col1:
                st.write("#### Production Model Parameters")
                st.json(best_meta['params'] if 'params' in best_meta else best_meta.get('best_params', {}))
            with col2:
                st.write("#### Production Model Metrics Summary")
                st.dataframe(pd.DataFrame([best_meta['metrics']]).T.rename(columns={0: 'Metric Score'}), use_container_width=True)

# ----------------- PAGE 5: FRAUD PREDICTION -----------------
elif page == "Fraud Prediction":
    st.title("🛡️ Real-Time Transaction Predictor")
    st.write("---")
    
    if predictor.model is None:
        st.warning("Trained model not found. Please run model training script `python src/train.py` first to fit and save the production model.")
    else:
        st.write("Input features of a transaction manually or select a real sample transaction from our holdout test set to populate the form.")
        
        # Prepopulate sample transactions
        if not sample_df.empty:
            st.subheader("💡 Select a Test Sample")
            
            # Label records
            sample_df['Transaction_Label'] = sample_df.apply(
                lambda row: f"Index {row.name} - " + ("🔴 FRAUDULENT" if row['Class'] == 1 else "🟢 GENUINE") + f" | Amount: ${row['Amount']:.2f}",
                axis=1
            )
            
            selected_sample_lbl = st.selectbox(
                "Choose a transaction template to auto-populate fields",
                ["-- Manual Entry --"] + list(sample_df['Transaction_Label'].values)
            )
            
            if selected_sample_lbl != "-- Manual Entry --":
                selected_idx = sample_df[sample_df['Transaction_Label'] == selected_sample_lbl].index[0]
                sample_record = sample_df.loc[selected_idx].to_dict()
            else:
                sample_record = None
        else:
            sample_record = None
            
        # Prediction Form
        with st.form("prediction_form"):
            st.subheader("📝 Transaction Details")
            
            col1, col2, col3 = st.columns(3)
            
            with col1:
                # Time and Amount
                time_val = st.number_input(
                    "Time (seconds elapsed)",
                    value=float(sample_record['Time']) if sample_record else 100000.0,
                    step=100.0
                )
                amount_val = st.number_input(
                    "Amount ($)",
                    value=float(sample_record['Amount']) if sample_record else 50.0,
                    step=5.0
                )
                
            # Create form entries for V1-V28
            # V1 - V28 values
            v_inputs = {}
            for i in range(1, 29):
                with (col1 if i % 3 == 0 else col2 if i % 3 == 1 else col3):
                    v_key = f"V{i}"
                    default_v = float(sample_record[v_key]) if sample_record else 0.0
                    v_inputs[v_key] = st.number_input(v_key, value=default_v, format="%.5f")
                    
            submitted = st.form_submit_button("🛡️ Predict Transaction Security")
            
            if submitted:
                # Compile raw features
                raw_features = {
                    'Time': time_val,
                    'Amount': amount_val,
                    **v_inputs
                }
                
                # Predict
                with st.spinner("Analyzing transaction patterns..."):
                    pred_class, prob_score, confidence = predictor.predict(raw_features)
                    
                st.write("---")
                st.subheader("🔍 Security Analysis Result")
                
                res_col1, res_col2 = st.columns(2)
                
                with res_col1:
                    if pred_class == 1:
                        st.markdown("<div class='badge-fraud'>❌ FRAUD DETECTED</div>", unsafe_allow_html=True)
                        st.markdown(f"<p style='margin-top: 15px;'>This transaction exhibits a high risk of fraudulent pattern match. Model flagged this transaction as potentially compromised.</p>", unsafe_allow_html=True)
                    else:
                        st.markdown("<div class='badge-genuine'>✔️ SECURE TRANSACTION</div>", unsafe_allow_html=True)
                        st.markdown(f"<p style='margin-top: 15px;'>This transaction is classified as genuine. The features closely align with regular cardholder behaviors.</p>", unsafe_allow_html=True)
                        
                with res_col2:
                    st.metric("Fraud Probability Score", f"{prob_score:.5f}")
                    st.metric("Confidence Level", f"{confidence:.2f}%")
                    
                # Feature contributions comparison
                st.write("### Feature Value Deviation (Relative to Scale)")
                # Calculate simple deviations for scaled Amount and Time
                # Show key V features which are highly active
                dev_df = pd.DataFrame([raw_features]).T.rename(columns={0: 'Your Value'})
                st.write("User input attributes are ready. You can inspect values in detail above.")

# ----------------- PAGE 6: ABOUT PROJECT -----------------
elif page == "About Project":
    st.title("ℹ️ About the Project")
    st.write("---")
    
    st.markdown("""
    ### Project Architecture & Pipeline
    This machine learning system adopts a highly modular pipeline structured around code readability, model accuracy, and explainability.
    
    """)
    
    # Diagram
    st.markdown("""
    ```mermaid
    graph TD
        A[Raw CSV Data] --> B[Data Preprocessor]
        B --> C[Stratified Train-Test Split]
        C --> D[StandardScaler fit/transform]
        D --> E[Resampling: SMOTE / RUS]
        E --> F[Benchmark Classifiers: LightGBM, CatBoost, XGBoost, etc.]
        F --> G[Select Best Model via F1-Score]
        G --> H[Hyperparameter Tuning]
        H --> I[Serialize best_model.pkl & scaler.pkl]
        I --> J[Streamlit Interactive Dashboard]
    ```
    """, unsafe_allow_html=True)
    
    st.markdown("""
    ### Technologies Used
    - **Language**: Python 3.11+
    - **Modeling**: `scikit-learn`, `imbalanced-learn`, `xgboost`, `lightgbm`, `catboost`
    - **Serialization**: `joblib`
    - **Visualization**: `plotly`, `seaborn`, `matplotlib`
    - **Interface**: `streamlit`
    
    ### Key Features
    1. **Data Leakage Safety**: Splitting dataset into train/test sets *before* performing any SMOTE over-sampling or under-sampling. Over-sampling before splitting causes target data to leak into validation folds, causing unrealistically high performance evaluation scores.
    2. **Stratified Splitting**: Preserving the class imbalance proportion in all train and test sets to guarantee realistic evaluation metrics.
    3. **Robust Metrics Focus**: Relying strictly on Recall, Precision, F1-Score, and Precision-Recall Area Under Curve (PR-AUC) rather than basic classification Accuracy.
    """)
