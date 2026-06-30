import React, { useState } from 'react'
import api from '../services/api'

const OCRTestPage = () => {
  const [selectedImage, setSelectedImage] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [extracting, setExtracting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedImage(file)
      setPreviewUrl(URL.createObjectURL(file))
      setResult(null)
      setError(null)
    }
  }

  const handleExtract = async () => {
    if (!selectedImage) {
      setError('Please select an image first')
      return
    }

    setExtracting(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('scorecard', selectedImage)

      console.log('📤 Uploading image to OCR service...')
      const response = await api.post('/ocr/extract-score', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      console.log('✅ OCR Response:', response.data)
      setResult(response.data)
    } catch (err) {
      console.error('❌ OCR Error:', err)
      setError(err.response?.data?.error || err.message || 'Failed to extract text')
    } finally {
      setExtracting(false)
    }
  }

  const handleCheckHealth = async () => {
    try {
      const response = await api.get('/ocr/health')
      alert(`OCR Service Status: ${response.data.status}\n${JSON.stringify(response.data, null, 2)}`)
    } catch (err) {
      alert(`Health Check Failed: ${err.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                🧠 Sarvam AI Vision - OCR Test
              </h1>
              <p className="text-gray-600">
                Upload an image with text/numbers to test extraction
              </p>
            </div>
            <button
              onClick={handleCheckHealth}
              className="px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 font-semibold rounded-lg transition-all"
            >
              Check Health
            </button>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Upload Image</h2>

          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-all">
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleImageSelect}
              className="hidden"
              id="imageUpload"
            />
            <label
              htmlFor="imageUpload"
              className="cursor-pointer flex flex-col items-center"
            >
              <svg
                className="w-16 h-16 text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-lg font-semibold text-gray-700 mb-2">
                Click to upload image
              </span>
              <span className="text-sm text-gray-500">
                JPG, PNG, WEBP (Max 10MB)
              </span>
            </label>
          </div>

          {selectedImage && (
            <div className="mt-4 text-center text-sm text-gray-600">
              Selected: {selectedImage.name}
            </div>
          )}
        </div>

        {/* Preview Section */}
        {previewUrl && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Preview</h2>
            <div className="flex justify-center">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-full max-h-96 rounded-lg border-2 border-gray-200"
              />
            </div>
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleExtract}
                disabled={extracting}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {extracting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    Extracting...
                  </div>
                ) : (
                  '🔍 Extract Text'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Error Section */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <svg
                className="w-6 h-6 text-red-600 flex-shrink-0 mt-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="text-lg font-bold text-red-900 mb-1">Error</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              ✅ Extraction Results
            </h2>

            {/* Processing Time */}
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <span className="text-sm text-blue-700 font-semibold">
                ⚡ Processing Time: {result.processing_time_ms}ms
              </span>
            </div>

            {/* Extracted Text */}
            <div className="bg-gray-50 rounded-lg p-6 mb-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3">
                Extracted Text:
              </h3>
              <pre className="text-gray-900 whitespace-pre-wrap font-mono text-sm bg-white p-4 rounded border border-gray-200">
                {JSON.stringify(result.extracted, null, 2)}
              </pre>
            </div>

            {/* Raw Response */}
            <details className="bg-gray-50 rounded-lg p-4">
              <summary className="cursor-pointer text-sm font-semibold text-gray-700 hover:text-gray-900">
                View Raw API Response
              </summary>
              <pre className="mt-3 text-xs text-gray-600 whitespace-pre-wrap overflow-x-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  )
}

export default OCRTestPage
