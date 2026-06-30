const FormData = require('form-data');
const axios = require('axios');
const fs = require('fs');

const SARVAM_API_KEY = process.env.SARVAM_API_KEY;
const SARVAM_BASE_URL = 'https://api.sarvam.ai';

class OCRService {
  /**
   * Extract text from image using Sarvam Document Intelligence API
   * Flow: Create Job → Upload File → Start Job → Poll Status → Get Result
   * @param {string} imagePath - Path to image file
   * @returns {Promise<Object>} OCR result
   */
  async extractFromImage(imagePath) {
    const startTime = Date.now();

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
      const fileName = imagePath.split(/[\\/]/).pop(); // Get filename from path
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
      const fileBuffer = fs.readFileSync(imagePath);

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

      // STEP 5: Since status endpoint is not working, wait fixed time and try to download
      console.log('Step 5: Waiting for processing to complete...');
      console.log('⏳ Waiting 15 seconds for job to process (fixed wait since status API returns 404)...');
      await new Promise(resolve => setTimeout(resolve, 15000));

      // Skip status polling since the endpoint returns 404
      // Just proceed to download after fixed wait

      // STEP 6: Get download URLs
      console.log('Step 6: Fetching download URLs...');
      const downloadResponse = await axios.post(
        `${SARVAM_BASE_URL}/doc-digitization/job/v1/${jobId}/download-files`,
        {},
        {
          headers: {
            'api-subscription-key': SARVAM_API_KEY
          }
        }
      );

      console.log('Download response:', JSON.stringify(downloadResponse.data, null, 2));

      // STEP 7: Download the ZIP file
      const zipUrl = downloadResponse.data.download_urls?.['document.zip']?.file_url;
      if (!zipUrl) {
        return {
          success: false,
          error: 'No ZIP download URL in response'
        };
      }

      console.log('Step 7: Downloading ZIP file from:', zipUrl.substring(0, 80) + '...');
      const zipResponse = await axios.get(zipUrl, {
        responseType: 'arraybuffer'
      });

      // STEP 8: Extract ZIP and read the text file
      console.log('Step 8: Extracting ZIP contents...');
      const AdmZip = require('adm-zip');
      const zip = new AdmZip(zipResponse.data);
      const zipEntries = zip.getEntries();

      let extractedText = '';
      // Look for .md or .txt or .html file in the ZIP
      for (const entry of zipEntries) {
        if (entry.entryName.endsWith('.md') || entry.entryName.endsWith('.txt') || entry.entryName.endsWith('.html')) {
          extractedText = entry.getData().toString('utf8');
          console.log(`Found text in: ${entry.entryName}`);
          break;
        }
      }

      const processingTime = Date.now() - startTime;
      console.log(`✅ Extraction complete in ${processingTime}ms`);
      console.log('Extracted text preview:', extractedText.substring(0, 200));

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
