from flask import Flask, request, jsonify
from flask_cors import CORS
import easyocr
import os
import re
import time
from utils.image_processor import enhance_for_ocr

app = Flask(__name__)
CORS(app)  # Allow requests from your Node.js backend

# Initialize EasyOCR (will download models on first run ~100MB)
# ['en'] for English - more stable on Windows than PaddleOCR
print("Initializing EasyOCR...")
reader = easyocr.Reader(['en'], gpu=False)
print("EasyOCR initialized!")

# Upload folder
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def extract_numbers(text):
    """Extract all numbers from text using regex"""
    numbers = re.findall(r'\d+', text)
    return numbers

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'OCR Microservice',
        'version': '1.0.0'
    })

@app.route('/ocr/extract', methods=['POST'])
def extract_text():
    """
    Extract text and numbers from uploaded image

    Request: multipart/form-data with 'image' field
    Response: JSON with extracted numbers and raw text
    """
    start_time = time.time()

    if 'image' not in request.files:
        return jsonify({
            'success': False,
            'error': 'No image file provided'
        }), 400

    file = request.files['image']

    if file.filename == '':
        return jsonify({
            'success': False,
            'error': 'Empty filename'
        }), 400

    try:
        # Save uploaded file
        filename = f"{int(time.time())}_{file.filename}"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)

        # Try OCR on ORIGINAL image first
        # EasyOCR returns: [[bbox, text, confidence], ...]
        print(f"Running OCR on original image: {filepath}")
        result = reader.readtext(filepath, detail=1)
        print(f"OCR Result from original: {result}")

        # If nothing found, try preprocessing and OCR again
        if not result or len(result) == 0:
            print("Nothing found in original, trying preprocessed...")
            processed_path, processed_img = enhance_for_ocr(filepath)
            result = reader.readtext(processed_path, detail=1)
            print(f"OCR Result from preprocessed: {result}")

        # Try with different parameters - lower threshold
        if not result or len(result) == 0:
            print("Still nothing, trying with lower confidence threshold...")
            result = reader.readtext(filepath, detail=1, paragraph=False, min_size=5, text_threshold=0.5)
            print(f"OCR Result with lower threshold: {result}")

        # Extract text from OCR result
        all_text = []
        bounding_boxes = []

        for detection in result:
            bbox = detection[0]  # [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
            text = detection[1]
            confidence = detection[2]

            all_text.append(text)
            # Convert numpy arrays to Python lists for JSON serialization
            bbox_list = [[float(x), float(y)] for x, y in bbox]
            bounding_boxes.append({
                'text': text,
                'box': bbox_list,
                'confidence': float(confidence)
            })

        # Join all text
        raw_text = ' '.join(all_text)

        # Extract numbers
        numbers = extract_numbers(raw_text)

        # Calculate average confidence
        avg_confidence = sum(box['confidence'] for box in bounding_boxes) / len(bounding_boxes) if bounding_boxes else 0

        processing_time = int((time.time() - start_time) * 1000)  # milliseconds

        return jsonify({
            'success': True,
            'extracted': {
                'numbers': numbers,
                'raw_text': raw_text,
                'confidence': round(avg_confidence, 3),
                'bounding_boxes': bounding_boxes
            },
            'processing_time_ms': processing_time,
            'files': {
                'original': filepath,
                'processed': processed_path
            }
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print("OCR Microservice starting...")
    print("PaddleOCR initialized")
    print("Server running on http://localhost:5001")
    print("Ready to accept requests!")
    app.run(host='0.0.0.0', port=5001, debug=True)
