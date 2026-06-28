import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score, confusion_matrix, classification_report
)
import plotly.graph_objects as go
import plotly.express as px
import plotly.figure_factory as ff
from typing import Dict, Any, List

def calculate_metrics(y_true: np.ndarray, y_pred: np.ndarray, y_prob: np.ndarray = None) -> Dict[str, Any]:
    """
    Calculates key classification metrics for evaluating model performance.
    
    Args:
        y_true (np.ndarray): True labels.
        y_pred (np.ndarray): Predicted class labels.
        y_prob (np.ndarray, optional): Predicted probabilities for the positive class.
        
    Returns:
        Dict[str, Any]: Dictionary of evaluation metrics.
    """
    metrics = {
        "Accuracy": float(accuracy_score(y_true, y_pred)),
        "Precision": float(precision_score(y_true, y_pred, zero_division=0)),
        "Recall": float(recall_score(y_true, y_pred, zero_division=0)),
        "F1-Score": float(f1_score(y_true, y_pred, zero_division=0)),
    }
    
    if y_prob is not None:
        metrics["ROC-AUC"] = float(roc_auc_score(y_true, y_prob))
        metrics["PR-AUC"] = float(average_precision_score(y_true, y_prob))
        
    return metrics

def plot_confusion_matrix(y_true: np.ndarray, y_pred: np.ndarray) -> go.Figure:
    """
    Generates an interactive Plotly heatmap for the confusion matrix.
    
    Args:
        y_true (np.ndarray): True labels.
        y_pred (np.ndarray): Predicted class labels.
        
    Returns:
        go.Figure: Plotly Figure instance.
    """
    cm = confusion_matrix(y_true, y_pred)
    x_labels = ['Predicted Genuine', 'Predicted Fraud']
    y_labels = ['Actual Genuine', 'Actual Fraud']
    
    z_text = [[str(val) for val in row] for row in cm]
    
    # We construct the annotated heatmap
    fig = ff.create_annotated_heatmap(
        z=cm, 
        x=x_labels, 
        y=y_labels, 
        annotation_text=z_text, 
        colorscale='blues', 
        showscale=True
    )
    
    fig.update_layout(
        title={
            'text': "Confusion Matrix",
            'y':0.95,
            'x':0.5,
            'xanchor': 'center',
            'yanchor': 'top'
        },
        xaxis_title="Predicted Label",
        yaxis_title="Actual Label",
        width=500,
        height=450,
        margin=dict(t=100, b=50, l=50, r=50),
        template="plotly_dark"
    )
    return fig

def plot_roc_curve(y_true: np.ndarray, y_prob: np.ndarray) -> go.Figure:
    """
    Generates an interactive Plotly ROC curve.
    
    Args:
        y_true (np.ndarray): True labels.
        y_prob (np.ndarray): Predicted probabilities.
        
    Returns:
        go.Figure: Plotly Figure.
    """
    from sklearn.metrics import roc_curve
    fpr, tpr, _ = roc_curve(y_true, y_prob)
    auc_score = roc_auc_score(y_true, y_prob)
    
    fig = go.Figure()
    
    # Reference diagonal line
    fig.add_trace(go.Scatter(
        x=[0, 1], y=[0, 1], 
        mode='lines', 
        line=dict(dash='dash', color='gray'), 
        name='Random Guess (AUC = 0.50)'
    ))
    
    # ROC curve
    fig.add_trace(go.Scatter(
        x=fpr, y=tpr, 
        mode='lines', 
        line=dict(color='#29B6F6', width=3), 
        name=f'ROC Curve (AUC = {auc_score:.4f})'
    ))
    
    fig.update_layout(
        title={
            'text': "Receiver Operating Characteristic (ROC) Curve",
            'y':0.95,
            'x':0.5,
            'xanchor': 'center',
            'yanchor': 'top'
        },
        xaxis_title="False Positive Rate (FPR)",
        yaxis_title="True Positive Rate (TPR)",
        xaxis=dict(range=[0.0, 1.05], gridcolor='rgba(255,255,255,0.1)'),
        yaxis=dict(range=[0.0, 1.05], gridcolor='rgba(255,255,255,0.1)'),
        legend=dict(x=0.5, y=0.1, xanchor='left', yanchor='bottom'),
        width=550,
        height=450,
        template="plotly_dark"
    )
    return fig

def plot_pr_curve(y_true: np.ndarray, y_prob: np.ndarray) -> go.Figure:
    """
    Generates an interactive Plotly Precision-Recall curve.
    
    Args:
        y_true (np.ndarray): True labels.
        y_prob (np.ndarray): Predicted probabilities.
        
    Returns:
        go.Figure: Plotly Figure.
    """
    from sklearn.metrics import precision_recall_curve
    precision, recall, _ = precision_recall_curve(y_true, y_prob)
    pr_auc = average_precision_score(y_true, y_prob)
    
    fig = go.Figure()
    
    # Baseline
    baseline = np.sum(y_true) / len(y_true)
    fig.add_trace(go.Scatter(
        x=[0, 1], y=[baseline, baseline], 
        mode='lines', 
        line=dict(dash='dash', color='gray'), 
        name=f'Baseline (AP = {baseline:.4f})'
    ))
    
    # PR Curve
    fig.add_trace(go.Scatter(
        x=recall, y=precision, 
        mode='lines', 
        line=dict(color='#26A69A', width=3), 
        name=f'PR Curve (AP = {pr_auc:.4f})'
    ))
    
    fig.update_layout(
        title={
            'text': "Precision-Recall Curve",
            'y':0.95,
            'x':0.5,
            'xanchor': 'center',
            'yanchor': 'top'
        },
        xaxis_title="Recall",
        yaxis_title="Precision",
        xaxis=dict(range=[0.0, 1.05], gridcolor='rgba(255,255,255,0.1)'),
        yaxis=dict(range=[0.0, 1.05], gridcolor='rgba(255,255,255,0.1)'),
        legend=dict(x=0.1, y=0.1, xanchor='left', yanchor='bottom'),
        width=550,
        height=450,
        template="plotly_dark"
    )
    return fig

def plot_feature_importance(importances: np.ndarray, feature_names: List[str], top_n: int = 15) -> go.Figure:
    """
    Generates a horizontal bar chart of feature importances.
    
    Args:
        importances (np.ndarray): Feature importance array.
        feature_names (List[str]): List of corresponding feature names.
        top_n (int): Number of top features to show.
        
    Returns:
        go.Figure: Plotly Figure.
    """
    indices = np.argsort(importances)[::-1][:top_n]
    sorted_importances = importances[indices]
    sorted_features = [feature_names[i] for i in indices]
    
    fig = px.bar(
        x=sorted_importances[::-1],
        y=sorted_features[::-1],
        orientation='h',
        labels={'x': 'Importance Value', 'y': 'Feature'},
        title=f"Top {top_n} Feature Importances",
        color=sorted_importances[::-1],
        color_continuous_scale='tealgrn'
    )
    
    fig.update_layout(
        height=450,
        width=600,
        template="plotly_dark"
    )
    return fig

def plot_class_distribution(y: pd.Series) -> go.Figure:
    """
    Plots class distribution (Genuine vs Fraud).
    
    Args:
        y (pd.Series): Target labels.
        
    Returns:
        go.Figure: Plotly Figure.
    """
    counts = y.value_counts()
    percentages = y.value_counts(normalize=True) * 100
    
    df_dist = pd.DataFrame({
        'Class': ['Genuine (0)', 'Fraud (1)'],
        'Count': counts.values,
        'Percentage': percentages.values
    })
    
    fig = px.bar(
        df_dist, x='Class', y='Count',
        text=df_dist.apply(lambda row: f"{int(row['Count']):,} ({row['Percentage']:.3f}%)", axis=1),
        color='Class',
        color_discrete_map={'Genuine (0)': '#66BB6A', 'Fraud (1)': '#EF5350'},
        title="Class Distribution (Log Scale)"
    )
    
    fig.update_layout(
        yaxis_title="Transaction Count (Log Scale)",
        yaxis_type="log",
        width=500,
        height=400,
        template="plotly_dark",
        showlegend=False
    )
    return fig

def plot_amount_distribution(df: pd.DataFrame) -> go.Figure:
    """
    Plots the boxplot distribution of transaction amount for Genuine vs Fraud.
    
    Args:
        df (pd.DataFrame): Dataframe containing 'Class' and 'Amount'.
        
    Returns:
        go.Figure: Plotly Figure.
    """
    df_copy = df.copy()
    df_copy['Class_Label'] = df_copy['Class'].map({0: 'Genuine', 1: 'Fraud'})
    
    fig = px.box(
        df_copy, x='Class_Label', y='Amount',
        color='Class_Label',
        color_discrete_map={'Genuine': '#66BB6A', 'Fraud': '#EF5350'},
        title="Transaction Amounts (Log Scale)",
        points="outliers",
        labels={'Class_Label': 'Transaction Class', 'Amount': 'Amount ($)'}
    )
    
    fig.update_layout(
        yaxis_type="log",
        width=500,
        height=400,
        template="plotly_dark",
        showlegend=False
    )
    return fig

def plot_correlation_heatmap(df: pd.DataFrame, top_features: List[str] = None) -> go.Figure:
    """
    Plots the correlation heatmap for features and Class target.
    
    Args:
        df (pd.DataFrame): Dataframe.
        top_features (List[str], optional): Custom list of features to correlate.
        
    Returns:
        go.Figure: Plotly Figure.
    """
    if top_features is not None:
        cols_to_corr = list(top_features)
        if 'Class' not in cols_to_corr:
            cols_to_corr.append('Class')
    else:
        # Show Time, Amount, Class, and V1-V10
        cols_to_corr = ['Time', 'Amount', 'Class'] + [f'V{i}' for i in range(1, 11)]
        
    # Keep only columns that exist, avoiding any duplicates while preserving order
    seen = set()
    cols_to_corr = [c for c in cols_to_corr if c in df.columns and not (c in seen or seen.add(c))]
    
    corr_df = df[cols_to_corr].corr()
    
    fig = px.imshow(
        corr_df.values,
        x=cols_to_corr,
        y=cols_to_corr,
        text_auto=".2f",
        aspect="auto",
        color_continuous_scale='RdBu_r',
        title="Correlation Heatmap"
    )
    fig.update_layout(
        width=650,
        height=550,
        template="plotly_dark"
    )
    return fig
