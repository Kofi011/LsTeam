"""
Griot Nano 1 Sidecar — FastAPI Application

Wraps the Qlerqly/griot-nano-1 ConformerCTC model as a REST API for
African-accented and multilingual English speech transcription.

Endpoints:
    GET  /health      → service + model status
    POST /transcribe  → accept audio file, return transcript
"""

import os
import io
import time
import logging
import tempfile
import traceback
from pathlib import Path
from contextlib import asynccontextmanager

import torch
import torchaudio
import soundfile as sf
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse

from config import (
    MODEL_ID,
    DEVICE,
    HF_TOKEN,
    MAX_AUDIO_DURATION_SEC,
    SUPPORTED_FORMATS,
    TARGET_SAMPLE_RATE,
    HOST,
    PORT,
    INFERENCE_TIMEOUT_SEC,
)

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("griot-sidecar")

# ---------------------------------------------------------------------------
# Global model state
# ---------------------------------------------------------------------------
model_state = {
    "processor": None,
    "model": None,
    "loaded": False,
    "error": None,
}


def load_model():
    """Load the Griot Nano 1 ConformerCTC model and processor."""
    try:
        from transformers import AutoProcessor, AutoModelForCTC

        logger.info(f"Loading model {MODEL_ID} on device={DEVICE} ...")
        token = HF_TOKEN if HF_TOKEN else None

        processor = AutoProcessor.from_pretrained(MODEL_ID, token=token)
        model = AutoModelForCTC.from_pretrained(MODEL_ID, token=token)
        model = model.to(DEVICE)
        model.eval()

        model_state["processor"] = processor
        model_state["model"] = model
        model_state["loaded"] = True
        model_state["error"] = None
        logger.info("Model loaded successfully.")
    except Exception as exc:
        model_state["loaded"] = False
        model_state["error"] = str(exc)
        logger.error(f"Failed to load model: {exc}")
        logger.debug(traceback.format_exc())


# ---------------------------------------------------------------------------
# Lifespan — load model on startup
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    load_model()
    yield
    # Cleanup
    model_state["processor"] = None
    model_state["model"] = None
    model_state["loaded"] = False
    logger.info("Sidecar shutting down, model unloaded.")


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Griot Nano 1 Sidecar",
    description="Speech-to-text service for African-accented and multilingual English",
    version="1.0.0",
    lifespan=lifespan,
)


# ---------------------------------------------------------------------------
# Audio preprocessing
# ---------------------------------------------------------------------------
def preprocess_audio(file_bytes: bytes, filename: str) -> torch.Tensor:
    """
    Read audio bytes, convert to mono 16 kHz waveform tensor.
    Returns the waveform tensor.
    Raises HTTPException on validation failure.
    """
    ext = Path(filename).suffix.lower()
    if ext not in SUPPORTED_FORMATS:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "UNSUPPORTED_FORMAT",
                "message": f"Format '{ext}' is not supported. Accepted: {', '.join(sorted(SUPPORTED_FORMATS))}",
            },
        )

    # Write to temp file so torchaudio can read it
    tmp = None
    try:
        tmp = tempfile.NamedTemporaryFile(suffix=ext, delete=False)
        tmp.write(file_bytes)
        tmp.close()

        waveform, sample_rate = torchaudio.load(tmp.name)
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "AUDIO_READ_ERROR",
                "message": f"Could not read audio file: {str(exc)}",
            },
        )
    finally:
        if tmp and os.path.exists(tmp.name):
            os.unlink(tmp.name)

    # Convert to mono
    if waveform.shape[0] > 1:
        waveform = waveform.mean(dim=0, keepdim=True)

    # Resample to target rate
    if sample_rate != TARGET_SAMPLE_RATE:
        resampler = torchaudio.transforms.Resample(
            orig_freq=sample_rate, new_freq=TARGET_SAMPLE_RATE
        )
        waveform = resampler(waveform)

    # Duration check
    duration_sec = waveform.shape[1] / TARGET_SAMPLE_RATE
    if duration_sec > MAX_AUDIO_DURATION_SEC:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "AUDIO_TOO_LONG",
                "message": f"Audio is {duration_sec:.0f}s, max allowed is {MAX_AUDIO_DURATION_SEC}s.",
            },
        )

    return waveform.squeeze(0)  # (samples,)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/health")
async def health():
    """Service and model health check."""
    return {
        "status": "ok" if model_state["loaded"] else "degraded",
        "model": MODEL_ID,
        "model_loaded": model_state["loaded"],
        "model_error": model_state["error"],
        "device": DEVICE,
    }


@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    """
    Accept an audio file and return a transcript.

    Returns:
        {
            "transcript": "...",
            "language": "auto",
            "engine": "griot-nano-1",
            "duration_sec": 123.4,
            "inference_time_sec": 1.23
        }
    """
    # Check model is loaded
    if not model_state["loaded"]:
        raise HTTPException(
            status_code=503,
            detail={
                "error": "MODEL_NOT_LOADED",
                "message": f"Model is not available. Error: {model_state['error']}",
            },
        )

    # Read file bytes
    try:
        file_bytes = await file.read()
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "FILE_READ_ERROR",
                "message": f"Could not read uploaded file: {str(exc)}",
            },
        )

    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "EMPTY_FILE",
                "message": "Uploaded file is empty.",
            },
        )

    # Preprocess audio
    filename = file.filename or "audio.wav"
    waveform = preprocess_audio(file_bytes, filename)
    duration_sec = len(waveform) / TARGET_SAMPLE_RATE

    # Run inference
    processor = model_state["processor"]
    model = model_state["model"]

    try:
        start_time = time.time()

        input_values = processor(
            waveform.numpy(),
            sampling_rate=TARGET_SAMPLE_RATE,
            return_tensors="pt",
            padding=True,
        ).input_values.to(DEVICE)

        with torch.no_grad():
            logits = model(input_values).logits

        predicted_ids = torch.argmax(logits, dim=-1)
        transcript = processor.batch_decode(predicted_ids)[0]

        inference_time = time.time() - start_time
        logger.info(
            f"Transcribed {duration_sec:.1f}s audio in {inference_time:.2f}s "
            f"({duration_sec / inference_time:.1f}x realtime)"
        )

    except Exception as exc:
        logger.error(f"Inference failed: {exc}")
        logger.debug(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail={
                "error": "INFERENCE_ERROR",
                "message": f"Transcription failed: {str(exc)}",
            },
        )

    return {
        "transcript": transcript.strip(),
        "language": "auto",
        "engine": "griot-nano-1",
        "duration_sec": round(duration_sec, 2),
        "inference_time_sec": round(inference_time, 2),
    }


# ---------------------------------------------------------------------------
# Error handlers
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled error: {exc}")
    logger.debug(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={
            "error": "INTERNAL_ERROR",
            "message": "An unexpected error occurred.",
        },
    )


# ---------------------------------------------------------------------------
# Run with: uvicorn main:app --host 0.0.0.0 --port 8001
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=HOST, port=PORT)
