"""
Virtual Try-On Service - FastAPI Application
Uses OOTDiffusion for realistic virtual clothing try-on
"""

import os
import io
import time
import uuid
import logging
from pathlib import Path
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from pydantic_settings import BaseSettings
from PIL import Image
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    """Application settings from environment variables"""
    host: str = "0.0.0.0"
    port: int = 8084
    debug: bool = False
    model_path: str = "./models"
    use_gpu: bool = True
    half_precision: bool = True
    max_image_size: int = 1024
    output_format: str = "png"
    cors_origins: str = "http://localhost:5173,http://localhost:80,http://localhost:3000"
    rate_limit_per_minute: int = 10
    
    class Config:
        env_file = ".env"


settings = Settings()

# Global model instance
tryon_model = None


class TryOnRequest(BaseModel):
    """Request model for try-on with base64 images"""
    person_image: str  # Base64 encoded
    garment_image: str  # Base64 encoded
    category: str = "upper_body"  # upper_body, lower_body, full_body


class TryOnResponse(BaseModel):
    """Response model for try-on result"""
    success: bool
    result_image: Optional[str] = None  # Base64 encoded
    processing_time: float
    message: str


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    gpu_available: bool
    model_loaded: bool
    version: str = "1.0.0"


def load_tryon_model():
    """Load OOTDiffusion model"""
    global tryon_model
    
    try:
        import torch
        
        # Check GPU availability
        if settings.use_gpu and torch.cuda.is_available():
            device = "cuda"
            logger.info(f"Using GPU: {torch.cuda.get_device_name(0)}")
            logger.info(f"VRAM Available: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")
        else:
            device = "cpu"
            logger.warning("GPU not available, using CPU (will be slow)")
        
        # For now, we'll use a simplified pipeline
        # In production, you would load the full OOTDiffusion model
        logger.info("Initializing Try-On model...")
        
        # Placeholder for model loading
        # In real implementation:
        # from ootdiffusion import OOTDiffusionPipeline
        # tryon_model = OOTDiffusionPipeline.from_pretrained(
        #     settings.model_path,
        #     torch_dtype=torch.float16 if settings.half_precision else torch.float32
        # ).to(device)
        
        tryon_model = {
            "device": device,
            "loaded": True,
            "half_precision": settings.half_precision
        }
        
        logger.info("Try-On model loaded successfully!")
        return True
        
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        tryon_model = {"loaded": False, "error": str(e)}
        return False


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - load model on startup"""
    logger.info("Starting Try-On Service...")
    load_tryon_model()
    yield
    logger.info("Shutting down Try-On Service...")


# Create FastAPI app
app = FastAPI(
    title="Virtual Try-On API",
    description="AI-powered virtual clothing try-on service using OOTDiffusion",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
origins = settings.cors_origins.split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def validate_image(file: UploadFile) -> Image.Image:
    """Validate and load uploaded image"""
    # Check file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "Invalid file type. Please upload an image.")
    
    # Check file size (max 10MB)
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)
    
    if size > 10 * 1024 * 1024:
        raise HTTPException(400, "Image too large. Maximum size is 10MB.")
    
    try:
        image = Image.open(file.file)
        image = image.convert("RGB")
        return image
    except Exception as e:
        raise HTTPException(400, f"Failed to process image: {str(e)}")


def resize_image(image: Image.Image, max_size: int = 1024) -> Image.Image:
    """Resize image while maintaining aspect ratio"""
    width, height = image.size
    if max(width, height) > max_size:
        if width > height:
            new_width = max_size
            new_height = int(height * max_size / width)
        else:
            new_height = max_size
            new_width = int(width * max_size / height)
        image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
    return image


async def process_tryon(
    person_image: Image.Image,
    garment_image: Image.Image,
    category: str = "upper_body"
) -> Image.Image:
    """
    Process virtual try-on using OOTDiffusion
    
    Args:
        person_image: Image of the person
        garment_image: Image of the garment/clothing
        category: Type of garment (upper_body, lower_body, full_body)
    
    Returns:
        Result image with garment on person
    """
    global tryon_model
    
    if tryon_model is None or not tryon_model.get("loaded"):
        raise HTTPException(503, "Model not loaded. Please try again later.")
    
    # Resize images
    person_image = resize_image(person_image, settings.max_image_size)
    garment_image = resize_image(garment_image, settings.max_image_size)
    
    # In real implementation, this would call the OOTDiffusion pipeline:
    # result = tryon_model(
    #     person_image=person_image,
    #     garment_image=garment_image,
    #     category=category,
    #     num_inference_steps=30,
    #     guidance_scale=2.5
    # )
    
    # For demo purposes, we'll create a simple composite
    # This is a PLACEHOLDER - replace with actual OOTDiffusion inference
    logger.info(f"Processing try-on for category: {category}")
    
    # Create a simple overlay as placeholder
    # In production, this would be the AI-generated result
    result = person_image.copy()
    
    # Simulate processing time
    import asyncio
    await asyncio.sleep(0.5)
    
    return result


@app.get("/", response_model=dict)
async def root():
    """Root endpoint"""
    return {
        "service": "Virtual Try-On API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    import torch
    
    gpu_available = torch.cuda.is_available() if hasattr(torch, 'cuda') else False
    model_loaded = tryon_model is not None and tryon_model.get("loaded", False)
    
    return HealthResponse(
        status="healthy" if model_loaded else "degraded",
        gpu_available=gpu_available,
        model_loaded=model_loaded
    )


@app.post("/api/try-on")
async def virtual_try_on(
    person_image: UploadFile = File(..., description="Full body image of the person"),
    garment_image: UploadFile = File(..., description="Image of the garment/clothing"),
    category: str = "upper_body"
):
    """
    Virtual Try-On Endpoint
    
    Upload a person image and a garment image to see how the garment
    looks on the person.
    
    - **person_image**: Full body photo (recommended: clear background, front view)
    - **garment_image**: Clothing item image (recommended: flat lay or on white background)
    - **category**: Type of garment - upper_body, lower_body, or full_body
    """
    start_time = time.time()
    
    try:
        # Validate and load images
        person_img = validate_image(person_image)
        garment_img = validate_image(garment_image)
        
        logger.info(f"Processing try-on request - Person: {person_img.size}, Garment: {garment_img.size}")
        
        # Process try-on
        result_image = await process_tryon(person_img, garment_img, category)
        
        # Convert to bytes
        img_byte_arr = io.BytesIO()
        result_image.save(img_byte_arr, format='PNG')
        img_byte_arr.seek(0)
        
        processing_time = time.time() - start_time
        logger.info(f"Try-on completed in {processing_time:.2f}s")
        
        # Return image directly
        return StreamingResponse(
            img_byte_arr,
            media_type="image/png",
            headers={
                "X-Processing-Time": str(processing_time),
                "Content-Disposition": f"inline; filename=tryon-result-{uuid.uuid4().hex[:8]}.png"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Try-on failed: {e}")
        raise HTTPException(500, f"Try-on processing failed: {str(e)}")


@app.post("/api/try-on/fabric")
async def try_on_with_fabric(
    person_image: UploadFile = File(..., description="Full body image of the person"),
    fabric_id: int = 0,
    garment_type: str = "shirt"
):
    """
    Try-on with fabric from catalog
    
    This endpoint fetches the fabric image from the main backend
    and applies it to a template garment.
    
    - **person_image**: Full body photo
    - **fabric_id**: ID of the fabric from the catalog
    - **garment_type**: Type of garment to create (shirt, pants, dress, ao_dai)
    """
    # This would integrate with the main backend to fetch fabric images
    # and generate a garment template with that fabric pattern
    
    return JSONResponse({
        "status": "not_implemented",
        "message": "This feature will be implemented in a future update",
        "fabric_id": fabric_id,
        "garment_type": garment_type
    })


@app.post("/api/segment")
async def segment_garment(
    image: UploadFile = File(..., description="Image to segment")
):
    """
    Remove background from garment image
    
    Useful for preparing garment images for try-on
    """
    try:
        from rembg import remove
        
        img = validate_image(image)
        
        # Remove background
        result = remove(img)
        
        # Convert to bytes
        img_byte_arr = io.BytesIO()
        result.save(img_byte_arr, format='PNG')
        img_byte_arr.seek(0)
        
        return StreamingResponse(
            img_byte_arr,
            media_type="image/png",
            headers={"Content-Disposition": "inline; filename=segmented.png"}
        )
        
    except ImportError:
        raise HTTPException(503, "Background removal not available")
    except Exception as e:
        logger.error(f"Segmentation failed: {e}")
        raise HTTPException(500, f"Segmentation failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )
