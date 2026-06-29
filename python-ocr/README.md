# 📸 OCR Microservice

Python microservice for extracting text/numbers from scoresheet images using PaddleOCR.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run Server
```bash
python app.py
```

Server starts on: `http://localhost:5001`

## 📡 API Endpoints

### Health Check
```
GET /health
```

Response:
```json
{
  "status": "healthy",
  "service": "OCR Microservice",
  "version": "1.0.0"
}
```

### Extract Text from Image
```
POST /ocr/extract
Content-Type: multipart/form-data

Body: { image: <file> }
```

Response:
```json
{
  "success": true,
  "extracted": {
    "numbers": ["21", "19", "18"],
    "raw_text": "Player 1: 21-19",
    "confidence": 0.95,
    "bounding_boxes": [...]
  },
  "processing_time_ms": 234
}
```

## 🧪 Test with cURL

```bash
curl -X POST http://localhost:5001/ocr/extract \
  -F "image=@test_image.jpg"
```

## 🔧 Tech Stack

- **Flask** - Web framework
- **PaddleOCR** - OCR engine
- **OpenCV** - Image preprocessing
- **Pillow** - Image handling

## 📁 Folder Structure

```
python-ocr/
├── app.py                 # Main Flask app
├── requirements.txt       # Python dependencies
├── utils/
│   └── image_processor.py # OpenCV preprocessing
└── uploads/               # Uploaded images (auto-created)
```

## 🎯 Preprocessing Pipeline

1. Grayscale conversion
2. Gaussian blur (denoise)
3. Adaptive threshold
4. Morphological operations
5. Feed to PaddleOCR

## 📝 Notes

- First run downloads PaddleOCR models (~100MB)
- Processed images saved with `_processed` suffix for debugging
- Supports English text detection (can be changed to other languages)
