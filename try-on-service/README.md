# Virtual Try-On Service

AI-powered virtual clothing try-on service using OOTDiffusion.

## Quick Start

### Local Development (without Docker)

```bash
# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Copy environment file
copy .env.example .env

# Run the service
python main.py
```

### Docker (GPU)

```bash
# Build image
docker build -t tryon-service .

# Run with GPU support
docker run --gpus all -p 8084:8084 tryon-service
```

### Docker (CPU only)

```bash
docker build -f Dockerfile.cpu -t tryon-service-cpu .
docker run -p 8084:8084 tryon-service-cpu
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Service info |
| `/api/health` | GET | Health check |
| `/api/try-on` | POST | Virtual try-on |
| `/api/segment` | POST | Remove background |
| `/docs` | GET | Swagger UI |

## Usage Example

```python
import requests

# Virtual try-on
files = {
    'person_image': open('person.jpg', 'rb'),
    'garment_image': open('shirt.jpg', 'rb')
}
response = requests.post('http://localhost:8084/api/try-on', files=files)

# Save result
with open('result.png', 'wb') as f:
    f.write(response.content)
```

## Model Setup

For full OOTDiffusion support, download models:

```bash
# Create models directory
mkdir models

# Download from Hugging Face (requires git-lfs)
git lfs install
git clone https://huggingface.co/levihsu/OOTDiffusion models/ootdiffusion
```

## Hardware Requirements

- **GPU Mode**: NVIDIA GPU with 12GB+ VRAM (RTX 3060/4070 or higher)
- **CPU Mode**: 16GB RAM (processing will be slow ~60s per image)
