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
    bannerImageUrl: '',
    photoGallery: [],
    motto: '',
    aboutUs: '',
    joinUsInfo: '',
    contactEmail: '',
    contactPhone: '',
    colorScheme: 'blue'
  })

  const colorSchemes = [
    { id: 'blue', name: 'Ocean Blue', primary: 'bg-blue-600', secondary: 'bg-blue-100' },
    { id: 'green', name: 'Forest Green', primary: 'bg-green-600', secondary: 'bg-green-100' },
    { id: 'purple', name: 'Royal Purple', primary: 'bg-purple-600', secondary: 'bg-purple-100' },
    { id: 'orange', name: 'Sunset Orange', primary: 'bg-orange-600', secondary: 'bg-orange-100' },
    { id: 'pink', name: 'Rose Pink', primary: 'bg-pink-600', secondary: 'bg-pink-100' },
    { id: 'teal', name: 'Teal Wave', primary: 'bg-teal-600', secondary: 'bg-teal-100' }
  ]

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
        // Filter only orgs where user is OWNER or ADMIN
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
        const org = res.data.organization
        setFormData({
          tagline: org.tagline || '',
          bannerImageUrl: org.bannerImageUrl || '',
          photoGallery: org.photoGallery || [],
          motto: org.motto || '',
          aboutUs: org.aboutUs || '',
          joinUsInfo: org.joinUsInfo || '',
          contactEmail: org.contactEmail || '',
          contactPhone: org.contactPhone || '',
          colorScheme: org.colorScheme || 'blue'
        })
      }
    } catch (err) {
      console.error('Error loading org data:', err)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await api.patch(`/orgs/${selectedOrgId}`, formData)
      if (res.data.success) {
        setToastMessage('Organization minisite updated successfully!')
        setToastType('success')
        setShowToast(true)
        // Navigate to minisite after successful save
        setTimeout(() => {
          const slug = selectedOrg?.slug
          if (slug) {
            navigate(`/orgs/${slug}`)
          }
        }, 1500)
      }
    } catch (err) {
      console.error('Error saving org:', err)
      setToastMessage('Failed to update organization')
      setToastType('error')
      setShowToast(true)
    } finally {
      setSaving(false)
    }
  }

  const addPhoto = () => {
    const url = prompt('Enter photo URL:')
    if (url) {
      setFormData(prev => ({
        ...prev,
        photoGallery: [...prev.photoGallery, url]
      }))
    }
  }

  const removePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photoGallery: prev.photoGallery.filter((_, i) => i !== index)
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  if (orgs.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="glass-card rounded-2xl p-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Organizations Found</h2>
            <p className="text-gray-600 mb-6">You need to be an owner or admin of an organization to edit its minisite.</p>
            <button
              onClick={() => navigate('/manage')}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-all"
            >
              Go to My Organizations
            </button>
          </div>
        </main>
      </div>
    )
  }

  const selectedOrg = orgs.find(o => o.id === selectedOrgId)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Organization Page</h1>
            <p className="text-gray-600">Customize your organization's minisite</p>
          </div>
          <button
            onClick={() => navigate(`/orgs/${selectedOrg?.slug}`)}
            className="px-5 py-2.5 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-xl transition-all text-sm"
          >
            Preview Minisite
          </button>
        </div>

        {/* Org Selector */}
        <div className="glass-card rounded-xl p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {orgs.length > 1 ? 'Select Organization to Edit' : 'Editing Organization'}
          </label>
          {orgs.length > 1 ? (
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              {orgs.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          ) : (
            <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium">
              {selectedOrg?.name}
            </div>
          )}
        </div>

        {/* Editor Form */}
        <div className="glass-card rounded-2xl p-8 space-y-8">

          {/* Tagline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tagline <span className="text-gray-400 font-normal">(appears below org name)</span>
            </label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              placeholder="e.g., Building champions on and off the court"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Banner Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Banner Image
            </label>
            <ImageUpload
              type="banner"
              entityId={selectedOrgId}
              currentImage={formData.bannerImageUrl}
              onImageUploaded={(data) => {
                setFormData({ ...formData, bannerImageUrl: data.organization.bannerImageUrl })
                setToastMessage('Banner uploaded successfully!')
                setToastType('success')
                setShowToast(true)
              }}
              label="Upload Banner"
            />
            {formData.bannerImageUrl && (
              <img src={formData.bannerImageUrl} alt="Banner preview" className="mt-3 w-full h-48 object-cover rounded-lg border-2 border-gray-200" />
            )}
          </div>

          {/* Photo Gallery */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Photo Gallery <span className="text-gray-400 font-normal">(tournaments, events, team photos)</span>
            </label>

            {/* Existing Photos */}
            {formData.photoGallery.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                {formData.photoGallery.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-24 object-cover rounded-lg border-2 border-gray-200" />
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await api.delete(`/organizations/${selectedOrgId}/gallery/${idx}`)
                          setFormData(prev => ({
                            ...prev,
                            photoGallery: prev.photoGallery.filter((_, i) => i !== idx)
                          }))
                          setToastMessage('Photo deleted successfully!')
                          setToastType('success')
                          setShowToast(true)
                        } catch (err) {
                          console.error('Error deleting photo:', err)
                          setToastMessage('Failed to delete photo')
                          setToastType('error')
                          setShowToast(true)
                        }
                      }}
                      className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload New Photos */}
            <ImageUpload
              type="gallery"
              entityId={selectedOrgId}
              multiple={true}
              onImageUploaded={(data) => {
                setFormData({ ...formData, photoGallery: data.organization.photoGallery })
                setToastMessage('Photos uploaded successfully!')
                setToastType('success')
                setShowToast(true)
              }}
              label="Upload Photos"
            />
          </div>

          {/* Motto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motto / Culture / Rules
            </label>
            <textarea
              value={formData.motto}
              onChange={(e) => setFormData({ ...formData, motto: e.target.value })}
              placeholder="Describe your organization's values, culture, or rules..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
            />
          </div>

          {/* About Us */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              About Us
            </label>
            <textarea
              value={formData.aboutUs}
              onChange={(e) => setFormData({ ...formData, aboutUs: e.target.value })}
              placeholder="Tell people about your organization's history, mission, achievements..."
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
            />
          </div>

          {/* Join Us Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Join Us Information
            </label>
            <textarea
              value={formData.joinUsInfo}
              onChange={(e) => setFormData({ ...formData, joinUsInfo: e.target.value })}
              placeholder="How can people join? Requirements, benefits, etc..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
            />
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Email
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder="contact@organization.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Phone
              </label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Color Scheme */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Color Scheme
            </label>
            <div className="grid grid-cols-3 gap-3">
              {colorSchemes.map(scheme => (
                <button
                  key={scheme.id}
                  onClick={() => setFormData({ ...formData, colorScheme: scheme.id })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.colorScheme === scheme.id
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-8 h-8 rounded-lg ${scheme.primary}`}></div>
                    <div className={`w-8 h-8 rounded-lg ${scheme.secondary}`}></div>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{scheme.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              onClick={() => navigate('/manage')}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </main>

      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  )
}

export default EditOrgPage
