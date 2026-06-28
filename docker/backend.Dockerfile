FROM python:3.11-slim

WORKDIR /app

# Install compilation tools needed for C-extensions like CatBoost/Scikit-Learn
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code and pre-trained assets
COPY backend/ /app/

EXPOSE 8000

# Execute server
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
