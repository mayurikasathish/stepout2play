import { useState, useCallback, useEffect } from 'react'
import Cropper from 'react-easy-crop'
import api from '../services/api'

const CreateOrganizationModal = ({ isOpen, onClose, onSuccess, editOrg = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    location: '',
    description: '',
    sports: [],
    instagram: '',
    facebook: '',
    twitter: ''
  })
  const [logo, setLogo] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [nameCheckMessage, setNameCheckMessage] = useState('')
  const [nameCheckLoading, setNameCheckLoading] = useState(false)
  const [cropModal, setCropModal] = useState(null) // { type: 'logo' | 'banner', image: dataUrl }

  // Available sports
  const availableSports = ['Tennis', 'Badminton', 'Table Tennis', 'Football', 'Basketball', 'Cricket']
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  const toggleSport = (sport) => {
    if (formData.sports.includes(sport)) {
      setFormData({ ...formData, sports: formData.sports.filter(s => s !== sport) })
    } else {
      setFormData({ ...formData, sports: [...formData.sports, sport] })
    }
  }

  // Populate form when editing
  useEffect(() => {
    if (editOrg) {
      // Extract social links from array to individual fields
      const socialLinks = Array.isArray(editOrg.socialLinks) ? editOrg.socialLinks : []
      const instagram = socialLinks.find(s => s.platform.toLowerCase().includes('instagram'))?.url || ''
      const facebook = socialLinks.find(s => s.platform.toLowerCase().includes('facebook'))?.url || ''
      const twitter = socialLinks.find(s => s.platform.toLowerCase().includes('twitter') || s.platform.toLowerCase() === 'x')?.url || ''

      setFormData({
        name: editOrg.name || '',
        contactPerson: editOrg.contactPerson || '',
        contactEmail: editOrg.contactEmail || '',
        contactPhone: editOrg.contactPhone || '',
        location: editOrg.location || '',
        description: editOrg.description || '',
        sports: Array.isArray(editOrg.sports) ? editOrg.sports : [],
        instagram,
        facebook,
        twitter
      })
      setLogoPreview(editOrg.logoUrl || null)
      setNameCheckMessage('')
      setError('') // Clear error when opening for edit
    } else {
      // Reset form when creating new
      setFormData({
        name: '',
        contactPerson: '',
        contactEmail: '',
        contactPhone: '',
        location: '',
        description: '',
        sports: [],
        instagram: '',
        facebook: '',
        twitter: ''
      })
      setLogo(null)
      setLogoPreview(null)
      setNameCheckMessage('')
      setError('') // Clear error when opening for create
    }
  }, [editOrg, isOpen])

  const handleFileChange = (e, type) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result
      if (type === 'logo') {
        setLogo(file)
        setLogoPreview(base64String)
      }
    }
    reader.readAsDataURL(file)
  }

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const createCroppedImage = async (imageSrc, pixelCrop) => {
    const image = new Image()
    image.src = imageSrc
    await new Promise((resolve) => {
      image.onload = resolve
    })

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    )

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob)
      }, 'image/jpeg', 0.95)
    })
  }

  const handleCropSave = async () => {
    if (!croppedAreaPixels) return

    const croppedBlob = await createCroppedImage(cropModal.image, croppedAreaPixels)
    const croppedFile = new File([croppedBlob], `cropped-${Date.now()}.jpg`, { type: 'image/jpeg' })

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result
      if (cropModal.type === 'logo') {
        setLogo(croppedFile)
        setLogoPreview(base64String)
      }
      setCropModal(null)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setCroppedAreaPixels(null)
    }
    reader.readAsDataURL(croppedFile)
  }


  const checkNameAvailability = async () => {
    const trimmedName = formData.name.trim()

    if (!trimmedName) {
      setNameCheckMessage('Please enter an organization name')
      return
    }

    // If editing and name hasn't changed, don't check
    if (editOrg && trimmedName === editOrg.name) {
      setNameCheckMessage('✓ Current organization name')
      return
    }

    setNameCheckLoading(true)
    setNameCheckMessage('')

    try {
      const response = await api.get('/orgs/check-name', {
        params: { name: trimmedName }
      })

      if (response.data.exists) {
        setNameCheckMessage('Name clash! Another organization got there first.')
      } else {
        setNameCheckMessage('✓ Name available!')
      }
    } catch (err) {
      console.error('Name check error:', err)
      setNameCheckMessage('Error checking name availability')
    } finally {
      setNameCheckLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation
    if (!formData.name.trim()) {
      setError('Organization name is required')
      return
    }
    if (!formData.contactPerson.trim()) {
      setError('Contact person is required')
      return
    }
    if (!formData.location.trim()) {
      setError('Location is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      let orgId
      let response

      // Convert individual social fields to socialLinks array
      const socialLinks = []
      if (formData.instagram.trim()) {
        socialLinks.push({ platform: 'Instagram', url: formData.instagram.trim() })
      }
      if (formData.facebook.trim()) {
        socialLinks.push({ platform: 'Facebook', url: formData.facebook.trim() })
      }
      if (formData.twitter.trim()) {
        socialLinks.push({ platform: 'Twitter', url: formData.twitter.trim() })
      }

      if (editOrg) {
        // Update existing organization
        response = await api.patch(`/orgs/${editOrg.id}`, {
          name: formData.name.trim(),
          contactPerson: formData.contactPerson.trim(),
          contactEmail: formData.contactEmail.trim() || null,
          contactPhone: formData.contactPhone.trim() || null,
          location: formData.location.trim(),
          description: formData.description.trim() || null,
          sports: formData.sports,
          socialLinks
        })
        orgId = editOrg.id
      } else {
        // Check if organization name already exists (only when creating)
        const checkResponse = await api.get('/orgs/check-name', {
          params: { name: formData.name.trim() }
        })

        if (checkResponse.data.exists) {
          setError('Org name exists!')
          setLoading(false)
          return
        }

        // Create organization
        response = await api.post('/orgs', {
          name: formData.name.trim(),
          contactPerson: formData.contactPerson.trim(),
          contactEmail: formData.contactEmail.trim() || null,
          contactPhone: formData.contactPhone.trim() || null,
          location: formData.location.trim(),
          description: formData.description.trim() || null,
          sports: formData.sports,
          socialLinks
        })
        orgId = response.data.org.id
      }

      if (response.data.success) {
        // Upload logo if provided (only if new file selected)
        if (logo) {
          const logoFormData = new FormData()
          logoFormData.append('logo', logo)
          await api.post(`/organizations/${orgId}/logo`, logoFormData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
        }

        onSuccess(response.data.org)
        // Reset form
        setFormData({
          name: '',
          sports: [],
          contactPerson: '',
          contactEmail: '',
          contactPhone: '',
          city: '',
          description: '',
          socialLinks: []
        })
        setLogo(null)
        setBanner(null)
        setLogoPreview(null)
        setBannerPreview(null)
        onClose()
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create organization')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      // Clear all state including error
      setError('')
      setNameCheckMessage('')
      setCropModal(null)

      // Reset file inputs
      const logoInput = document.getElementById('logo-upload')
      if (logoInput) logoInput.value = ''

      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Barlow:wght@400;500;600&display=swap');

        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 999;
          background: rgba(6, 13, 31, 0.8);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          overflow-y: auto;
        }

        .modal-content {
          background: linear-gradient(135deg, rgba(10, 22, 40, 0.95), rgba(6, 13, 31, 0.98));
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(79, 255, 176, 0.2);
          border-radius: 16px;
          padding: 2rem;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 0 40px rgba(79, 255, 176, 0.15);
        }

        .modal-header {
          margin-bottom: 1.5rem;
        }

        .modal-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 2rem;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          color: #4fffb0;
          margin-bottom: 0.75rem;
        }

        .modal-subtitle {
          font-family: 'Barlow', sans-serif;
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .sports-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
        }

        .sport-checkbox {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.75rem;
          background: rgba(6, 13, 31, 0.6);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          font-size: 0.9rem;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.6);
        }

        .sport-checkbox:hover {
          border-color: rgba(79, 255, 176, 0.4);
        }

        .sport-checkbox.selected {
          background: rgba(79, 255, 176, 0.15);
          border-color: #4fffb0;
          color: #4fffb0;
        }

        .form-group {
          margin-bottom: 1.25rem;
        }

        .form-label {
          display: block;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 0.5rem;
        }

        .form-label.required::after {
          content: ' *';
          color: #ec4899;
        }

        .form-input {
          width: 100%;
          background: rgba(6, 13, 31, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 0.75rem 1rem;
          font-family: 'Barlow', sans-serif;
          font-size: 0.95rem;
          color: #fff;
          outline: none;
          transition: all 0.2s ease;
        }

        .form-input:focus {
          border-color: #4fffb0;
          box-shadow: 0 0 0 3px rgba(79, 255, 176, 0.1);
        }

        .form-input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        textarea.form-input {
          resize: vertical;
          min-height: 80px;
        }

        .file-upload-area {
          border: 2px dashed rgba(79, 255, 176, 0.3);
          border-radius: 8px;
          padding: 1.5rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .file-upload-area:hover {
          border-color: #4fffb0;
          background: rgba(79, 255, 176, 0.05);
        }

        .file-upload-text {
          font-family: 'Barlow', sans-serif;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .file-preview {
          margin-top: 0.75rem;
          border-radius: 8px;
          overflow: hidden;
          position: relative;
          background: rgba(0, 0, 0, 0.3);
          padding: 1rem;
          min-height: 100px;
        }

        .file-preview img {
          width: 100%;
          max-height: 200px;
          height: auto;
          display: block;
          border: 2px solid rgba(79, 255, 176, 0.3);
          border-radius: 8px;
          object-fit: contain;
          background: rgba(255, 255, 255, 0.05);
        }

        .preview-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .btn-crop {
          background: rgba(79, 255, 176, 0.1);
          border: 1px solid rgba(79, 255, 176, 0.3);
          color: #4fffb0;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          font-size: 0.85rem;
          text-transform: uppercase;
          padding: 0.4rem 0.75rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-crop:hover {
          background: rgba(79, 255, 176, 0.15);
          border-color: rgba(79, 255, 176, 0.5);
        }

        .btn-remove {
          background: rgba(236, 72, 153, 0.1);
          border: 1px solid rgba(236, 72, 153, 0.3);
          color: #ec4899;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          font-size: 0.85rem;
          text-transform: uppercase;
          padding: 0.4rem 0.75rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-remove:hover {
          background: rgba(236, 72, 153, 0.15);
          border-color: rgba(236, 72, 153, 0.5);
        }

        .crop-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(6, 13, 31, 0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .crop-modal-content {
          background: linear-gradient(135deg, rgba(10, 22, 40, 0.95), rgba(6, 13, 31, 0.98));
          border: 1px solid rgba(79, 255, 176, 0.2);
          border-radius: 16px;
          padding: 2rem;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .crop-modal-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1.5rem;
          color: #4fffb0;
          margin-bottom: 1.5rem;
          text-transform: uppercase;
        }

        .crop-container {
          position: relative;
          width: 100%;
          height: 400px;
          background: rgba(0, 0, 0, 0.8);
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 1rem;
        }

        .crop-image {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          display: block;
          margin: 0 auto;
        }

        .crop-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .tag-input-container {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .tag {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(79, 255, 176, 0.15);
          border: 1px solid rgba(79, 255, 176, 0.3);
          border-radius: 20px;
          padding: 0.35rem 0.75rem;
          font-family: 'Barlow', sans-serif;
          font-size: 0.85rem;
          color: #4fffb0;
        }

        .tag-remove {
          background: none;
          border: none;
          color: #4fffb0;
          cursor: pointer;
          font-size: 1.1rem;
          line-height: 1;
          padding: 0;
        }

        .btn {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.75rem 1.5rem;
          border-radius: 50px;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.95rem;
        }

        .btn-primary {
          background: #4fffb0;
          color: #060d1f;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(79, 255, 176, 0.4);
        }

        .btn-secondary {
          background: transparent;
          color: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .btn-secondary:hover:not(:disabled) {
          border-color: #4fffb0;
          color: #4fffb0;
        }

        .btn-small {
          padding: 0.5rem 1rem;
          font-size: 0.85rem;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
        }

        .error-message {
          background: rgba(236, 72, 153, 0.2);
          border-left: 3px solid #ec4899;
          padding: 0.75rem 1rem;
          margin-bottom: 1.25rem;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          font-size: 0.95rem;
          color: #fff;
          animation: slideDown 0.3s ease;
        }

        .check-name-btn {
          background: rgba(79, 255, 176, 0.1);
          border: 1px solid rgba(79, 255, 176, 0.3);
          border-radius: 6px;
          padding: 0.5rem 1rem;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          font-size: 0.85rem;
          text-transform: uppercase;
          color: #4fffb0;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 0.5rem;
        }

        .check-name-btn:hover {
          background: rgba(79, 255, 176, 0.15);
          border-color: rgba(79, 255, 176, 0.5);
        }

        .check-name-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .name-check-message {
          padding: 0.5rem 0.75rem;
          margin-top: 0.5rem;
          font-family: 'Barlow', sans-serif;
          font-size: 0.85rem;
          border-radius: 4px;
          animation: slideDown 0.2s ease;
        }

        .name-check-message.available {
          background: rgba(79, 255, 176, 0.15);
          border-left: 3px solid #4fffb0;
          color: #4fffb0;
        }

        .name-check-message.unavailable {
          background: rgba(236, 72, 153, 0.15);
          border-left: 3px solid #ec4899;
          color: rgba(236, 72, 153, 0.9);
        }

        .name-check-message.info {
          background: rgba(255, 255, 255, 0.05);
          border-left: 3px solid rgba(255, 255, 255, 0.3);
          color: rgba(255, 255, 255, 0.6);
        }

        @keyframes slideDown {
          from {
            transform: translateY(-10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .social-link-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(79, 255, 176, 0.05);
          border: 1px solid rgba(79, 255, 176, 0.2);
          border-radius: 8px;
          padding: 0.75rem;
          margin-bottom: 0.5rem;
        }

        .social-link-text {
          font-family: 'Barlow', sans-serif;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.8);
        }
      `}</style>

      <div className="modal-overlay" onClick={handleClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title">{editOrg ? 'EDIT ORGANIZATION' : 'READY TO LEAD?'}</div>
            <div className="modal-subtitle">
              {editOrg ? 'Update your organization details.' : 'Build your organization and bring players together.'}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}

            {/* Organization Name */}
            <div className="form-group">
              <label className="form-label required">Organization Name</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value })
                  setNameCheckMessage('')
                }}
                placeholder="e.g. NBC Sports Academy"
                disabled={loading}
              />
              {(!editOrg || (editOrg && formData.name !== editOrg.name)) && (
                <button
                  type="button"
                  className="check-name-btn"
                  onClick={checkNameAvailability}
                  disabled={loading || nameCheckLoading || !formData.name.trim()}
                >
                  {nameCheckLoading ? 'Checking...' : 'Check Name Availability'}
                </button>
              )}
              {nameCheckMessage && (
                <div className={`name-check-message ${
                  nameCheckMessage.includes('✓') ? 'available' :
                  nameCheckMessage.includes('clash') ? 'unavailable' : 'info'
                }`}>
                  {nameCheckMessage}
                </div>
              )}
            </div>

            {/* Contact Person */}
            <div className="form-group">
              <label className="form-label required">Contact Person</label>
              <input
                type="text"
                className="form-input"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="Full name"
                disabled={loading}
              />
            </div>

            {/* Sports */}
            <div className="form-group">
              <label className="form-label">Sport(s)</label>
              <div className="sports-grid">
                {availableSports.map(sport => (
                  <div
                    key={sport}
                    className={`sport-checkbox ${formData.sports.includes(sport) ? 'selected' : ''}`}
                    onClick={() => !loading && toggleSport(sport)}
                  >
                    {sport}
                  </div>
                ))}
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder="contact@organization.com"
                disabled={loading}
              />
            </div>

            {/* Phone */}
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                type="tel"
                className="form-input"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="+91 98765 43210"
                disabled={loading}
              />
            </div>

            {/* Location */}
            <div className="form-group">
              <label className="form-label required">Location</label>
              <input
                type="text"
                className="form-input"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Mumbai, Maharashtra"
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                value={formData.description}
                onChange={(e) => {
                  if (e.target.value.length <= 500) {
                    setFormData({ ...formData, description: e.target.value })
                  }
                }}
                placeholder="Tell us about your organization..."
                disabled={loading}
                maxLength={500}
              />
              <div style={{
                textAlign: 'right',
                fontSize: '0.75rem',
                color: formData.description.length > 450 ? '#ec4899' : 'rgba(255, 255, 255, 0.4)',
                marginTop: '0.25rem'
              }}>
                {formData.description.length}/500
              </div>
            </div>

            {/* Logo */}
            <div className="form-group">
              <label className="form-label">Logo</label>
              {!logoPreview ? (
                <>
                  <input
                    type="file"
                    id="logo-upload"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'logo')}
                    disabled={loading}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="logo-upload" className="file-upload-area">
                    <div className="file-upload-text">+ Upload Logo</div>
                  </label>
                </>
              ) : (
                <div className="file-preview">
                  <img src={logoPreview} alt="Logo preview" />
                  <div className="preview-actions">
                    <button
                      type="button"
                      className="btn-crop"
                      onClick={() => setCropModal({ type: 'logo', image: logoPreview })}
                    >
                      ✂ Crop
                    </button>
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => {
                        setLogo(null)
                        setLogoPreview(null)
                        document.getElementById('logo-upload').value = ''
                      }}
                    >
                      × Remove
                    </button>
                    <button
                      type="button"
                      className="btn-secondary btn-small"
                      onClick={() => document.getElementById('logo-upload').click()}
                    >
                      ↻ Change
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Social Links */}
            <div className="form-group">
              <label className="form-label">Social Media (Optional)</label>

              {/* Instagram */}
              <div style={{ marginBottom: '0.75rem' }}>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Instagram</label>
                <input
                  type="url"
                  className="form-input"
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                  placeholder="https://instagram.com/yourorg"
                  disabled={loading}
                />
              </div>

              {/* Facebook */}
              <div style={{ marginBottom: '0.75rem' }}>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Facebook</label>
                <input
                  type="url"
                  className="form-input"
                  value={formData.facebook}
                  onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                  placeholder="https://facebook.com/yourorg"
                  disabled={loading}
                />
              </div>

              {/* Twitter */}
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Twitter / X</label>
                <input
                  type="url"
                  className="form-input"
                  value={formData.twitter}
                  onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                  placeholder="https://twitter.com/yourorg"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={loading} style={{ flex: 1 }}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>
                {loading ? (editOrg ? 'Updating...' : 'Creating...') : (editOrg ? 'Update Organization' : 'Create Organization')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Crop Modal */}
      {cropModal && (
        <div className="crop-modal-overlay" onClick={() => setCropModal(null)}>
          <div className="crop-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="crop-modal-title">✂ Crop {cropModal.type === 'logo' ? 'Logo' : 'Banner'}</div>

            <div className="crop-container">
              <Cropper
                image={cropModal.image}
                crop={crop}
                zoom={zoom}
                aspect={cropModal.type === 'logo' ? 1 : 16 / 9}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <div style={{ padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.85rem', fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase', fontWeight: 600 }}>
                Zoom
              </label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div className="crop-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setCropModal(null)
                  setCrop({ x: 0, y: 0 })
                  setZoom(1)
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCropSave}
              >
                Save Crop
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default CreateOrganizationModal
