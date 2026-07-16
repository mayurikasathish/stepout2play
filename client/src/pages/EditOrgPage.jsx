import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Toast from '../components/Toast'
import ImageUpload from '../components/ImageUpload'
import api from '../services/api'

const EditOrgPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [orgs, setOrgs] = useState([])
  const [selectedOrgId, setSelectedOrgId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('success')

  const [formData, setFormData] = useState({
    tagline: '',
    description: '',
    bannerImageUrl: '',
    photoGallery: [],
    motto: '',
    aboutUs: '',
    joinUsInfo: '',
    membershipFee: '',
    location: '',
    contactEmail: '',
    contactPhone: '',
    instagramUrl: '',
    facebookUrl: '',
    twitterUrl: '',
    websiteUrl: '',
    colorScheme: 'neon-arena'
  })

  const colorSchemes = [
    { id: 'neon-arena', name: 'Neon Arena', primary: '#4fffb0', light: '#6bffbe', dark: '#3dd68f', description: 'Energetic & Sporty' },
    { id: 'cyber-court', name: 'Cyber Court', primary: '#00d4ff', light: '#33ddff', dark: '#00a8cc', description: 'Tech-Forward & Modern' },
    { id: 'power-surge', name: 'Power Surge', primary: '#a855f7', light: '#ba6ff8', dark: '#8b3dd6', description: 'Premium & Elite' },
    { id: 'blaze-mode', name: 'Blaze Mode', primary: '#fb923c', light: '#fca55d', dark: '#e07420', description: 'Warm & Welcoming' },
    { id: 'hot-streak', name: 'Hot Streak', primary: '#ec4899', light: '#f067ab', dark: '#d1347a', description: 'Bold & Fierce' }
  ]

  const selectedScheme = colorSchemes.find(s => s.id === formData.colorScheme) || colorSchemes[0]

  useEffect(() => {
    loadOrgs()
  }, [])

  useEffect(() => {
    if (selectedOrgId) {
      loadOrgData()
    }
  }, [selectedOrgId])

  const loadOrgs = async () => {
    try {
      setLoading(true)
      const res = await api.get('/orgs')
      if (res.data.success) {
        const allOrgs = res.data.orgs || res.data.organizations || []
        const editableOrgs = allOrgs.filter(
          org => org.myRole === 'OWNER' || org.myRole === 'ADMIN' || org.role === 'OWNER' || org.role === 'ADMIN'
        )
        setOrgs(editableOrgs)
        if (editableOrgs.length > 0) {
          setSelectedOrgId(editableOrgs[0].id)
        }
      }
    } catch (err) {
      console.error('Error loading orgs:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadOrgData = async () => {
    try {
      const res = await api.get(`/orgs/${selectedOrgId}`)
      if (res.data.success) {
        const org = res.data.org || res.data.organization
        setFormData({
          tagline: org.tagline || '',
          description: org.description || '',
          bannerImageUrl: org.bannerImageUrl || '',
          photoGallery: org.photoGallery || [],
          motto: org.motto || '',
          aboutUs: org.aboutUs || '',
          joinUsInfo: org.joinUsInfo || '',
          membershipFee: org.membershipFee || '',
          location: org.location || '',
          contactEmail: org.contactEmail || '',
          contactPhone: org.contactPhone || '',
          instagramUrl: org.instagramUrl || '',
          facebookUrl: org.facebookUrl || '',
          twitterUrl: org.twitterUrl || '',
          websiteUrl: org.websiteUrl || '',
          colorScheme: org.colorScheme || 'neon-arena'
        })
      }
    } catch (err) {
      console.error('Error loading org data:', err)
    }
  }

  const handleSave = async () => {
    // Validate required fields
    if (!formData.location || !formData.location.trim()) {
      setToastMessage('Location is required')
      setToastType('error')
      setShowToast(true)
      return
    }

    setSaving(true)
    try {
      const res = await api.patch(`/orgs/${selectedOrgId}`, formData)
      if (res.data.success) {
        setToastMessage('Website updated successfully!')
        setToastType('success')
        setShowToast(true)
        setTimeout(() => {
          const slug = selectedOrg?.slug
          if (slug) {
            navigate(`/orgs/${slug}`)
          }
        }, 1500)
      }
    } catch (err) {
      console.error('Error saving org:', err)
      setToastMessage('Failed to update')
      setToastType('error')
      setShowToast(true)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;900&family=Barlow:wght@400;500;600&display=swap');

          body {
            background: #060d1f;
            margin: 0;
            font-family: 'Barlow', sans-serif;
          }

          .loading-container {
            min-height: 100vh;
            background: linear-gradient(180deg, #060d1f 0%, #0a1628 50%, #060d1f 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            padding-top: 80px;
          }

          .spinner {
            width: 60px;
            height: 60px;
            border: 3px solid rgba(79, 255, 176, 0.1);
            border-top: 3px solid #4fffb0;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <div className="loading-container">
          <Navbar />
          <div className="spinner"></div>
        </div>
      </>
    )
  }

  if (orgs.length === 0) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;900&family=Barlow:wght@400;500;600&display=swap');

          body {
            background: #060d1f;
            margin: 0;
            font-family: 'Barlow', sans-serif;
          }

          .empty-container {
            min-height: 100vh;
            background: linear-gradient(180deg, #060d1f 0%, #0a1628 50%, #060d1f 100%);
            padding-top: 80px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
          }

          .empty-card {
            background: linear-gradient(145deg, #0a1628, #060d1f);
            border: 2px solid rgba(79, 255, 176, 0.2);
            border-radius: 16px;
            padding: 3rem;
            text-align: center;
            max-width: 500px;
          }

          .empty-title {
            font-family: 'Barlow Condensed', sans-serif;
            font-weight: 900;
            font-size: 2rem;
            color: #fff;
            margin-bottom: 1rem;
          }

          .empty-text {
            color: rgba(255, 255, 255, 0.6);
            margin-bottom: 2rem;
          }

          .btn {
            background: #4fffb0;
            color: #060d1f;
            font-family: 'Barlow Condensed', sans-serif;
            font-weight: 700;
            font-size: 1rem;
            text-transform: uppercase;
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          }

          .btn:hover {
            transform: translateY(-4px) scale(1.05);
          }
        `}</style>
        <div className="empty-container">
          <Navbar />
          <div className="empty-card">
            <div className="empty-title">NO ORGANIZATIONS FOUND</div>
            <div className="empty-text">You need to be an owner or admin to edit websites.</div>
            <button onClick={() => navigate('/manage')} className="btn">
              Go to Organizations
            </button>
          </div>
        </div>
      </>
    )
  }

  const selectedOrg = orgs.find(o => o.id === selectedOrgId)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;900&family=Barlow:wght@400;500;600&display=swap');

        :root {
          --theme-primary: ${selectedScheme.primary};
          --theme-light: ${selectedScheme.light};
          --theme-dark: ${selectedScheme.dark};
        }

        body {
          background: #060d1f;
          margin: 0;
          font-family: 'Barlow', sans-serif;
        }

        .edit-container {
          min-height: 100vh;
          background: linear-gradient(180deg, #060d1f 0%, #0a1628 50%, #060d1f 100%);
          padding-top: 80px;
        }

        .content-wrapper {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .page-header {
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .header-left h1 {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 2.5rem;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          color: var(--theme-primary);
          margin: 0 0 0.5rem 0;
        }

        .header-left p {
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
        }

        .btn-preview {
          background: rgba(0, 212, 255, 0.1);
          color: #00d4ff;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          text-transform: uppercase;
          padding: 0.75rem 1.5rem;
          border: 2px solid rgba(0, 212, 255, 0.3);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .btn-preview:hover {
          transform: translateY(-4px) scale(1.05);
          background: rgba(0, 212, 255, 0.15);
          border-color: #00d4ff;
        }

        .org-selector-card {
          background: linear-gradient(145deg, #0a1628, #060d1f);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 2rem;
          margin-bottom: 2rem;
        }

        .selector-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 0.5rem;
        }

        .selector-subtitle {
          font-family: 'Barlow', sans-serif;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.4);
          margin-bottom: 1rem;
          font-style: italic;
        }

        .org-select {
          width: 100%;
          background: rgba(6, 13, 31, 0.8);
          border: 2px solid rgba(255, 255, 255, 0.15);
          border-radius: 10px;
          padding: 0.75rem 1rem;
          color: #fff;
          font-family: 'Barlow', sans-serif;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .org-select:hover {
          border-color: var(--theme-primary);
          opacity: 0.3;
        }

        .org-select:focus {
          outline: none;
          border-color: var(--theme-primary);
        }

        .org-select-static {
          width: 100%;
          background: linear-gradient(145deg, color-mix(in srgb, var(--theme-primary) 8%, transparent), color-mix(in srgb, var(--theme-primary) 2%, transparent));
          border: 2px solid color-mix(in srgb, var(--theme-primary) 30%, transparent);
          border-radius: 10px;
          padding: 0.75rem 1rem;
          color: var(--theme-primary);
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1.1rem;
        }

        .editor-card {
          background: linear-gradient(145deg, #0a1628, #060d1f);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 0;
          overflow: hidden;
        }

        .section {
          padding: 2.5rem;
          border-bottom: 2px solid rgba(255, 255, 255, 0.05);
        }

        .section:last-child {
          border-bottom: none;
        }

        /* Section Color Coding - ALL USE THEME */
        .section-basic { border-left: 5px solid var(--theme-primary); }
        .section-visual { border-left: 5px solid var(--theme-primary); }
        .section-about { border-left: 5px solid var(--theme-primary); }
        .section-membership { border-left: 5px solid var(--theme-primary); }
        .section-contact { border-left: 5px solid var(--theme-primary); }

        .section-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 1.75rem;
          text-transform: uppercase;
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          letter-spacing: 0.02em;
          color: var(--theme-primary);
        }

        .form-group {
          margin-bottom: 1.75rem;
        }

        .form-label {
          display: block;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.85);
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .form-hint {
          font-weight: 400;
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.8rem;
          text-transform: none;
          letter-spacing: normal;
        }

        .form-required {
          color: #ec4899;
          margin-left: 0.25rem;
        }

        .form-input {
          width: 100%;
          background: linear-gradient(145deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.3));
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 0.75rem 1rem;
          color: #fff;
          font-family: 'Barlow', sans-serif;
          font-size: 0.95rem;
          transition: all 0.3s ease;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--theme-primary);
        }

        .form-input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .form-textarea {
          width: 100%;
          background: linear-gradient(145deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.3));
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 0.75rem 1rem;
          color: #fff;
          font-family: 'Barlow', sans-serif;
          font-size: 0.95rem;
          resize: vertical;
          min-height: 100px;
          transition: all 0.3s ease;
        }

        .form-textarea:focus {
          outline: none;
          border-color: var(--theme-primary);
        }

        .form-textarea::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        @media (max-width: 768px) {
          .grid-2 {
            grid-template-columns: 1fr;
          }
        }

        .color-scheme-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1.25rem;
        }

        .color-scheme-btn {
          background: linear-gradient(145deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.3));
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          text-align: center;
        }

        .color-scheme-btn:hover {
          transform: translateY(-4px) scale(1.03);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .color-scheme-btn.active {
          border-color: var(--theme-primary);
          background: linear-gradient(145deg, color-mix(in srgb, var(--theme-primary) 12%, transparent), color-mix(in srgb, var(--theme-primary) 5%, transparent));
        }

        .color-swatch {
          width: 100%;
          height: 70px;
          border-radius: 10px;
          margin-bottom: 1rem;
          transition: all 0.3s ease;
        }

        .color-scheme-btn:hover .color-swatch {
          transform: scale(1.05);
        }

        .color-scheme-name {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          color: #fff;
          text-transform: uppercase;
          margin-bottom: 0.35rem;
        }

        .color-scheme-desc {
          font-family: 'Barlow', sans-serif;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
        }

        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .gallery-item {
          position: relative;
          width: 100%;
          height: 150px;
          border-radius: 10px;
          overflow: hidden;
          border: 2px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }

        .gallery-item:hover {
          border-color: var(--theme-primary);
        }

        .gallery-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .gallery-delete {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          width: 32px;
          height: 32px;
          background: rgba(236, 72, 153, 0.95);
          color: #fff;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;
          opacity: 0;
          transition: all 0.3s ease;
        }

        .gallery-item:hover .gallery-delete {
          opacity: 1;
        }

        .gallery-delete:hover {
          background: #ec4899;
          transform: scale(1.15);
        }

        .banner-preview {
          width: 100%;
          height: 220px;
          object-fit: cover;
          border-radius: 10px;
          border: 2px solid rgba(255, 255, 255, 0.1);
          margin-top: 1rem;
        }

        .actions-bar {
          display: flex;
          justify-content: flex-end;
          gap: 1.25rem;
          padding: 2.5rem;
        }

        .btn-cancel {
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
          color: rgba(255, 255, 255, 0.75);
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          text-transform: uppercase;
          padding: 0.85rem 1.75rem;
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .btn-cancel:hover {
          transform: translateY(-3px);
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.05));
          color: #fff;
        }

        .btn-save {
          background: linear-gradient(145deg, var(--theme-light), var(--theme-dark));
          color: #060d1f;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          text-transform: uppercase;
          padding: 0.85rem 2.25rem;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .btn-save:hover:not(:disabled) {
          transform: translateY(-4px) scale(1.05);
        }

        .btn-save:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>

      <div className="edit-container">
        <Navbar />
        <div className="content-wrapper">

          {/* Header */}
          <div className="page-header">
            <div className="header-left">
              <h1>✨ EDIT WEBSITE</h1>
              <p>Build your free public page on StepOut2Play</p>
            </div>
            <button
              onClick={() => navigate(`/orgs/${selectedOrg?.slug}`)}
              className="btn-preview"
            >
              👁 Preview Website
            </button>
          </div>

          {/* Org Selector */}
          <div className="org-selector-card">
            <div className="selector-label">Now editing:</div>
            <div className="selector-subtitle">Your free website on StepOut2Play</div>
            {orgs.length > 1 ? (
              <select
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                className="org-select"
              >
                {orgs.map(org => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            ) : (
              <div className="org-select-static">
                {selectedOrg?.name}
              </div>
            )}
          </div>

          {/* Editor Form */}
          <div className="editor-card">

            {/* Section: Basic Info */}
            <div className="section section-basic">
              <div className="section-title">
                <span>📝</span> BASIC INFO
              </div>

              <div className="form-group">
                <label className="form-label">
                  Tagline <span className="form-hint">(appears below org name)</span>
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => {
                    if (e.target.value.length <= 100) {
                      setFormData({ ...formData, tagline: e.target.value })
                    }
                  }}
                  placeholder="e.g., Building champions on and off the court"
                  className="form-input"
                  maxLength={100}
                />
                <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem' }}>
                  {formData.tagline.length}/100
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Short Description <span className="form-hint">(1-2 sentences)</span>
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => {
                    if (e.target.value.length <= 250) {
                      setFormData({ ...formData, description: e.target.value })
                    }
                  }}
                  placeholder="A quick summary of your organization..."
                  rows={3}
                  className="form-textarea"
                  maxLength={250}
                />
                <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem' }}>
                  {(formData.description || '').length}/250
                </div>
              </div>
            </div>

            {/* Section: Visual Assets */}
            <div className="section section-visual">
              <div className="section-title">
                <span>🎨</span> VISUAL ASSETS
              </div>

              {/* Banner */}
              <div className="form-group">
                <label className="form-label">Banner Image</label>
                <ImageUpload
                  key={`banner-${formData.bannerImageUrl || 'empty'}`}
                  type="banner"
                  entityId={selectedOrgId}
                  currentImage={formData.bannerImageUrl}
                  onImageUploaded={(data) => {
                    const newBannerUrl = data.organization.bannerImageUrl
                    setFormData(prev => ({ ...prev, bannerImageUrl: newBannerUrl }))
                    setToastMessage('Banner uploaded!')
                    setToastType('success')
                    setShowToast(true)
                    loadOrgData()
                  }}
                  label="Upload Banner"
                />
                {formData.bannerImageUrl && (
                  <img src={formData.bannerImageUrl} alt="Banner" className="banner-preview" />
                )}
              </div>

              {/* Photo Gallery */}
              <div className="form-group">
                <label className="form-label">
                  Photo Gallery <span className="form-hint">(tournaments, events, team photos)</span>
                </label>

                {formData.photoGallery.length > 0 && (
                  <div className="gallery-grid">
                    {formData.photoGallery.map((url, idx) => (
                      <div key={idx} className="gallery-item">
                        <img src={url} alt={`Gallery ${idx + 1}`} className="gallery-img" />
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await api.delete(`/organizations/${selectedOrgId}/gallery/${idx}`)
                              setFormData(prev => ({
                                ...prev,
                                photoGallery: prev.photoGallery.filter((_, i) => i !== idx)
                              }))
                              setToastMessage('Photo deleted')
                              setToastType('success')
                              setShowToast(true)
                            } catch (err) {
                              setToastMessage('Failed to delete photo')
                              setToastType('error')
                              setShowToast(true)
                            }
                          }}
                          className="gallery-delete"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <ImageUpload
                  key={`gallery-${formData.photoGallery.length}`}
                  type="gallery"
                  entityId={selectedOrgId}
                  multiple={true}
                  onImageUploaded={(data) => {
                    const newGallery = data.organization.photoGallery
                    setFormData(prev => ({ ...prev, photoGallery: newGallery }))
                    setToastMessage('Photos uploaded!')
                    setToastType('success')
                    setShowToast(true)
                    loadOrgData()
                  }}
                  label="Upload Photos"
                />
              </div>
            </div>

            {/* Section: About & Culture */}
            <div className="section section-about">
              <div className="section-title">
                <span>ℹ️</span> ABOUT & CULTURE
              </div>

              <div className="form-group">
                <label className="form-label">About Us</label>
                <textarea
                  value={formData.aboutUs}
                  onChange={(e) => {
                    if (e.target.value.length <= 1000) {
                      setFormData({ ...formData, aboutUs: e.target.value })
                    }
                  }}
                  placeholder="Tell people about your organization's history, mission, achievements..."
                  rows={6}
                  className="form-textarea"
                  maxLength={1000}
                />
                <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem' }}>
                  {formData.aboutUs.length}/1000
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Motto / Culture / Rules</label>
                <textarea
                  value={formData.motto}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) {
                      setFormData({ ...formData, motto: e.target.value })
                    }
                  }}
                  placeholder="Describe your organization's values, culture, or rules..."
                  rows={4}
                  className="form-textarea"
                  maxLength={500}
                />
                <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem' }}>
                  {formData.motto.length}/500
                </div>
              </div>
            </div>

            {/* Section: Membership */}
            <div className="section section-membership">
              <div className="section-title">
                <span>👥</span> MEMBERSHIP
              </div>

              <div className="form-group">
                <label className="form-label">Join Us Information</label>
                <textarea
                  value={formData.joinUsInfo}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) {
                      setFormData({ ...formData, joinUsInfo: e.target.value })
                    }
                  }}
                  placeholder="How can people join? Requirements, process, etc..."
                  rows={4}
                  className="form-textarea"
                  maxLength={500}
                />
                <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem' }}>
                  {formData.joinUsInfo.length}/500
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Membership Fee <span className="form-hint">(optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.membershipFee || ''}
                  onChange={(e) => {
                    if (e.target.value.length <= 50) {
                      setFormData({ ...formData, membershipFee: e.target.value })
                    }
                  }}
                  placeholder="e.g., ₹500/month or Free"
                  className="form-input"
                  maxLength={50}
                />
                <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem' }}>
                  {(formData.membershipFee || '').length}/50
                </div>
              </div>
            </div>

            {/* Section: Contact & Social */}
            <div className="section section-contact">
              <div className="section-title">
                <span>📞</span> CONTACT & SOCIAL
              </div>

              <div className="form-group">
                <label className="form-label">
                  Location <span className="form-required">*</span> <span className="form-hint">(City, State)</span>
                </label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => {
                    if (e.target.value.length <= 100) {
                      setFormData({ ...formData, location: e.target.value })
                    }
                  }}
                  placeholder="e.g., Bengaluru, Karnataka"
                  className="form-input"
                  required
                  maxLength={100}
                />
                <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem' }}>
                  {(formData.location || '').length}/100
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Contact Email</label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    placeholder="contact@organization.com"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Phone</label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">
                    Instagram <span className="form-hint">(optional)</span>
                  </label>
                  <input
                    type="url"
                    value={formData.instagramUrl || ''}
                    onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                    placeholder="https://instagram.com/yourorg"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Facebook <span className="form-hint">(optional)</span>
                  </label>
                  <input
                    type="url"
                    value={formData.facebookUrl || ''}
                    onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                    placeholder="https://facebook.com/yourorg"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">
                    Twitter <span className="form-hint">(optional)</span>
                  </label>
                  <input
                    type="url"
                    value={formData.twitterUrl || ''}
                    onChange={(e) => setFormData({ ...formData, twitterUrl: e.target.value })}
                    placeholder="https://twitter.com/yourorg"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Website <span className="form-hint">(optional)</span>
                  </label>
                  <input
                    type="url"
                    value={formData.websiteUrl || ''}
                    onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                    placeholder="https://yourorg.com"
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            {/* Section: Color Theme */}
            <div className="section">
              <div className="section-title" style={{ color: '#4fffb0' }}>
                <span>🎨</span> COLOR THEME
              </div>

              <div className="color-scheme-grid">
                {colorSchemes.map(scheme => (
                  <button
                    key={scheme.id}
                    onClick={() => setFormData({ ...formData, colorScheme: scheme.id })}
                    className={`color-scheme-btn ${formData.colorScheme === scheme.id ? 'active' : ''}`}
                  >
                    <div
                      className="color-swatch"
                      style={{ background: scheme.primary }}
                    />
                    <div className="color-scheme-name">{scheme.name}</div>
                    <div className="color-scheme-desc">{scheme.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="actions-bar">
              <button
                onClick={() => navigate('/manage')}
                className="btn-cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-save"
              >
                {saving ? 'Saving...' : '💾 Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  )
}

export default EditOrgPage
