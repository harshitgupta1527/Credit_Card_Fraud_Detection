import os
import sys
import logging
import requests
import joblib
from typing import Any

def setup_logger(name: str = "fraud_detection", log_file: str = "project.log") -> logging.Logger:
    """
    Configures and returns a logger that outputs to both standard output and a file.
    
    Args:
        name (str): Name of the logger.
        log_file (str): Path to the log file.
        
    Returns:
        logging.Logger: Configured logger instance.
    """
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        
        # Console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)
        
        # File handler
        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
        
    return logger

# Create global logger
logger = setup_logger()

def download_dataset(url: str, dest_path: str) -> None:
    """
    Downloads the credit card dataset from a URL to the specified destination path.
    Displays progress logs.
    
    Args:
        url (str): The raw URL of the CSV dataset.
        dest_path (str): Filepath to save the downloaded CSV.
    """
    if os.path.exists(dest_path):
        logger.info(f"Dataset already exists at {dest_path}. Skipping download.")
        return
        
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    logger.info(f"Starting download from {url}...")
    
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        total_size = int(response.headers.get('content-length', 0))
        block_size = 4 * 1024 * 1024  # 4MB chunks
        downloaded = 0
        
        with open(dest_path, 'wb') as f:
            for data in response.iter_content(block_size):
                f.write(data)
                downloaded += len(data)
                if total_size > 0:
                    percent = (downloaded / total_size) * 100
                    logger.info(f"Downloaded {downloaded / (1024*1024):.1f} MB / {total_size / (1024*1024):.1f} MB ({percent:.1f}%)")
                else:
                    logger.info(f"Downloaded {downloaded / (1024*1024):.1f} MB")
                    
        logger.info(f"Dataset successfully downloaded to {dest_path}")
    except Exception as e:
        logger.error(f"Failed to download dataset: {e}")
        raise e

def save_artifact(obj: Any, path: str) -> None:
    """
    Saves a python object as a serialized joblib file.
    
    Args:
        obj (Any): Object to save.
        path (str): Destination filepath.
    """
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        joblib.dump(obj, path)
        logger.info(f"Artifact successfully saved to {path}")
    except Exception as e:
        logger.error(f"Error saving artifact to {path}: {e}")
        raise e

def load_artifact(path: str) -> Any:
    """
    Loads a serialized joblib file.
    
    Args:
        path (str): Filepath of the artifact.
        
    Returns:
        Any: The deserialized Python object.
    """
    try:
        if not os.path.exists(path):
            raise FileNotFoundError(f"Artifact not found at {path}")
        obj = joblib.load(path)
        logger.info(f"Artifact successfully loaded from {path}")
        return obj
    except Exception as e:
        logger.error(f"Error loading artifact from {path}: {e}")
        raise e
