const FormData = require('form-data');
const axios = require('axios');
const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

const SARVAM_API_KEY = process.env.SARVAM_API_KEY;
const SARVAM_BASE_URL = 'https://api.sarvam.ai';

class OCRService {
  /**
   * Preprocess image to enhance OCR accuracy for handwritten text
   * @param {string} imagePath - Original image path
   * @returns {Promise<string>} - Path to preprocessed image
   */
  async preprocessImage(imagePath) {
    try {
      console.log('🔧 Preprocessing image for better OCR...');

      // Change extension to match original format
      const ext = path.extname(imagePath).toLowerCase();
      const processedPath = imagePath.replace(/\.\w+$/, '-processed' + ext);

      // Load image metadata to determine orientation and size
      const metadata = await sharp(imagePath).metadata();
      console.log(`📏 Original image: ${metadata.width}x${metadata.height}, format: ${metadata.format}`);

      // LIGHTER preprocessing for handwriting:
      // Only normalize and slightly sharpen - don't over-process
      let pipeline = sharp(imagePath)
        .normalise() // Auto-level brightness/contrast
        .sharpen({ sigma: 0.8, m1: 0.5, m2: 0.5 }); // Gentle sharpening

      // Only upscale if image is very small (< 1000px)
      if (metadata.width < 1000 || metadata.height < 1000) {
        const scale = Math.max(1000 / metadata.width, 1000 / metadata.height);
        console.log(`🔍 Upscaling by ${scale.toFixed(2)}x for better OCR`);
        pipeline = pipeline.resize({
          width: Math.round(metadata.width * scale),
          height: Math.round(metadata.height * scale),
          fit: 'inside',
          kernel: 'lanczos3'
        });
      }

      // Save in original format with high quality
      if (ext === '.png' || metadata.format === 'png') {
        await pipeline.png({ quality: 100, compressionLevel: 6 }).toFile(processedPath);
      } else {
        await pipeline.jpeg({ quality: 95 }).toFile(processedPath);
      }

      console.log(`✅ Preprocessed image saved: ${processedPath}`);

      return processedPath;
    } catch (error) {
      console.error('⚠️  Image preprocessing failed, using original:', error.message);
      return imagePath; // Fallback to original
    }
  }

  /**
   * Extract text from image using Sarvam Document Intelligence API
   * Flow: Preprocess → Create Job → Upload File → Start Job → Poll Status → Get Result
   * @param {string} imagePath - Path to image file
   * @returns {Promise<Object>} OCR result
   */
  async extractFromImage(imagePath) {
    const startTime = Date.now();
    let processedPath = null;

    try {
      if (!SARVAM_API_KEY) {
        return {
          success: false,
          error: 'SARVAM_API_KEY not configured in .env file'
        };
      }

      if (!fs.existsSync(imagePath)) {
        return {
          success: false,
          error: 'Image file not found'
        };
      }

      console.log('📷 Starting Sarvam Document Intelligence for:', imagePath);

      // STEP 0: Preprocess image for better handwriting recognition
      // TEMPORARILY DISABLED - testing raw image
      // processedPath = await this.preprocessImage(imagePath);
      processedPath = imagePath; // Use original image directly

      // STEP 1: Create a document intelligence job
      console.log('Step 1: Creating job...');
      const jobResponse = await axios.post(
        `${SARVAM_BASE_URL}/doc-digitization/job/v1`,
        {
          job_parameters: {
            language_code: 'en',
            output_format: 'md' // Only 'html' or 'md' are supported
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-subscription-key': SARVAM_API_KEY
          }
        }
      );

      const jobId = jobResponse.data.job_id;
      console.log(`✅ Job created: ${jobId}`);

      // STEP 2: Get presigned upload URL
      console.log('Step 2: Getting presigned upload URL...');
      const fileName = processedPath.split(/[\\/]/).pop(); // Get filename from path
      const uploadUrlResponse = await axios.post(
        `${SARVAM_BASE_URL}/doc-digitization/job/v1/upload-files`,
        {
          job_id: jobId,
          files: [fileName] // API expects 'files' array
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-subscription-key': SARVAM_API_KEY
          }
        }
      );

      console.log('Upload response:', JSON.stringify(uploadUrlResponse.data, null, 2));

      const uploadUrls = uploadUrlResponse.data.upload_urls;
      if (!uploadUrls) {
        throw new Error('No upload URLs received from API');
      }

      // upload_urls is an object with filename as key, extract the file_url
      const firstFile = Object.values(uploadUrls)[0];
      if (!firstFile || !firstFile.file_url) {
        throw new Error('No file_url found in upload response');
      }

      const presignedUrl = firstFile.file_url;
      console.log(`✅ Got presigned URL: ${presignedUrl.substring(0, 80)}...`);

      // STEP 3: Upload file to presigned URL (Azure Blob Storage)
      console.log('Step 3: Uploading file to presigned URL...');
      const fileBuffer = fs.readFileSync(processedPath);

      await axios.put(presignedUrl, fileBuffer, {
        headers: {
          'Content-Type': 'image/jpeg',
          'x-ms-blob-type': 'BlockBlob' // Required by Azure Blob Storage
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      });
      console.log('✅ File uploaded');

      // STEP 4: Start the job
      console.log('Step 4: Starting job...');
      const startUrl = `${SARVAM_BASE_URL}/doc-digitization/job/v1/${jobId}/start`;
      console.log('Start URL:', startUrl);

      const startResponse = await axios.post(
        startUrl,
        {},
        {
          headers: {
            'api-subscription-key': SARVAM_API_KEY
          }
        }
      );

      console.log('Start response:', JSON.stringify(startResponse.data, null, 2));
      console.log('✅ Job started');

      // STEP 5: Poll for job completion with exponential backoff
      console.log('Step 5: Polling for job completion...');
      const maxWaitTime = 60000; // 60 seconds max
      const pollInterval = 3000; // Check every 3 seconds
      const startPollingTime = Date.now();
      let downloadResponse = null;
      let zipUrl = null;

      while (Date.now() - startPollingTime < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));

        try {
          // Try to get download URLs - if successful, job is complete
          const testDownloadResponse = await axios.post(
            `${SARVAM_BASE_URL}/doc-digitization/job/v1/${jobId}/download-files`,
            {},
            {
              headers: {
                'api-subscription-key': SARVAM_API_KEY
              }
            }
          );

          // Check if ZIP URL is available
          const testZipUrl = testDownloadResponse.data.download_urls?.['document.zip']?.file_url;

          if (testZipUrl) {
            const elapsed = ((Date.now() - startPollingTime) / 1000).toFixed(1);
            console.log(`✅ Job completed after ${elapsed}s`);
            downloadResponse = testDownloadResponse;
            zipUrl = testZipUrl;
            break;
          } else {
            console.log(`⏳ Still processing... (${((Date.now() - startPollingTime) / 1000).toFixed(1)}s elapsed)`);
          }
        } catch (error) {
          // Job still processing or temporary error, continue polling
          const elapsed = ((Date.now() - startPollingTime) / 1000).toFixed(1);
          console.log(`⏳ Polling... (${elapsed}s elapsed)`);
        }
      }

      // Check if we timed out
      if (!zipUrl) {
        return {
          success: false,
          error: 'Job processing timeout after 60 seconds. Please try again with a clearer image.'
        };
      }

      console.log('Step 6: Download response:', JSON.stringify(downloadResponse.data, null, 2));

      // STEP 7: Download the ZIP file with timeout
      console.log('Step 7: Downloading ZIP file from:', zipUrl.substring(0, 80) + '...');
      const zipResponse = await axios.get(zipUrl, {
        responseType: 'arraybuffer',
        timeout: 30000 // 30 second timeout for download
      });

      // STEP 8: Extract ZIP and read the text file
      console.log('Step 8: Extracting ZIP contents...');
      const AdmZip = require('adm-zip');
      const zip = new AdmZip(zipResponse.data);
      const zipEntries = zip.getEntries();

      console.log('📦 ZIP contents:', zipEntries.map(e => e.entryName).join(', '));

      let extractedText = '';
      // Look for .md or .txt or .html file in the ZIP
      for (const entry of zipEntries) {
        if (entry.entryName.endsWith('.md') || entry.entryName.endsWith('.txt') || entry.entryName.endsWith('.html')) {
          extractedText = entry.getData().toString('utf8');
          console.log(`✅ Found text in: ${entry.entryName}`);
          console.log(`📄 Text length: ${extractedText.length} chars`);
          console.log(`📄 Text preview (first 500 chars): ${extractedText.substring(0, 500)}`);
          break;
        }
      }

      // Validate extraction
      if (!extractedText || extractedText.trim().length < 50) {
        return {
          success: false,
          error: 'Extracted text is empty or too short. The image may be unclear or the job did not complete properly. Please try again with a clearer photo.'
        };
      }

      const processingTime = Date.now() - startTime;
      console.log(`✅ Extraction complete in ${processingTime}ms`);
      console.log(`📄 Extracted ${extractedText.length} characters`);
      console.log('Extracted text preview:', extractedText.substring(0, 200));

      // Clean up preprocessed image
      if (processedPath && processedPath !== imagePath && fs.existsSync(processedPath)) {
        try {
          fs.unlinkSync(processedPath);
          console.log('🧹 Cleaned up preprocessed image');
        } catch (err) {
          console.warn('⚠️  Could not clean up preprocessed image:', err.message);
        }
      }

      return {
        success: true,
        data: {
          extracted: extractedText,
          processing_time_ms: processingTime,
          job_id: jobId,
          raw_response: downloadResponse.data
        }
      };
    } catch (error) {
      console.error('❌ Sarvam Document Intelligence Error:', error.message);

      // Clean up preprocessed image on error
      if (processedPath && processedPath !== imagePath && fs.existsSync(processedPath)) {
        try {
          fs.unlinkSync(processedPath);
        } catch (err) {
          // Ignore cleanup errors
        }
      }

      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);

        return {
          success: false,
          error: error.response.data?.error?.message || error.response.data?.message || 'Sarvam API error',
          status: error.response.status,
          details: error.response.data
        };
      }

      return {
        success: false,
        error: error.message || 'OCR extraction failed'
      };
    }
  }

  /**
   * Check if Sarvam AI service is healthy
   */
  async healthCheck() {
    try {
      if (!SARVAM_API_KEY) {
        return {
          status: 'unhealthy',
          error: 'SARVAM_API_KEY not configured'
        };
      }

      return {
        status: 'healthy',
        service: 'Sarvam Document Intelligence',
        api_key_configured: true,
        base_url: SARVAM_BASE_URL
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

module.exports = new OCRService();
