import cv2
import numpy as np
from PIL import Image

def preprocess_image(image_path):
    """
    Preprocess image for better OCR accuracy
    Steps: Grayscale → Denoise → Threshold → Enhance
    """
    # Read image
    img = cv2.imread(image_path)

    if img is None:
        raise ValueError(f"Could not read image from {image_path}")

    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Apply Gaussian blur to reduce noise
    denoised = cv2.GaussianBlur(gray, (5, 5), 0)

    # Apply adaptive thresholding to get binary image (black text on white background)
    # This handles different lighting conditions better
    binary = cv2.adaptiveThreshold(
        denoised,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        11,
        2
    )

    # Optional: Morphological operations to close gaps in numbers
    kernel = np.ones((2, 2), np.uint8)
    processed = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)

    return processed

def save_processed_image(processed_img, output_path):
    """Save preprocessed image for debugging"""
    cv2.imwrite(output_path, processed_img)
    return output_path

def enhance_for_ocr(image_path):
    """
    Full pipeline: preprocess and save
    Returns path to processed image
    """
    processed = preprocess_image(image_path)
    output_path = image_path.replace('.', '_processed.')
    save_processed_image(processed, output_path)
    return output_path, processed
