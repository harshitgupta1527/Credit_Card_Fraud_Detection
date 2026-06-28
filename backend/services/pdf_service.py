import io
import csv
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from typing import List, Dict, Any

def generate_prediction_pdf(pred_data: Dict[str, Any], user_email: str) -> BytesIO:
    """
    Generates a security evaluation PDF report for a single prediction.
    
    Args:
        pred_data (Dict[str, Any]): Prediction details.
        user_email (str): The email of the user executing the check.
        
    Returns:
        BytesIO: A binary buffer containing the PDF file.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=letter, 
        rightMargin=54, 
        leftMargin=54, 
        topMargin=54, 
        bottomMargin=54
    )
    story = []
    
    styles = getSampleStyleSheet()
    
    # Custom styles mapping
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=22,
        textColor=colors.HexColor('#0F172A'),  # slate-900
        spaceAfter=15
    )
    
    h2_style = ParagraphStyle(
        'SubTitle',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        textColor=colors.HexColor('#475569'),  # slate-600
        spaceAfter=10
    )
    
    body_style = styles['Normal']
    
    # Document Header Section
    story.append(Paragraph("Fraud Guard Security Evaluation", title_style))
    story.append(
        Paragraph(
            f"Generated for User: {user_email} | Reference Timestamp: {pred_data.get('created_at', '')}", 
            body_style
        )
    )
    story.append(Spacer(1, 15))
    
    # Evaluation Metrics Section
    story.append(Paragraph("Classification Decision Output", h2_style))
    
    status = pred_data.get('prediction_label', 'Genuine')
    status_color = '#EF5350' if status == 'Fraud' else '#66BB6A'
    
    status_style = ParagraphStyle(
        'StatusStyle',
        parent=styles['Normal'],
        fontSize=12,
        textColor=colors.HexColor(status_color),
        fontName='Helvetica-Bold'
    )
    
    details_data = [
        [Paragraph("<b>Status Verdict:</b>", body_style), Paragraph(f"<b>{status}</b>", status_style)],
        [Paragraph("<b>Fraud Probability:</b>", body_style), Paragraph(f"{pred_data.get('probability', 0.0):.5f}", body_style)],
        [Paragraph("<b>Model Confidence:</b>", body_style), Paragraph(f"{pred_data.get('confidence', 'N/A')}", body_style)],
        [Paragraph("<b>Assigned Risk Level:</b>", body_style), Paragraph(f"{pred_data.get('risk_level', 'N/A')}", body_style)],
        [Paragraph("<b>AI Security Suggestion:</b>", body_style), Paragraph(f"{pred_data.get('recommendation', 'N/A')}", body_style)],
        [Paragraph("<b>Latency Overhead:</b>", body_style), Paragraph(f"{pred_data.get('response_time_ms', 0.0):.1f} ms", body_style)]
    ]
    
    t_details = Table(details_data, colWidths=[150, 300])
    t_details.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('PADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
    ]))
    story.append(t_details)
    story.append(Spacer(1, 20))
    
    # Raw features sample listing
    story.append(Paragraph("Transaction Features Summary", h2_style))
    features = pred_data.get('features', {})
    
    features_table_data = [
        [Paragraph("<b>Feature Column</b>", body_style), Paragraph("<b>Normalized/Raw Value</b>", body_style)]
    ]
    
    # Select important components to fit on one page
    keys_to_show = ['Time', 'Amount', 'V1', 'V2', 'V3', 'V4', 'V11', 'V14', 'V17', 'V20']
    for k in keys_to_show:
        if k in features:
            val = features[k]
            val_str = f"{val:.5f}" if isinstance(val, float) else str(val)
            features_table_data.append([
                Paragraph(k, body_style),
                Paragraph(val_str, body_style)
            ])
            
    t_features = Table(features_table_data, colWidths=[150, 300])
    t_features.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F1F5F9')),
        ('PADDING', (0,0), (-1,-1), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
    ]))
    story.append(t_features)
    
    doc.build(story)
    buffer.seek(0)
    return buffer

def generate_predictions_csv(predictions: List[Dict[str, Any]]) -> str:
    """
    Compiles a prediction history log list into CSV format.
    """
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "ID", "Created At", "Transaction Time", "Transaction Amount", 
        "Label Decision", "Probability", "Confidence", "Risk Score", 
        "Recommendation", "Response Time (ms)"
    ])
    
    for p in predictions:
        writer.writerow([
            p.get("id"),
            p.get("created_at"),
            p.get("transaction_time"),
            p.get("transaction_amount"),
            p.get("prediction_label"),
            p.get("probability"),
            p.get("confidence"),
            p.get("risk_level"),
            p.get("recommendation"),
            p.get("response_time_ms")
        ])
        
    return output.getvalue()
