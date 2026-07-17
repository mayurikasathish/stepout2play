import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import ImageUpload from '../components/ImageUpload'
import Toast from '../components/Toast'
import LocationSelector from '../components/LocationSelector'
import PlayerRadarCard from '../components/PlayerRadarCard'
import api from '../services/api'

const ProfilePage = () => {
  const { user: authUser, refreshContext } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({})
  const [saving, setSaving] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('success')
  const [error, setError] = useState('')
  const [ratings, setRatings] = useState([])
  const [selectedGraphSport, setSelectedGraphSport] = useState(null)
  const [ratingHistory, setRatingHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [bioExpanded, setBioExpanded] = useState(false)
  const [careerStats, setCareerStats] = useState(null)
  const [recentMatches, setRecentMatches] = useState([])
  const [selectedMatchSport, setSelectedMatchSport] = useState('all')
  const [activityHeatmap, setActivityHeatmap] = useState({})
  const [showAllMatches, setShowAllMatches] = useState(false)
  const [allMatches, setAllMatches] = useState([])
  const [achievementSummary, setAchievementSummary] = useState({ gold: 0, silver: 0, bronze: 0, total: 0 })
  const [achievements, setAchievements] = useState([])
  const [activeTab, setActiveTab] = useState('overview') // 'overview' or 'achievements'

  const sportsList = ['Badminton', 'Tennis', 'Table Tennis', 'Squash', 'Pickleball', 'Padel']
  const BIO_CHAR_LIMIT = 150

  useEffect(() => {
    fetchProfile()
    if (authUser?.id) {
      fetchRatings()
      fetchCareerStats()
      fetchRecentMatches('all')
      fetchActivityHeatmap()
      fetchAchievementSummary()
      if (activeTab === 'achievements') {
        fetchAchievements()
      }
    }
  }, [authUser?.id, activeTab])

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/me')
      console.log('🔍 Profile response:', response.data)
      if (response.data.success) {
        console.log('✅ User sports:', response.data.user.sports)
        setProfile(response.data.user)
        setFormData({
          firstName: response.data.user.firstName || '',
          lastName: response.data.user.lastName || '',
          email: response.data.user.email || '',
          dob: response.data.user.dob ? response.data.user.dob.split('T')[0] : '',
          gender: response.data.user.gender || '',
          city: response.data.user.city || '',
          state: response.data.user.state || '',
          locality: response.data.user.locality || '',
          latitude: response.data.user.latitude || null,
          longitude: response.data.user.longitude || null,
          phone: response.data.user.phone || '',
          bio: response.data.user.bio || '',
          sports: response.data.user.sports || [],
          profilePicture: response.data.user.profilePicture || ''
        })
      }
      setLoading(false)
    } catch (err) {
      console.error('Error fetching profile:', err)
      setLoading(false)
    }
  }

  const fetchRatings = async () => {
    try {
      // Use profile-stats endpoint to get ratings with rank info
      const response = await api.get(`/users/${authUser.id}/profile-stats`)
      if (response.data.success) {
        console.log('✅ Sports Stats:', response.data.sportsStats)
        const ratingsData = response.data.sportsStats || []
        setRatings(ratingsData)

        // Auto-select first sport with matches for graph
        if (ratingsData.length > 0 && !selectedGraphSport) {
          const sportWithMatches = ratingsData.find(r => r.matchCount > 0)
          if (sportWithMatches) {
            setSelectedGraphSport(sportWithMatches.sportId)
          } else {
            setSelectedGraphSport(ratingsData[0].sportId)
          }
        }
      }
    } catch (err) {
      console.error('Error fetching ratings:', err)
    }
  }

  const fetchRatingHistory = async (sportId) => {
    if (!sportId) return
    setLoadingHistory(true)
    try {
      const response = await api.get(`/ratings/${authUser.id}/${sportId}/history`)
      if (response.data.success) {
        console.log('✅ Rating history:', response.data.history)
        setRatingHistory(response.data.history || [])
      }
    } catch (err) {
      console.error('Error fetching rating history:', err)
      setRatingHistory([])
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    if (selectedGraphSport) {
      fetchRatingHistory(selectedGraphSport)
    }
  }, [selectedGraphSport])

  const getSportDisplayName = (sportId) => {
    return sportId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const formatGraphDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const fetchCareerStats = async () => {
    try {
      const response = await api.get(`/users/${authUser.id}/profile-stats`)
      if (response.data.success) {
        setCareerStats(response.data.careerStats)
      }
    } catch (err) {
      console.error('Error fetching career stats:', err)
    }
  }

  const fetchRecentMatches = async (sportId) => {
    try {
      const query = sportId === 'all' ? '' : `?sportId=${sportId}`
      const response = await api.get(`/users/${authUser.id}/match-history${query}`)
      if (response.data.success) {
        console.log('📊 Total matches fetched:', response.data.matchHistory.length)
        setRecentMatches(response.data.matchHistory.slice(0, 10))
        setAllMatches(response.data.matchHistory)
      }
    } catch (err) {
      console.error('Error fetching matches:', err)
    }
  }

  const fetchActivityHeatmap = async () => {
    try {
      const response = await api.get(`/users/${authUser.id}/activity-heatmap`)
      if (response.data.success) {
        setActivityHeatmap(response.data.activity)
      }
    } catch (err) {
      console.error('Error fetching activity heatmap:', err)
    }
  }

  const fetchAchievementSummary = async () => {
    try {
      const response = await api.get(`/users/${authUser.id}/achievements/summary`)
      if (response.data.success) {
        setAchievementSummary(response.data.summary)
      }
    } catch (err) {
      console.error('Error fetching achievement summary:', err)
    }
  }

  const fetchAchievements = async () => {
    try {
      const response = await api.get(`/users/${authUser.id}/achievements`)
      if (response.data.success) {
        setAchievements(response.data.achievements)
      }
    } catch (err) {
      console.error('Error fetching achievements:', err)
    }
  }

  const handleMatchSportFilter = (sportId) => {
    setSelectedMatchSport(sportId)
    fetchRecentMatches(sportId)
  }

  const getRelativeTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const toggleSport = (sport) => {
    setFormData(prev => ({
      ...prev,
      sports: prev.sports.includes(sport)
        ? prev.sports.filter(s => s !== sport)
        : [...prev.sports, sport]
    }))
  }

  const handleSaveProfile = async () => {
    setError('')

    // Validation
    if (!formData.dob || !formData.gender || !formData.city) {
      setError('Date of birth, gender and city are required')
      return
    }

    if (formData.sports.length === 0) {
      setError('Please select at least one sport')
      return
    }

    console.log('🔥 Saving profile with sports:', formData.sports)

    setSaving(true)
    try {
      const payload = { ...formData }
      if (payload.dob) payload.dob = new Date(payload.dob).toISOString()

      console.log('🔥 Payload being sent:', payload)

      const response = await api.patch('/auth/profile', payload)
      console.log('🔥 Response from server:', response.data)

      if (response.data.success) {
        console.log('✅ Updated user sports:', response.data.user.sports)
        setProfile(response.data.user)
        setFormData({
          firstName: response.data.user.firstName || '',
          lastName: response.data.user.lastName || '',
          email: response.data.user.email || '',
          dob: response.data.user.dob ? response.data.user.dob.split('T')[0] : '',
          gender: response.data.user.gender || '',
          city: response.data.user.city || '',
          state: response.data.user.state || '',
          locality: response.data.user.locality || '',
          latitude: response.data.user.latitude || null,
          longitude: response.data.user.longitude || null,
          phone: response.data.user.phone || '',
          bio: response.data.user.bio || '',
          sports: response.data.user.sports || [],
          profilePicture: response.data.user.profilePicture || ''
        })
        setIsEditing(false)
        setToastMessage('Profile updated successfully!')
        setToastType('success')
        setShowToast(true)
        await refreshContext()
      }
    } catch (err) {
      console.error('❌ Error updating profile:', err)
      console.error('❌ Error response:', err.response?.data)
      setError(err.response?.data?.error || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <>
        <style>{`
          body { background: #060d1f; margin: 0; }
          .loading-container {
            min-height: 100vh;
            background: linear-gradient(180deg, #060d1f 0%, #0a1628 50%, #071a2e 100%);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .spinner {
            width: 50px;
            height: 50px;
            border: 3px solid rgba(79, 255, 176, 0.1);
            border-top-color: #4fffb0;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        <div className="loading-container">
          <Navbar />
          <div className="spinner"></div>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;900&family=Barlow:wght@400;500;600&display=swap');

        body {
          background: #060d1f;
          margin: 0;
          font-family: 'Barlow', sans-serif;
        }

        .profile-container {
          min-height: 100vh;
          background: linear-gradient(180deg, #060d1f 0%, #0a1628 50%, #071a2e 100%);
          padding-top: 80px;
        }

        .profile-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
        }

        .profile-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: clamp(2.5rem, 6vw, 4rem);
          letter-spacing: -0.02em;
          text-transform: uppercase;
          background: linear-gradient(135deg, #4fffb0, #00d4ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-align: center;
          margin: 0 0 3rem;
          line-height: 1.1;
        }

        .profile-layout {
          display: grid;
          grid-template-columns: 380px 1fr;
          gap: 1.5rem;
          align-items: start;
        }

        @media (max-width: 1024px) {
          .profile-layout {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
        }

        .profile-box {
          background: rgba(10, 22, 40, 0.85);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(79, 255, 176, 0.15);
          border-radius: 20px;
          padding: 1.5rem;
        }

        .profile-pic-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .profile-pic-wrapper {
          position: relative;
          margin-bottom: 1rem;
        }

        .profile-pic {
          width: 140px;
          height: 140px;
          border-radius: 20px;
          object-fit: cover;
          border: 3px solid rgba(79, 255, 176, 0.3);
        }

        .profile-pic-placeholder {
          width: 140px;
          height: 140px;
          border-radius: 20px;
          background: linear-gradient(135deg, rgba(79, 255, 176, 0.3), rgba(16, 185, 129, 0.3));
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 3rem;
          color: #4fffb0;
          border: 3px solid rgba(79, 255, 176, 0.3);
        }

        .profile-pic-button {
          padding: 0.6rem 1.2rem;
          background: rgba(79, 255, 176, 0.1);
          border: 1px solid rgba(79, 255, 176, 0.3);
          border-radius: 10px;
          color: #4fffb0;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.85rem;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .profile-pic-button:hover {
          background: rgba(79, 255, 176, 0.2);
          border-color: rgba(79, 255, 176, 0.5);
        }

        .profile-info {
          width: 100%;
        }

        .profile-field {
          margin-bottom: 1.5rem;
        }

        .profile-field-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.3rem;
        }

        .profile-field-value {
          font-family: 'Barlow', sans-serif;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.4;
        }

        /* Bio Section - Enhanced Visual Hierarchy */
        .bio-section {
          margin-bottom: 2rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .bio-section .profile-field-label {
          font-size: 0.85rem;
          background: linear-gradient(135deg, #ec4899, #a855f7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.75rem;
        }

        .bio-text {
          font-size: 1.05rem;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.85);
          font-style: italic;
        }

        .read-more-btn {
          display: inline-block;
          margin-top: 0.5rem;
          color: #00d4ff;
          font-size: 0.9rem;
          font-style: normal;
          cursor: pointer;
          text-decoration: none;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transition: all 0.2s ease;
        }

        .read-more-btn:hover {
          color: #4fffb0;
        }

        /* Sports Section - Enhanced Visual Hierarchy */
        .sports-section {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .sports-section .profile-field-label {
          font-size: 1rem;
          background: linear-gradient(135deg, #4fffb0, #00d4ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 1rem;
        }

        .sports-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .sport-badge {
          padding: 0.6rem 1rem;
          background: linear-gradient(135deg, rgba(79, 255, 176, 0.15), rgba(0, 212, 255, 0.15));
          border: 1px solid rgba(79, 255, 176, 0.4);
          border-radius: 10px;
          background: linear-gradient(135deg, #4fffb0, #00d4ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          position: relative;
        }

        .sport-badge::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(79, 255, 176, 0.15), rgba(0, 212, 255, 0.15));
          border-radius: 10px;
          z-index: -1;
        }

        .edit-profile-button {
          width: 100%;
          padding: 1rem;
          margin-top: 2rem;
          background: linear-gradient(135deg, rgba(79, 255, 176, 0.9), rgba(16, 185, 129, 0.9));
          border: none;
          border-radius: 12px;
          color: #060d1f;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .edit-profile-button:hover {
          background: linear-gradient(135deg, rgba(79, 255, 176, 1), rgba(16, 185, 129, 1));
          transform: translateY(-2px);
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(10px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .modal-content {
          background: rgba(10, 22, 40, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(79, 255, 176, 0.15);
          border-radius: 20px;
          padding: 2.5rem;
          max-width: 640px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-content-large {
          background: rgba(10, 22, 40, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(79, 255, 176, 0.15);
          border-radius: 20px;
          padding: 2.5rem;
          max-width: 1200px;
          width: 95%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 2rem;
          color: #4fffb0;
          text-transform: uppercase;
          text-align: center;
          margin: 0 0 2rem;
        }

        .form-section {
          margin-bottom: 1.5rem;
        }

        .form-label {
          display: block;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.85);
          text-transform: uppercase;
          letter-spacing: 0.03em;
          margin-bottom: 0.5rem;
        }

        .form-input {
          width: 100%;
          padding: 0.9rem 1rem;
          background: rgba(10, 22, 40, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: #fff;
          font-family: 'Barlow', sans-serif;
          font-size: 0.95rem;
          outline: none;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }

        .form-input:focus {
          border-color: rgba(79, 255, 176, 0.4);
          background: rgba(10, 22, 40, 0.8);
        }

        .form-input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .form-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .form-textarea {
          resize: none;
        }

        .grid-cols-2 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .sports-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 0.75rem;
        }

        .sport-button {
          padding: 0.85rem;
          background: rgba(10, 22, 40, 0.6);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: rgba(255, 255, 255, 0.6);
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .sport-button:hover {
          border-color: rgba(79, 255, 176, 0.3);
          background: rgba(79, 255, 176, 0.05);
        }

        .sport-button.active {
          border-color: rgba(79, 255, 176, 0.6);
          background: rgba(79, 255, 176, 0.15);
          color: #4fffb0;
        }

        .error-box {
          padding: 1rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 10px;
          margin-top: 1.5rem;
        }

        .error-text {
          color: #f87171;
          font-size: 0.9rem;
          font-family: 'Barlow', sans-serif;
        }

        .modal-buttons {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
        }

        .modal-button {
          flex: 1;
          padding: 1rem;
          border: none;
          border-radius: 12px;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .modal-button-cancel {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .modal-button-cancel:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .modal-button-save {
          background: linear-gradient(135deg, rgba(79, 255, 176, 0.9), rgba(16, 185, 129, 0.9));
          color: #060d1f;
        }

        .modal-button-save:hover {
          background: linear-gradient(135deg, rgba(79, 255, 176, 1), rgba(16, 185, 129, 1));
          transform: translateY(-2px);
        }

        .modal-button-save:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .optional-label {
          color: rgba(255, 255, 255, 0.4);
          font-weight: 400;
          text-transform: none;
          font-size: 0.85rem;
        }

        /* Premium Rating Cards */
        .ratings-container {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
        }

        .ratings-grid-3col {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        @media (max-width: 1200px) {
          .ratings-grid-3col {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .ratings-grid-3col {
            grid-template-columns: 1fr;
          }
        }

        .rating-card {
          background: linear-gradient(135deg, rgba(10, 22, 40, 0.6), rgba(10, 22, 40, 0.4));
          border: 1px solid rgba(0, 212, 255, 0.2);
          border-radius: 16px;
          padding: 1.5rem 1.25rem;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .rating-card:hover {
          transform: translateY(-4px);
          border-color: rgba(0, 212, 255, 0.4);
          box-shadow: 0 8px 30px rgba(0, 212, 255, 0.15);
        }


        .rating-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
          position: relative;
          z-index: 1;
        }

        .sport-name {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1.1rem;
          color: rgba(255, 255, 255, 0.9);
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .rating-badge {
          padding: 0.4rem 0.9rem;
          background: rgba(236, 72, 153, 0.15);
          border: 1px solid rgba(236, 72, 153, 0.3);
          border-radius: 20px;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.75rem;
          color: #ec4899;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .rating-display {
          text-align: center;
          margin-bottom: 1rem;
          position: relative;
          z-index: 1;
        }

        .rating-number {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 2.8rem;
          background: linear-gradient(135deg, #4fffb0, #00d4ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1;
          letter-spacing: -0.02em;
        }

        .rating-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-top: 0.25rem;
        }

        .rating-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
          position: relative;
          z-index: 1;
        }

        .stat-item {
          text-align: center;
        }

        .stat-value {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1.1rem;
          color: rgba(255, 255, 255, 0.9);
          line-height: 1;
        }

        .stat-label {
          font-family: 'Barlow', sans-serif;
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 0.25rem;
        }

        .no-ratings {
          grid-column: 1 / -1;
          text-align: center;
          padding: 3rem;
          color: rgba(255, 255, 255, 0.4);
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 1.1rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Rating Graph Styles */
        .graph-container {
          margin-top: 3rem;
          padding-top: 3rem;
          border-top: 1px solid rgba(79, 255, 176, 0.2);
        }

        .graph-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 1.5rem;
          background: linear-gradient(135deg, #ec4899, #a855f7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-transform: uppercase;
          letter-spacing: '-0.01em';
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .sport-tabs {
          display: flex;
          gap: 0.75rem;
          flex-wrap: nowrap;
          justify-content: center;
          margin-bottom: 2rem;
          overflow-x: auto;
          overflow-y: hidden;
        }

        .sport-tabs::-webkit-scrollbar {
          height: 4px;
        }

        .sport-tabs::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }

        .sport-tabs::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.3);
          border-radius: 2px;
        }

        .sport-tab {
          padding: 0.6rem 1.2rem;
          background: rgba(10, 22, 40, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 10px;
          color: rgba(255, 255, 255, 0.6);
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.9rem;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .sport-tab:hover {
          border-color: rgba(79, 255, 176, 0.3);
          background: rgba(79, 255, 176, 0.05);
          color: rgba(255, 255, 255, 0.8);
        }

        .sport-tab.active {
          border-color: rgba(168, 85, 247, 0.6);
          background: rgba(168, 85, 247, 0.15);
          color: #a855f7;
        }

        .graph-canvas {
          position: relative;
          height: 300px;
          background: rgba(10, 22, 40, 0.3);
          border: 1px solid rgba(79, 255, 176, 0.15);
          border-radius: 12px;
          padding: 2rem 1rem 3rem 4rem;
        }

        .graph-y-axis {
          position: absolute;
          left: 0;
          top: 2rem;
          bottom: 3rem;
          width: 4rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: flex-end;
          padding-right: 0.75rem;
        }

        .y-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.4);
        }

        .graph-grid {
          position: absolute;
          left: 4rem;
          right: 1rem;
          top: 2rem;
          bottom: 3rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .grid-line {
          height: 1px;
          background: rgba(255, 255, 255, 0.05);
        }

        .graph-plot {
          position: absolute;
          left: 4rem;
          right: 1rem;
          top: 2rem;
          bottom: 3rem;
        }

        .graph-svg {
          width: 100%;
          height: 100%;
        }

        .graph-line {
          stroke: #00d4ff;
          stroke-width: 2;
          fill: none;
        }

        .graph-dot {
          fill: #00d4ff;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .graph-dot:hover {
          r: 6;
          filter: drop-shadow(0 0 8px rgba(0, 212, 255, 0.6));
        }

        .graph-x-axis {
          position: absolute;
          left: 4rem;
          right: 1rem;
          bottom: 1rem;
          height: 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .x-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.4);
          text-align: center;
        }

        .no-history {
          text-align: center;
          padding: 4rem 2rem;
          color: rgba(255, 255, 255, 0.4);
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Career Stats - Compact Cards */
        .career-stats-section {
          margin-top: 3rem;
        }

        .section-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 1.6rem;
          background: linear-gradient(135deg, #4fffb0, #00d4ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-transform: uppercase;
          letter-spacing: '-0.01em';
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .career-stats-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 1rem;
        }

        .stat-card-compact {
          background: linear-gradient(135deg, rgba(10, 22, 40, 0.6), rgba(10, 22, 40, 0.4));
          border: 1px solid rgba(0, 212, 255, 0.2);
          border-radius: 12px;
          padding: 1.25rem 1rem;
          text-align: center;
          transition: all 0.3s ease;
        }

        .stat-card-compact:hover {
          transform: translateY(-2px);
          border-color: rgba(0, 212, 255, 0.4);
        }

        .stat-value-large {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 2.2rem;
          background: linear-gradient(135deg, #4fffb0, #00d4ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1;
          margin-bottom: 0.5rem;
        }

        .stat-label-compact {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Activity Heatmap - Compact */
        .heatmap-section {
          margin-top: 3rem;
        }

        .heatmap-container {
          background: rgba(10, 22, 40, 0.6);
          border: 1px solid rgba(168, 85, 247, 0.2);
          border-radius: 12px;
          padding: 1.5rem;
          overflow-x: auto;
        }

        .heatmap-grid {
          display: grid;
          grid-template-columns: repeat(53, 12px);
          gap: 3px;
          justify-content: start;
        }

        .heatmap-cell {
          width: 12px;
          height: 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 2px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .heatmap-cell.level-1 {
          background: rgba(0, 212, 255, 0.2);
        }

        .heatmap-cell.level-2 {
          background: rgba(0, 212, 255, 0.4);
        }

        .heatmap-cell.level-3 {
          background: rgba(0, 212, 255, 0.6);
        }

        .heatmap-cell.level-4 {
          background: rgba(0, 212, 255, 0.8);
        }

        .heatmap-cell:hover {
          transform: scale(1.2);
        }

        .heatmap-legend {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 0.5rem;
          margin-top: 1rem;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
        }

        /* Recent Matches - Compact Table */
        .matches-section {
          margin-top: 3rem;
        }

        .match-filters {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
          justify-content: center;
        }

        .filter-btn {
          padding: 0.5rem 1rem;
          background: rgba(10, 22, 40, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.6);
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.85rem;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .filter-btn:hover {
          border-color: rgba(79, 255, 176, 0.3);
          background: rgba(79, 255, 176, 0.05);
        }

        .filter-btn.active {
          border-color: rgba(79, 255, 176, 0.6);
          background: rgba(79, 255, 176, 0.15);
          color: #4fffb0;
        }

        .matches-table {
          width: 100%;
          border-collapse: collapse;
        }

        .matches-table thead {
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .matches-table th {
          padding: 0.75rem 1rem;
          text-align: left;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .matches-table td {
          padding: 1rem;
          font-family: 'Barlow', sans-serif;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.85);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .matches-table tbody tr {
          transition: all 0.2s ease;
        }

        .matches-table tbody tr:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        .result-badge {
          display: inline-block;
          width: 28px;
          height: 28px;
          line-height: 28px;
          text-align: center;
          border-radius: 6px;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 0.85rem;
        }

        .result-badge.win {
          background: rgba(79, 255, 176, 0.15);
          color: #4fffb0;
          border: 1px solid rgba(79, 255, 176, 0.4);
        }

        .result-badge.loss {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.4);
        }

        @media (max-width: 1024px) {
          .profile-layout {
            grid-template-columns: 1fr;
          }

          .ratings-container {
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          }

          .career-stats-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        @media (max-width: 640px) {
          .career-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .matches-table {
            font-size: 0.85rem;
          }

          .matches-table th,
          .matches-table td {
            padding: 0.6rem 0.5rem;
          }
        }

        @media (max-width: 1024px) {
          .profile-layout {
            grid-template-columns: 1fr;
          }

          .ratings-container {
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          }
        }

        @media (max-width: 640px) {
          .modal-content {
            padding: 2rem 1.5rem;
          }

          .grid-cols-2 {
            grid-template-columns: 1fr;
          }

          .sports-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>

      <div className="profile-container">
        <Navbar />
        <div className="profile-content">
          <h1 className="profile-title">YOUR PERFORMANCE, UNLOCKED!</h1>

          <div className="profile-layout">
            {/* Left Box - Profile Info */}
            <div className="profile-box">
              {/* Profile Picture Section */}
              <div className="profile-pic-section">
                <div className="profile-pic-wrapper">
                  {profile?.profilePicture ? (
                    <img
                      src={profile.profilePicture}
                      alt={`${profile.firstName} ${profile.lastName}`}
                      className="profile-pic"
                    />
                  ) : (
                    <div className="profile-pic-placeholder">
                      {getInitials(profile?.firstName, profile?.lastName)}
                    </div>
                  )}
                </div>
                <ImageUpload
                  type="profile"
                  entityId={profile?.id}
                  currentImage={profile?.profilePicture}
                  hidePreview={true}
                  onImageUploaded={(data) => {
                    setProfile({ ...profile, profilePicture: data.user.profilePicture })
                    setFormData({ ...formData, profilePicture: data.user.profilePicture })
                    setToastMessage('Profile picture updated!')
                    setToastType('success')
                    setShowToast(true)
                  }}
                  customButton={
                    <button className="profile-pic-button">
                      {profile?.profilePicture ? 'Edit Profile Pic' : 'Add Photo'}
                    </button>
                  }
                />
              </div>

              {/* Profile Information */}
              <div className="profile-info">
                {/* Bio Section - Top Priority */}
                {profile?.bio && (
                  <div className="profile-field bio-section">
                    <div className="profile-field-label">About Me</div>
                    <div className="profile-field-value bio-text">
                      {profile.bio.length > BIO_CHAR_LIMIT && !bioExpanded
                        ? `${profile.bio.substring(0, BIO_CHAR_LIMIT)}...`
                        : profile.bio}
                      {profile.bio.length > BIO_CHAR_LIMIT && (
                        <span
                          className="read-more-btn"
                          onClick={() => setBioExpanded(!bioExpanded)}
                        >
                          {bioExpanded ? ' Read Less' : ' Read More'}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Name */}
                <div className="profile-field">
                  <div className="profile-field-label">Name</div>
                  <div className="profile-field-value">
                    {profile?.firstName} {profile?.lastName}
                  </div>
                </div>

                {/* Email */}
                <div className="profile-field">
                  <div className="profile-field-label">Email</div>
                  <div className="profile-field-value">{profile?.email}</div>
                </div>

                {/* Date of Birth */}
                <div className="profile-field">
                  <div className="profile-field-label">Date of Birth</div>
                  <div className="profile-field-value">{formatDate(profile?.dob)}</div>
                </div>

                {/* Gender */}
                <div className="profile-field">
                  <div className="profile-field-label">Gender</div>
                  <div className="profile-field-value">{profile?.gender || 'Not set'}</div>
                </div>

                {/* City */}
                <div className="profile-field">
                  <div className="profile-field-label">City</div>
                  <div className="profile-field-value">{profile?.city || 'Not set'}</div>
                </div>

                {/* State */}
                {profile?.state && (
                  <div className="profile-field">
                    <div className="profile-field-label">State</div>
                    <div className="profile-field-value">{profile.state}</div>
                  </div>
                )}

                {/* Locality */}
                {profile?.locality && (
                  <div className="profile-field">
                    <div className="profile-field-label">Locality/Area</div>
                    <div className="profile-field-value">{profile.locality}</div>
                  </div>
                )}

                {/* Phone */}
                {profile?.phone && (
                  <div className="profile-field">
                    <div className="profile-field-label">Phone</div>
                    <div className="profile-field-value">{profile.phone}</div>
                  </div>
                )}

                {/* Sports - Visual Hierarchy */}
                <div className="profile-field sports-section">
                  <div className="profile-field-label">My Sports</div>
                  <div className="sports-badges">
                    {profile?.sports && profile.sports.length > 0 ? (
                      profile.sports.map((sport, index) => (
                        <span key={index} className="sport-badge">{sport}</span>
                      ))
                    ) : (
                      <div className="profile-field-value">No sports selected</div>
                    )}
                  </div>
                </div>

                {/* Privacy Toggle */}
                <div className="profile-field privacy-section" style={{
                  marginTop: '1.5rem',
                  padding: '1.25rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem'
                  }}>
                    <div>
                      <div className="profile-field-label" style={{ marginBottom: '0.25rem' }}>Profile Privacy</div>
                      <div style={{
                        fontSize: '0.875rem',
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontFamily: "'Barlow Condensed', sans-serif"
                      }}>
                        {profile?.isProfilePrivate ? 'People need to send follow requests' : 'Anyone can follow you instantly'}
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          const newPrivacy = !profile?.isProfilePrivate
                          const response = await api.patch('/users/profile-privacy', {
                            isProfilePrivate: newPrivacy
                          })
                          if (response.data.success) {
                            setProfile({ ...profile, isProfilePrivate: newPrivacy })
                            setToastMessage(`Profile is now ${newPrivacy ? 'Private' : 'Public'}`)
                            setToastType('success')
                            setShowToast(true)
                          }
                        } catch (err) {
                          console.error('Error updating privacy:', err)
                          setToastMessage('Failed to update privacy setting')
                          setToastType('error')
                          setShowToast(true)
                        }
                      }}
                      style={{
                        position: 'relative',
                        width: '56px',
                        height: '32px',
                        borderRadius: '16px',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        background: profile?.isProfilePrivate
                          ? 'linear-gradient(135deg, #ec4899, #f472b6)'
                          : 'rgba(255, 255, 255, 0.2)',
                        boxShadow: profile?.isProfilePrivate
                          ? '0 4px 15px rgba(236, 72, 153, 0.4)'
                          : 'none'
                      }}
                    >
                      <div style={{
                        position: 'absolute',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#fff',
                        top: '4px',
                        left: profile?.isProfilePrivate ? '28px' : '4px',
                        transition: 'left 0.3s ease',
                        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)'
                      }} />
                    </button>
                  </div>
                </div>

                <button
                  className="edit-profile-button"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </button>

                {/* Performance Diamond */}
                {profile && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <PlayerRadarCard userId={profile.id} />
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Sport Ratings */}
            <div className="profile-box">
              <h2 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 900,
                fontSize: '1.5rem',
                background: 'linear-gradient(135deg, #4fffb0, #00d4ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textTransform: 'uppercase',
                letterSpacing: '-0.01em',
                marginBottom: '2rem',
                textAlign: 'center'
              }}>
                Sport Ratings
              </h2>

              <div className="ratings-container">
                {!ratings || ratings.length === 0 ? (
                  <div className="no-ratings">
                    No ratings yet. Play matches to build your rating!
                  </div>
                ) : (
                  ratings.map((sport) => (
                    <div key={sport.sportId} className="sport-rating-card" style={{
                      background: 'rgba(6, 13, 31, 0.6)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(79, 255, 176, 0.2)',
                      borderRadius: '16px',
                      padding: '1.5rem',
                      marginBottom: '1.5rem'
                    }}>
                      <h3 style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 700,
                        fontSize: '1.3rem',
                        color: '#4fffb0',
                        textTransform: 'uppercase',
                        marginBottom: '1rem'
                      }}>
                        {getSportDisplayName(sport.sportId)}
                      </h3>

                      <div className="ratings-grid-3col">
                        {/* Singles */}
                        <div className="category-card" style={{
                          background: 'rgba(79, 255, 176, 0.05)',
                          border: '1px solid rgba(79, 255, 176, 0.2)',
                          borderRadius: '12px',
                          padding: '1rem'
                        }}>
                          <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '0.5rem' }}>
                            SINGLES
                          </div>
                          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', marginBottom: '0.25rem' }}>
                            {sport.singles.rating}
                          </div>
                          <div style={{ fontSize: '1rem', color: '#4fffb0', marginBottom: '0.5rem' }}>
                            {sport.singles.rank && sport.singles.totalRankedPlayers
                              ? `#${sport.singles.rank} of ${sport.singles.totalRankedPlayers}`
                              : 'Unranked'}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                            {sport.singles.wins}W-{sport.singles.losses}L
                            {sport.singles.streak && ` • ${sport.singles.streak}`}
                          </div>
                        </div>

                        {/* Doubles */}
                        <div className="category-card" style={{
                          background: 'rgba(79, 255, 176, 0.05)',
                          border: '1px solid rgba(79, 255, 176, 0.2)',
                          borderRadius: '12px',
                          padding: '1rem'
                        }}>
                          <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '0.5rem' }}>
                            DOUBLES
                          </div>
                          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', marginBottom: '0.25rem' }}>
                            {sport.doubles.rating}
                          </div>
                          <div style={{ fontSize: '1.1rem', color: '#4fffb0', marginBottom: '0.5rem' }}>
                            {sport.doubles.rank && sport.doubles.totalRankedPlayers
                              ? `#${sport.doubles.rank} of ${sport.doubles.totalRankedPlayers}`
                              : 'Unranked'}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                            {sport.doubles.wins}W-{sport.doubles.losses}L
                            {sport.doubles.streak && ` • ${sport.doubles.streak}`}
                          </div>
                        </div>

                        {/* Mixed Doubles */}
                        <div className="category-card" style={{
                          background: 'rgba(79, 255, 176, 0.05)',
                          border: '1px solid rgba(79, 255, 176, 0.2)',
                          borderRadius: '12px',
                          padding: '1rem'
                        }}>
                          <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '0.5rem' }}>
                            MIXED DOUBLES
                          </div>
                          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', marginBottom: '0.25rem' }}>
                            {sport.mixedDoubles.rating}
                          </div>
                          <div style={{ fontSize: '1.1rem', color: '#4fffb0', marginBottom: '0.5rem' }}>
                            {sport.mixedDoubles.rank && sport.mixedDoubles.totalRankedPlayers
                              ? `#${sport.mixedDoubles.rank} of ${sport.mixedDoubles.totalRankedPlayers}`
                              : 'Unranked'}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                            {sport.mixedDoubles.wins}W-{sport.mixedDoubles.losses}L
                            {sport.mixedDoubles.streak && ` • ${sport.mixedDoubles.streak}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Rating History Graph */}
              {ratings.length > 0 && (
                <div className="graph-container">
                  <div className="graph-title">Rating Progress</div>

                  {/* Sport Tabs */}
                  <div className="sport-tabs">
                    {ratings.map((rating) => (
                      <button
                        key={rating.sportId}
                        className={`sport-tab ${selectedGraphSport === rating.sportId ? 'active' : ''}`}
                        onClick={() => setSelectedGraphSport(rating.sportId)}
                      >
                        {getSportDisplayName(rating.sportId)}
                      </button>
                    ))}
                  </div>

                  {/* Graph Canvas */}
                  {loadingHistory ? (
                    <div className="no-history">Loading...</div>
                  ) : ratingHistory.length === 0 ? (
                    <div className="no-history">
                      No matches played yet to show rating variation for {getSportDisplayName(selectedGraphSport)}
                    </div>
                  ) : (
                    <div className="graph-canvas">
                      {/* Y-Axis */}
                      <div className="graph-y-axis">
                        {(() => {
                          const ratings = ratingHistory.map(h => h.rating)
                          const maxRating = Math.max(...ratings)
                          const minRating = Math.min(...ratings)
                          const range = maxRating - minRating
                          const padding = Math.max(50, range * 0.2)
                          const yMax = Math.ceil((maxRating + padding) / 50) * 50
                          const yMin = Math.floor((minRating - padding) / 50) * 50
                          const steps = 5
                          const yLabels = []
                          for (let i = 0; i < steps; i++) {
                            yLabels.push(Math.round(yMax - (yMax - yMin) * (i / (steps - 1))))
                          }
                          return yLabels.map((label, i) => (
                            <div key={i} className="y-label">{label}</div>
                          ))
                        })()}
                      </div>

                      {/* Grid Lines */}
                      <div className="graph-grid">
                        {[0, 1, 2, 3, 4].map(i => (
                          <div key={i} className="grid-line" />
                        ))}
                      </div>

                      {/* Plot Area */}
                      <div className="graph-plot">
                        <svg className="graph-svg" preserveAspectRatio="none" viewBox="0 0 100 100">
                          {(() => {
                            const ratings = ratingHistory.map(h => h.rating)
                            const maxRating = Math.max(...ratings)
                            const minRating = Math.min(...ratings)
                            const range = maxRating - minRating
                            const padding = Math.max(50, range * 0.2)
                            const yMax = Math.ceil((maxRating + padding) / 50) * 50
                            const yMin = Math.floor((minRating - padding) / 50) * 50
                            const yRange = yMax - yMin

                            const points = ratingHistory.map((point, index) => {
                              const x = (index / (ratingHistory.length - 1 || 1)) * 100
                              const y = 100 - ((point.rating - yMin) / yRange) * 100
                              return { x, y, ...point }
                            })

                            const pathData = points.map((p, i) =>
                              `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
                            ).join(' ')

                            return (
                              <>
                                {/* Line */}
                                <path d={pathData} className="graph-line" />
                                {/* Dots */}
                                {points.map((point, index) => (
                                  <circle
                                    key={index}
                                    cx={point.x}
                                    cy={point.y}
                                    r="4"
                                    className="graph-dot"
                                  >
                                    <title>
                                      {formatGraphDate(point.date)}: {point.rating}
                                      {point.change !== 0 && ` (${point.change > 0 ? '+' : ''}${point.change})`}
                                    </title>
                                  </circle>
                                ))}
                              </>
                            )
                          })()}
                        </svg>
                      </div>

                      {/* X-Axis */}
                      <div className="graph-x-axis">
                        {(() => {
                          const numLabels = Math.min(6, ratingHistory.length)
                          const labels = []
                          for (let i = 0; i < numLabels; i++) {
                            const index = Math.floor((i / (numLabels - 1 || 1)) * (ratingHistory.length - 1))
                            labels.push(
                              <div key={i} className="x-label">
                                {formatGraphDate(ratingHistory[index].date)}
                              </div>
                            )
                          }
                          return labels
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Career Stats - Compact */}
          {careerStats && (
            <div className="career-stats-section profile-box" style={{ marginTop: '2rem' }}>
              <h3 className="section-title">Career Highlights</h3>
              <div className="career-stats-grid">
                <div className="stat-card-compact">
                  <div className="stat-value-large">{careerStats.totalMatches}</div>
                  <div className="stat-label-compact">Matches</div>
                </div>
                <div className="stat-card-compact">
                  <div className="stat-value-large">{careerStats.wins}</div>
                  <div className="stat-label-compact">Wins</div>
                </div>
                <div className="stat-card-compact">
                  <div className="stat-value-large">{careerStats.winRate}%</div>
                  <div className="stat-label-compact">Win Rate</div>
                </div>
                <div className="stat-card-compact">
                  <div className="stat-value-large" style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                    {achievementSummary.gold > 0 && <span>🥇 {achievementSummary.gold}</span>}
                    {achievementSummary.silver > 0 && <span>🥈 {achievementSummary.silver}</span>}
                    {achievementSummary.bronze > 0 && <span>🥉 {achievementSummary.bronze}</span>}
                    {achievementSummary.total === 0 && <span>—</span>}
                  </div>
                  <div className="stat-label-compact">Titles</div>
                </div>
                <div className="stat-card-compact">
                  <div className="stat-value-large">{careerStats.currentStreak || '—'}</div>
                  <div className="stat-label-compact">Streak</div>
                </div>
                <div className="stat-card-compact">
                  <div className="stat-value-large">{careerStats.highestRating}</div>
                  <div className="stat-label-compact">Peak Rating</div>
                </div>
                <div className="stat-card-compact">
                  <div className="stat-value-large">
                    {careerStats.bestRank ? `#${careerStats.bestRank}` : '—'}
                  </div>
                  <div className="stat-label-compact">Best Rank</div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="profile-tabs" style={{ marginTop: '2rem', borderBottom: '2px solid #e5e7eb' }}>
            <button
              className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
              style={{
                padding: '12px 24px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: activeTab === 'overview' ? '600' : '400',
                color: activeTab === 'overview' ? '#1B4332' : '#6b7280',
                borderBottom: activeTab === 'overview' ? '3px solid #1B4332' : '3px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              Overview
            </button>
            <button
              className={`tab-btn ${activeTab === 'achievements' ? 'active' : ''}`}
              onClick={() => setActiveTab('achievements')}
              style={{
                padding: '12px 24px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: activeTab === 'achievements' ? '600' : '400',
                color: activeTab === 'achievements' ? '#1B4332' : '#6b7280',
                borderBottom: activeTab === 'achievements' ? '3px solid #1B4332' : '3px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              Achievements 🏆
            </button>
          </div>

          {/* Overview Tab Content */}
          {activeTab === 'overview' && (
            <>
              {/* Activity Heatmap - Compact */}
              <div className="heatmap-section profile-box" style={{ marginTop: '2rem' }}>
            <h3 className="section-title">Activity Heatmap</h3>
            <div className="heatmap-container">
              <div className="heatmap-grid">
                {(() => {
                  const cells = []
                  const today = new Date()
                  for (let i = 364; i >= 0; i--) {
                    const date = new Date(today)
                    date.setDate(date.getDate() - i)
                    const dateStr = date.toISOString().split('T')[0]
                    const count = activityHeatmap[dateStr] || 0

                    let levelClass = ''
                    if (count === 0) levelClass = ''
                    else if (count === 1) levelClass = 'level-1'
                    else if (count === 2) levelClass = 'level-2'
                    else if (count === 3) levelClass = 'level-3'
                    else levelClass = 'level-4'

                    cells.push(
                      <div
                        key={dateStr}
                        className={`heatmap-cell ${levelClass}`}
                        title={`${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${count} match${count !== 1 ? 'es' : ''}`}
                      />
                    )
                  }
                  return cells
                })()}
              </div>
              <div className="heatmap-legend">
                <span>Less</span>
                <div className="heatmap-cell" />
                <div className="heatmap-cell level-1" />
                <div className="heatmap-cell level-2" />
                <div className="heatmap-cell level-3" />
                <div className="heatmap-cell level-4" />
                <span>More</span>
              </div>
            </div>
          </div>

          {/* Recent Matches - Compact */}
          <div className="matches-section profile-box" style={{ marginTop: '2rem' }}>
            <h3 className="section-title">Recent Matches</h3>

            {/* Sport Filters */}
            <div className="match-filters">
              <button
                className={`filter-btn ${selectedMatchSport === 'all' ? 'active' : ''}`}
                onClick={() => handleMatchSportFilter('all')}
              >
                All Sports
              </button>
              {ratings.map(rating => (
                <button
                  key={rating.sportId}
                  className={`filter-btn ${selectedMatchSport === rating.sportId ? 'active' : ''}`}
                  onClick={() => handleMatchSportFilter(rating.sportId)}
                >
                  {getSportDisplayName(rating.sportId)}
                </button>
              ))}
            </div>

            {recentMatches.length === 0 ? (
              <div className="no-history">No matches yet</div>
            ) : (
              <table className="matches-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Sport</th>
                    <th>Opponent</th>
                    <th>Score</th>
                    <th>Tournament</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentMatches.map((match, index) => (
                    <tr key={index}>
                      <td>
                        <div className={`result-badge ${match.result === 'W' || match.result === 'WIN' ? 'win' : 'loss'}`}>
                          {match.result === 'WIN' ? 'W' : match.result === 'LOSS' ? 'L' : match.result}
                        </div>
                      </td>
                      <td>{getSportDisplayName(match.sportId)}</td>
                      <td>{match.opponent}</td>
                      <td style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600 }}>
                        {match.score}
                      </td>
                      <td style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        {match.tournament}
                      </td>
                      <td style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.85rem' }}>
                        {getRelativeTime(match.date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {allMatches.length > 10 && (
              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <button
                  onClick={() => setShowAllMatches(true)}
                  style={{
                    padding: '0.75rem 2rem',
                    background: 'linear-gradient(135deg, rgba(79, 255, 176, 0.2), rgba(0, 212, 255, 0.2))',
                    border: '1px solid rgba(79, 255, 176, 0.4)',
                    borderRadius: '10px',
                    color: '#4fffb0',
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, rgba(79, 255, 176, 0.3), rgba(0, 212, 255, 0.3))'
                    e.target.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, rgba(79, 255, 176, 0.2), rgba(0, 212, 255, 0.2))'
                    e.target.style.transform = 'translateY(0)'
                  }}
                >
                  View All Matches
                </button>
              </div>
            )}
          </div>
            </>
          )}

          {/* Achievements Tab Content */}
          {activeTab === 'achievements' && (
            <div className="achievements-section profile-box" style={{ marginTop: '2rem' }}>
              <h3 className="section-title">🏆 My Achievements</h3>

              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '2rem' }}>
                <div style={{ background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem' }}>🥇</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff', marginTop: '8px' }}>{achievementSummary.gold}</div>
                  <div style={{ fontSize: '0.9rem', color: '#fff', opacity: 0.9 }}>Gold Medals</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem' }}>🥈</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff', marginTop: '8px' }}>{achievementSummary.silver}</div>
                  <div style={{ fontSize: '0.9rem', color: '#fff', opacity: 0.9 }}>Silver Medals</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, #CD7F32 0%, #A0522D 100%)', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem' }}>🥉</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff', marginTop: '8px' }}>{achievementSummary.bronze}</div>
                  <div style={{ fontSize: '0.9rem', color: '#fff', opacity: 0.9 }}>Bronze Medals</div>
                </div>
              </div>

              {/* Achievement List */}
              {achievements.length === 0 ? (
                <div className="no-history" style={{ padding: '3rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏅</div>
                  <p>No achievements yet. Win tournaments to earn medals!</p>
                </div>
              ) : (
                <div>
                  {Object.entries(
                    achievements.reduce((acc, achievement) => {
                      const year = new Date(achievement.wonAt).getFullYear()
                      if (!acc[year]) acc[year] = []
                      acc[year].push(achievement)
                      return acc
                    }, {})
                  )
                    .sort(([yearA], [yearB]) => yearB - yearA)
                    .map(([year, yearAchievements]) => (
                      <div key={year} style={{ marginBottom: '2rem' }}>
                        <h4 style={{ fontSize: '1.3rem', fontWeight: '600', color: '#1B4332', marginBottom: '1rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>
                          {year}
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {yearAchievements
                            .sort((a, b) => a.position - b.position)
                            .map((achievement) => {
                              const medal = achievement.position === 1 ? '🥇' : achievement.position === 2 ? '🥈' : '🥉'
                              const sportName = achievement.event.sportId.charAt(0).toUpperCase() + achievement.event.sportId.slice(1).replace('-', ' ')
                              const category = achievement.event.format.replace('_', ' ')
                              const date = new Date(achievement.wonAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

                              return (
                                <div
                                  key={achievement.id}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    padding: '16px',
                                    background: '#f9fafb',
                                    borderRadius: '8px',
                                    border: '1px solid #e5e7eb'
                                  }}
                                >
                                  <div style={{ fontSize: '2.5rem' }}>{medal}</div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1f2937' }}>
                                      {achievement.tournament.name}
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '4px' }}>
                                      {achievement.event.name} • {sportName} • {category}
                                    </div>
                                  </div>
                                  <div style={{ fontSize: '0.85rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                                    {date}, {year}
                                  </div>
                                </div>
                              )
                            })}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* View All Matches Modal */}
        {showAllMatches && (
          <div className="modal-overlay" onClick={() => setShowAllMatches(false)}>
            <div className="modal-content-large" onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="modal-title">All Matches</h2>
                <button
                  onClick={() => setShowAllMatches(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    padding: '0.5rem'
                  }}
                >
                  ×
                </button>
              </div>

              {/* Sport Filter */}
              <div className="sport-filters" style={{ marginBottom: '1.5rem' }}>
                <button
                  onClick={() => handleMatchSportFilter('all')}
                  className={`sport-tab ${selectedMatchSport === 'all' ? 'active' : ''}`}
                >
                  All Sports
                </button>
                {ratings.map(rating => (
                  <button
                    key={rating.sportId}
                    onClick={() => handleMatchSportFilter(rating.sportId)}
                    className={`sport-tab ${selectedMatchSport === rating.sportId ? 'active' : ''}`}
                  >
                    {getSportDisplayName(rating.sportId)}
                  </button>
                ))}
              </div>

              <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                <table className="matches-table">
                  <thead>
                    <tr>
                      <th>Result</th>
                      <th>Sport</th>
                      <th>Opponent</th>
                      <th>Score</th>
                      <th>Tournament</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allMatches.map((match, index) => (
                      <tr key={index}>
                        <td>
                          <div className={`result-badge ${match.result === 'W' || match.result === 'WIN' ? 'win' : 'loss'}`}>
                            {match.result === 'WIN' ? 'W' : match.result === 'LOSS' ? 'L' : match.result}
                          </div>
                        </td>
                        <td>{getSportDisplayName(match.sportId)}</td>
                        <td>{match.opponent}</td>
                        <td style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600 }}>
                          {match.score}
                        </td>
                        <td style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                          {match.tournament}
                        </td>
                        <td style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.85rem' }}>
                          {getRelativeTime(match.date)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Edit Profile Modal */}
        {isEditing && (
          <div className="modal-overlay" onClick={() => setIsEditing(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2 className="modal-title">Edit Profile</h2>

              <div className="grid-cols-2">
                <div className="form-section">
                  <label className="form-label">First Name *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-section">
                  <label className="form-label">Last Name *</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-section">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="form-input"
                />
              </div>

              <div className="grid-cols-2">
                <div className="form-section">
                  <label className="form-label">Date of Birth *</label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    max={new Date().toISOString().split('T')[0]}
                    className="form-input"
                  />
                </div>

                <div className="form-section">
                  <label className="form-label">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="form-input"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div className="form-section">
                <LocationSelector
                  city={formData.city}
                  state={formData.state}
                  locality={formData.locality}
                  onLocationChange={(location) => setFormData({
                    ...formData,
                    city: location.city,
                    state: location.state,
                    locality: location.locality,
                    latitude: location.latitude,
                    longitude: location.longitude
                  })}
                  darkMode={true}
                />
              </div>

              <div className="form-section">
                <label className="form-label">Phone <span className="optional-label">(optional)</span></label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="form-input"
                />
              </div>

              <div className="form-section">
                <label className="form-label">
                  Sports you play <span className="optional-label">(select any)</span>
                </label>
                <div className="sports-grid">
                  {sportsList.map(sport => (
                    <button
                      key={sport}
                      type="button"
                      onClick={() => toggleSport(sport)}
                      className={`sport-button ${formData.sports.includes(sport) ? 'active' : ''}`}
                    >
                      {sport}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-section">
                <label className="form-label">
                  Bio <span className="optional-label">(optional)</span>
                  <span style={{
                    float: 'right',
                    fontSize: '0.85rem',
                    color: formData.bio?.length > 500 ? '#ef4444' : 'rgba(255, 255, 255, 0.4)',
                    fontWeight: 600
                  }}>
                    {formData.bio?.length || 0}/500
                  </span>
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) {
                      setFormData({ ...formData, bio: e.target.value })
                    }
                  }}
                  rows={3}
                  placeholder="A few words about yourself and your sports journey..."
                  className="form-input form-textarea"
                  maxLength={500}
                />
              </div>

              {error && (
                <div className="error-box">
                  <p className="error-text">{error}</p>
                </div>
              )}

              <div className="modal-buttons">
                <button
                  className="modal-button modal-button-cancel"
                  onClick={() => {
                    setIsEditing(false)
                    setError('')
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  className="modal-button modal-button-save"
                  onClick={handleSaveProfile}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {showToast && (
          <Toast
            message={toastMessage}
            type={toastType}
            onClose={() => setShowToast(false)}
          />
        )}
      </div>
    </>
  )
}

export default ProfilePage
