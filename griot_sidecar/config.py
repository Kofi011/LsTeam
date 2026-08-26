"""
Griot Nano 1 Sidecar — Configuration
"""

import os

# Model configuration
MODEL_ID = "Qlerqly/griot-nano-1"
DEVICE = os.getenv("GRIOT_DEVICE", "cpu")  # "cpu" or "cuda"
HF_TOKEN = os.getenv("HF_TOKEN", None)

# Audio constraints
MAX_AUDIO_DURATION_SEC = 600  # 10 minutes
SUPPORTED_FORMATS = {".mp3", ".wav", ".m4a", ".flac", ".ogg", ".webm"}
TARGET_SAMPLE_RATE = 16000  # Whisper/CTC models expect 16kHz

# Server configuration
HOST = os.getenv("GRIOT_HOST", "0.0.0.0")
PORT = int(os.getenv("GRIOT_PORT", "8001"))

# Inference
INFERENCE_TIMEOUT_SEC = 120
