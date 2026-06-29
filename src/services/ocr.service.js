const FormData = require('form-data');
const axios = require('axios');
const fs = require('fs');

const PYTHON_OCR_URL = process.env.PYTHON_OCR_URL || 'http://localhost:5001';

class OCRService {
  /**
   * Extract text/numbers from scoresheet image
   * @param {string} imagePath - Path to image file
   * @returns {Promise<Object>} OCR result
   */
  async extractFromImage(imagePath) {
    try {
      // Create form data
      const form = new FormData();
      form.append('image', fs.createReadStream(imagePath));

      // Send to Python OCR service
      const response = await axios.post(`${PYTHON_OCR_URL}/ocr/extract`, form, {
        headers: {
          ...form.getHeaders()
        },
        timeout: 30000 // 30 second timeout
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('OCR Service Error:', error.message);

      if (error.code === 'ECONNREFUSED') {
        return {
          success: false,
          error: 'OCR service not running. Please start Python server on port 5001.'
        };
      }

      return {
        success: false,
        error: error.response?.data?.error || 'OCR extraction failed'
      };
    }
  }

  /**
   * Check if Python OCR service is healthy
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${PYTHON_OCR_URL}/health`, {
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      return {
        status: 'unhealthy',
        error: 'Python OCR service not reachable'
      };
    }
  }
}

module.exports = new OCRService();
