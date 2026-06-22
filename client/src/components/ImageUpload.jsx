import { useState, useRef } from 'react'
import api from '../services/api'

const ImageUpload = ({
  currentImage,
  onImageUploaded,
  type = 'profile', // 'profile' or 'organization'
  label = 'Upload Image',
  className = ''
}) => {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(currentImage)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPG, PNG, or WEBP)')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      return
    }

    setError('')

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result)
    }
    reader.readAsDataURL(file)

    // Upload to server
    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('image', file)

      const endpoint = type === 'profile'
        ? '/upload/profile-picture'
        : '/upload/organization-logo'

      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.success) {
        onImageUploaded(response.data.imageUrl, response.data.publicId)
      }
    } catch (err) {
      console.error('Error uploading image:', err)
      setError(err.response?.data?.error || 'Failed to upload image')
      setPreviewUrl(currentImage) // Revert preview on error
    } finally {
      setUploading(false)
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.split(' ')
    return parts.length > 1
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase()
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-900 mb-3">{label}</label>

      <div className="flex items-start gap-4">
        {/* Image Preview */}
        <div className="relative">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Preview"
              className={`object-cover rounded-2xl ${
                type === 'profile'
                  ? 'w-32 h-32'
                  : 'w-40 h-40'
              }`}
            />
          ) : (
            <div className={`rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold ${
              type === 'profile'
                ? 'w-32 h-32 text-4xl'
                : 'w-40 h-40 text-5xl'
            }`}>
              {type === 'profile' ? getInitials('User') : 'ORG'}
            </div>
          )}

          {uploading && (
            <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            type="button"
            onClick={handleButtonClick}
            disabled={uploading}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {uploading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Uploading...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Choose Image
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 mt-2">
            JPG, PNG or WEBP. Max size 5MB.
          </p>

          {error && (
            <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default ImageUpload
