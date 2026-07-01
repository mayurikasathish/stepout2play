# Handwriting OCR Recognition Fix

## Problem
The OCR was recognizing **typed text** but failing on **handwritten scores** because raw images were sent directly to the Sarvam API without preprocessing.

## Solution
Added image preprocessing pipeline using `sharp` library before OCR extraction:

### Preprocessing Steps Applied:
1. **Grayscale Conversion** - Removes color noise, focuses on text contrast
2. **Normalization** - Auto-adjusts brightness/contrast levels
3. **Sharpening** - Enhances edges of handwritten characters (sigma: 1.5)
4. **Contrast Boost** - Makes handwriting stand out more (linear adjustment)
5. **Upscaling** - If image is small (<1500px), upscales it (OCR works better on larger images)
6. **High-Quality JPEG** - Saves at 95% quality

### What Changed:
- **File**: `src/services/ocr.service.js`
- **Added**: `preprocessImage()` method
- **Modified**: `extractFromImage()` now preprocesses before uploading to Sarvam API
- **Installed**: `sharp` npm package for image processing

### Preprocessing Pipeline Visualization:
```
Original Image
    ↓
Grayscale (remove colors)
    ↓
Normalize (adjust brightness)
    ↓
Sharpen (enhance edges)
    ↓
Boost Contrast (make text darker)
    ↓
Upscale if needed (minimum 1500px)
    ↓
Save as high-quality JPEG
    ↓
Send to Sarvam OCR API
```

## Technical Details:

### Before:
```javascript
const fileBuffer = fs.readFileSync(imagePath);
// Upload raw image directly
```

### After:
```javascript
processedPath = await this.preprocessImage(imagePath);
const fileBuffer = fs.readFileSync(processedPath);
// Upload preprocessed image
```

### Preprocessing Parameters:
- **Sharpening**: `{ sigma: 1.5 }` - Moderate edge enhancement
- **Contrast**: Linear adjustment with factor 1.2
- **Upscale kernel**: `lanczos3` - High-quality resampling algorithm
- **Minimum size**: 1500px (smaller images are upscaled)
- **Output quality**: 95% JPEG

## How It Helps Handwriting:
1. **Grayscale** - Removes pen color variations (blue/black ink looks the same)
2. **Sharpening** - Makes blurry handwriting crisper
3. **Contrast** - Makes faint handwriting darker and more readable
4. **Upscaling** - Small/low-res photos become clearer for OCR
5. **Normalization** - Fixes poorly lit photos (shadows, glare)

## Usage:
No frontend changes needed - preprocessing happens automatically on the backend:

1. User uploads scorecard photo (handwritten or typed)
2. Backend preprocesses image automatically
3. Sarvam API extracts text from enhanced image
4. Parser extracts player IDs and scores
5. Preprocessed temp file is cleaned up

## Testing Recommendations:
1. Try handwritten scorecards with:
   - Different pen colors (blue, black)
   - Different lighting conditions
   - Low-resolution phone photos
   - Tilted/rotated images
2. Compare before/after by temporarily disabling preprocessing

## Fallback:
If preprocessing fails (rare), the original image is used as fallback - so it won't break existing typed-text functionality.

## Cleanup:
Preprocessed images are automatically deleted after OCR completes (both on success and error) to save disk space.
