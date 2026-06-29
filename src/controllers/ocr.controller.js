const ocrService = require('../services/ocr.service');
const path = require('path');
const fs = require('fs');

class OCRController {
  /**
   * POST /ocr/extract-score
   * Upload scorecard image and extract numbers
   */
  async extractScore(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No image file provided'
        });
      }

      // req.file.path is the uploaded file path (from multer)
      const imagePath = req.file.path;

      // Call Python OCR service
      const ocrResult = await ocrService.extractFromImage(imagePath);

      if (!ocrResult.success) {
        // Clean up uploaded file
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }

        return res.status(500).json({
          success: false,
          error: ocrResult.error
        });
      }

      // Return OCR results
      // Keep the uploaded file for debugging (can delete later)
      res.status(200).json({
        success: true,
        extracted: ocrResult.data.extracted,
        processing_time_ms: ocrResult.data.processing_time_ms,
        upload_path: imagePath
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /ocr/health
   * Check if OCR service is running
   */
  async healthCheck(req, res, next) {
    try {
      const health = await ocrService.healthCheck();
      res.status(200).json(health);
    } catch (error) {
      next(error);
    }
  }
}

const controller = new OCRController();

module.exports = {
  extractScore: controller.extractScore.bind(controller),
  healthCheck: controller.healthCheck.bind(controller)
};
