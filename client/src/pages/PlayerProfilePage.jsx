import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import api from '../services/api'

const PlayerProfilePage = () => {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
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
  const [followStatus, setFollowStatus] = useState({ isFollowing: false, isPending: false })
  const [loadingFollow, setLoadingFollow] = useState(false)

  const BIO_CHAR_LIMIT = 150
  const isOwnProfile = authUser?.id === userId

  // Check if content should be visible
  // Visible if: not private OR (private AND following) OR own profile
  const canViewContent = !profile?.isProfilePrivate || followStatus.isFollowing || isOwnProfile

  useEffect(() => {
    // If viewing own profile, redirect to /profile
    if (isOwnProfile) {
      navigate('/profile')
      return
    }

    const loadData = async () => {
      await fetchProfileData()
      if (authUser && !isOwnProfile) {
        await fetchFollowStatus()
      }
    }
    loadData()
  }, [userId, isOwnProfile, authUser])

  const fetchFollowStatus = async () => {
    try {
      const response = await api.get(`/follows/status/${userId}`)
      if (response.data.success) {
        setFollowStatus({
          isFollowing: response.data.isFollowing,
          isPending: response.data.isPending
        })
      }
    } catch (err) {
      console.error('Error fetching follow status:', err)
    }
  }

  const handleFollow = async () => {
    if (!authUser) {
      alert('Please log in to follow users')
      return
    }

    setLoadingFollow(true)

    try {
      if (followStatus.isFollowing) {
        // Unfollow - update UI first
        setFollowStatus({ isFollowing: false, isPending: false })
        await api.delete(`/follows/${userId}`)
      } else {
        // Follow or send request - update UI immediately
        // Check if profile is private to show correct state
        const isPending = profile?.isProfilePrivate
        setFollowStatus({
          isFollowing: !isPending,
          isPending: isPending
        })

        const response = await api.post('/follows', { followingId: userId })
        if (response.data.success) {
          // Confirm the state based on response
          if (response.data.message.includes('request')) {
            setFollowStatus({ isFollowing: false, isPending: true })
          } else {
            setFollowStatus({ isFollowing: true, isPending: false })
            // If instant follow (public profile), reload profile data to show content
            fetchProfileData()
          }
        }
      }
    } catch (err) {
      console.error('Error toggling follow:', err)
      // Revert on error
      setFollowStatus({ isFollowing: false, isPending: false })
      alert(err.response?.data?.error || 'Failed to update follow status')
    } finally {
      setLoadingFollow(false)
    }
  }

  const fetchProfileData = async () => {
    try {
      setLoading(true)

      // Fetch user info
      const userResponse = await api.get(`/users/players/${userId}`)
      const playerData = userResponse.data.player || userResponse.data.user
      setProfile(playerData)

      // Update follow status from profile data if available
      if (playerData.isFollowing !== undefined) {
        setFollowStatus(prev => ({
          ...prev,
          isFollowing: playerData.isFollowing
        }))
      }

      // Fetch ratings
      try {
        const ratingsResponse = await api.get(`/ratings/${userId}`)
        if (ratingsResponse.data.success) {
          const ratingsData = ratingsResponse.data.ratings || []
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
        console.log('Ratings not available:', err)
        setRatings([])
      }

      // Fetch career stats
      try {
        const statsResponse = await api.get(`/users/${userId}/profile-stats`)
        if (statsResponse.data.success) {
          setCareerStats(statsResponse.data.careerStats)
        }
      } catch (err) {
        console.log('Career stats not available:', err)
      }

      // Fetch recent matches
      try {
        const matchesResponse = await api.get(`/users/${userId}/match-history`)
        if (matchesResponse.data.success) {
          setRecentMatches(matchesResponse.data.matchHistory.slice(0, 10))
          setAllMatches(matchesResponse.data.matchHistory)
        }
      } catch (err) {
        console.log('Matches not available:', err)
      }

      // Fetch activity heatmap
      try {
        const heatmapResponse = await api.get(`/users/${userId}/activity-heatmap`)
        if (heatmapResponse.data.success) {
          setActivityHeatmap(heatmapResponse.data.activity)
        }
      } catch (err) {
        console.log('Heatmap not available:', err)
      }

      setLoading(false)
    } catch (error) {
      console.error('Error fetching profile data:', error)
      setLoading(false)
    }
  }

  const fetchRatingHistory = async (sportId) => {
    if (!sportId) return
    setLoadingHistory(true)
    try {
      const response = await api.get(`/ratings/${userId}/${sportId}/history`)
      if (response.data.success) {
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

  const handleMatchSportFilter = (sportId) => {
    setSelectedMatchSport(sportId)
    // Fetch filtered matches
    const query = sportId === 'all' ? '' : `?sportId=${sportId}`
    api.get(`/users/${userId}/match-history${query}`)
      .then(response => {
        if (response.data.success) {
          setRecentMatches(response.data.matchHistory.slice(0, 10))
          setAllMatches(response.data.matchHistory)
        }
      })
      .catch(err => console.error('Error fetching filtered matches:', err))
  }

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

  if (!profile) {
    return (
      <>
        <style>{`
          body { background: #060d1f; margin: 0; }
          .error-container {
            min-height: 100vh;
            background: linear-gradient(180deg, #060d1f 0%, #0a1628 50%, #071a2e 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-family: 'Barlow Condensed', sans-serif;
            font-size: 1.5rem;
          }
        `}</style>
        <Navbar />
        <div className="error-container">Player not found</div>
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
          grid-template-columns: 400px 1fr;
          gap: 2rem;
          align-items: start;
        }

        .profile-box {
          background: rgba(10, 22, 40, 0.85);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(79, 255, 176, 0.15);
          border-radius: 20px;
          padding: 2rem;
          overflow: hidden;
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

        .profile-info {
          width: 100%;
        }

        .profile-field {
          margin-bottom: 1.5rem;
        }

        .profile-field-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.4rem;
        }

        .profile-field-value {
          font-family: 'Barlow', sans-serif;
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.5;
        }

        .bio-section {
          margin-bottom: 2rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .bio-section .profile-field-label {
          font-size: 1rem;
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

        .ratings-container {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .rating-card {
          background: rgba(10, 22, 40, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 15px;
          padding: 1.25rem;
          transition: all 0.3s ease;
        }

        .rating-card:hover {
          border-color: rgba(79, 255, 176, 0.3);
          transform: translateY(-2px);
        }

        .rating-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .sport-name {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.8);
          text-transform: uppercase;
        }

        .rating-badge {
          padding: 0.25rem 0.6rem;
          background: rgba(79, 255, 176, 0.1);
          border: 1px solid rgba(79, 255, 176, 0.3);
          border-radius: 12px;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          font-size: 0.7rem;
          color: #4fffb0;
          text-transform: uppercase;
        }

        .rating-display {
          text-align: center;
          margin-bottom: 1rem;
        }

        .rating-number {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 2.5rem;
          color: #4fffb0;
          text-shadow: 0 0 20px rgba(79, 255, 176, 0.5);
          line-height: 1;
        }

        .rating-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 0.25rem;
        }

        .rating-stats {
          display: flex;
          justify-content: space-around;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .stat-item {
          text-align: center;
        }

        .stat-value {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.9);
        }

        .stat-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 0.65rem;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 0.25rem;
        }

        .no-ratings {
          grid-column: 1 / -1;
          text-align: center;
          padding: 2rem;
          color: rgba(255, 255, 255, 0.5);
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 1rem;
        }

        .graph-container {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          overflow: hidden;
        }

        .graph-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 1.5rem;
          background: linear-gradient(135deg, #4fffb0, #00d4ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-transform: uppercase;
          margin-bottom: 1rem;
          text-align: center;
        }

        .sport-tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .sport-tab {
          padding: 0.6rem 1.2rem;
          background: rgba(10, 22, 40, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: rgba(255, 255, 255, 0.6);
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.85rem;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .sport-tab:hover {
          border-color: rgba(79, 255, 176, 0.3);
          background: rgba(79, 255, 176, 0.05);
        }

        .sport-tab.active {
          border-color: rgba(79, 255, 176, 0.6);
          background: rgba(79, 255, 176, 0.15);
          color: #4fffb0;
        }

        .no-history {
          text-align: center;
          padding: 3rem 2rem;
          color: rgba(255, 255, 255, 0.5);
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 1rem;
        }

        .graph-canvas {
          position: relative;
          display: grid;
          grid-template-columns: 40px 1fr;
          grid-template-rows: 1fr 30px;
          gap: 0.5rem;
          height: 300px;
          overflow: hidden;
          max-width: 100%;
        }

        .graph-y-axis {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 10px 0;
        }

        .y-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
          text-align: right;
        }

        .graph-grid {
          position: absolute;
          top: 0;
          left: 40px;
          right: 0;
          bottom: 30px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 10px 0;
        }

        .grid-line {
          height: 1px;
          background: rgba(255, 255, 255, 0.05);
        }

        .graph-plot {
          position: relative;
          grid-column: 2;
          grid-row: 1;
          overflow: hidden;
          max-width: 100%;
        }

        .graph-svg {
          width: 100%;
          height: 100%;
          max-width: 100%;
          max-height: 100%;
          display: block;
        }

        .graph-line {
          fill: none;
          stroke: url(#lineGradient);
          stroke-width: 0.5;
          stroke-linecap: round;
          stroke-linejoin: round;
          vector-effect: non-scaling-stroke;
        }

        .graph-dot {
          fill: #4fffb0;
          stroke: rgba(10, 22, 40, 0.9);
          stroke-width: 0.5;
          cursor: pointer;
          transition: all 0.2s ease;
          vector-effect: non-scaling-stroke;
        }

        .graph-dot:hover {
          r: 2.5;
          fill: #00d4ff;
        }

        .graph-x-axis {
          grid-column: 2;
          grid-row: 2;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .x-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.5);
          text-align: center;
        }

        .section-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 1.8rem;
          background: linear-gradient(135deg, #4fffb0, #00d4ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-transform: uppercase;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .career-stats-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 1rem;
        }

        .stat-card-compact {
          background: rgba(10, 22, 40, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1rem;
          text-align: center;
          transition: all 0.2s ease;
        }

        .stat-card-compact:hover {
          border-color: rgba(79, 255, 176, 0.3);
          transform: translateY(-2px);
        }

        .stat-value-large {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 2rem;
          color: #4fffb0;
          line-height: 1;
        }

        .stat-label-compact {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 0.5rem;
        }

        .heatmap-container {
          padding: 1rem;
        }

        .heatmap-grid {
          display: grid;
          grid-template-columns: repeat(53, 1fr);
          grid-template-rows: repeat(7, 1fr);
          gap: 3px;
          margin-bottom: 1rem;
        }

        .heatmap-cell {
          aspect-ratio: 1;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 2px;
          transition: all 0.2s ease;
        }

        .heatmap-cell:hover {
          transform: scale(1.2);
          z-index: 10;
        }

        .heatmap-cell.level-1 {
          background: rgba(79, 255, 176, 0.2);
        }

        .heatmap-cell.level-2 {
          background: rgba(79, 255, 176, 0.4);
        }

        .heatmap-cell.level-3 {
          background: rgba(79, 255, 176, 0.6);
        }

        .heatmap-cell.level-4 {
          background: rgba(79, 255, 176, 0.8);
        }

        .heatmap-legend {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
        }

        .match-filters {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .filter-btn {
          padding: 0.6rem 1.2rem;
          background: rgba(10, 22, 40, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: rgba(255, 255, 255, 0.6);
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.85rem;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
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
      `}</style>

      <div className="profile-container">
        <Navbar />
        <div className="profile-content">
          <h1 className="profile-title">{profile.firstName}'S PERFORMANCE</h1>

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
              </div>

              {/* Profile Information */}
              <div className="profile-info">
                {/* Bio Section - Only show if can view content */}
                {canViewContent && profile?.bio && (
                  <div className="profile-field bio-section">
                    <div className="profile-field-label">About</div>
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

                {/* Email - Only show if can view content */}
                {canViewContent && (
                  <div className="profile-field">
                    <div className="profile-field-label">Email</div>
                    <div className="profile-field-value">{profile?.email}</div>
                  </div>
                )}

                {/* Date of Birth - Only show if can view content */}
                {canViewContent && profile?.dob && (
                  <div className="profile-field">
                    <div className="profile-field-label">Date of Birth</div>
                    <div className="profile-field-value">{formatDate(profile.dob)}</div>
                  </div>
                )}

                {/* Gender */}
                {profile?.gender && (
                  <div className="profile-field">
                    <div className="profile-field-label">Gender</div>
                    <div className="profile-field-value">{profile.gender}</div>
                  </div>
                )}

                {/* City */}
                {profile?.city && (
                  <div className="profile-field">
                    <div className="profile-field-label">City</div>
                    <div className="profile-field-value">{profile.city}</div>
                  </div>
                )}

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

                {/* Phone - Only show if can view content */}
                {canViewContent && profile?.phone && (
                  <div className="profile-field">
                    <div className="profile-field-label">Phone</div>
                    <div className="profile-field-value">{profile.phone}</div>
                  </div>
                )}

                {/* Sports */}
                <div className="profile-field sports-section">
                  <div className="profile-field-label">Sports</div>
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

                {/* Follow Button */}
                {authUser && !isOwnProfile && (
                  <button
                    onClick={handleFollow}
                    disabled={loadingFollow}
                    style={{
                      width: '100%',
                      marginTop: '1.5rem',
                      background: followStatus.isFollowing
                        ? 'transparent'
                        : followStatus.isPending
                        ? 'rgba(236, 72, 153, 0.1)'
                        : '#ec4899',
                      color: followStatus.isFollowing || followStatus.isPending ? '#ec4899' : '#fff',
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      padding: '0.875rem 1.5rem',
                      border: followStatus.isFollowing || followStatus.isPending ? '2px solid #ec4899' : 'none',
                      borderRadius: '50px',
                      cursor: loadingFollow ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      opacity: loadingFollow ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!loadingFollow) {
                        if (followStatus.isFollowing) {
                          e.target.style.background = 'rgba(236, 72, 153, 0.1)'
                        } else if (!followStatus.isPending) {
                          e.target.style.transform = 'translateY(-2px)'
                          e.target.style.boxShadow = '0 8px 25px rgba(236, 72, 153, 0.5)'
                          e.target.style.background = '#f472b6'
                        }
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loadingFollow) {
                        if (followStatus.isFollowing) {
                          e.target.style.background = 'transparent'
                        } else if (!followStatus.isPending) {
                          e.target.style.transform = 'translateY(0)'
                          e.target.style.boxShadow = 'none'
                          e.target.style.background = '#ec4899'
                        }
                      }
                    }}
                  >
                    {loadingFollow
                      ? 'Loading...'
                      : followStatus.isFollowing
                      ? 'Following'
                      : followStatus.isPending
                      ? 'Requested'
                      : 'Follow'}
                  </button>
                )}
              </div>
            </div>

            {/* Right Side - Sport Ratings */}
            {canViewContent ? (
            <div className="profile-box">
              <h2 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 900,
                fontSize: '1.8rem',
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
                {ratings.length === 0 ? (
                  <div className="no-ratings">
                    No ratings yet. Play matches to build your rating!
                  </div>
                ) : (
                  ratings.map((rating) => (
                    <div key={rating.id} className="rating-card">
                      <div className="rating-header">
                        <div className="sport-name">{getSportDisplayName(rating.sportId)}</div>
                        <div className="rating-badge">
                          {rating.matchCount === 0 ? 'Unranked' : `${rating.matchCount} Matches`}
                        </div>
                      </div>

                      <div className="rating-display">
                        <div className="rating-number">{Math.round(rating.rating)}</div>
                        <div className="rating-label">Rating</div>
                      </div>

                      <div className="rating-stats">
                        <div className="stat-item">
                          <div className="stat-value">±{Math.round(rating.rd)}</div>
                          <div className="stat-label">Uncertainty</div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-value">
                            {rating.lastMatchDate
                              ? new Date(rating.lastMatchDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                              : '—'}
                          </div>
                          <div className="stat-label">Last Match</div>
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
                          <defs>
                            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#4fffb0" />
                              <stop offset="100%" stopColor="#00d4ff" />
                            </linearGradient>
                          </defs>
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
                                    r="1.5"
                                    className="graph-dot"
                                  >
                                    <title>
                                      {formatGraphDate(point.date)}: {Math.round(point.rating)}
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
            ) : (
            <div className="profile-box" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
              <h3 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 900,
                fontSize: '1.5rem',
                color: '#4fffb0',
                textTransform: 'uppercase',
                marginBottom: '0.5rem'
              }}>
                Private Profile
              </h3>
              <p style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '0.95rem',
                color: 'rgba(255, 255, 255, 0.7)'
              }}>
                Ratings hidden
              </p>
            </div>
            )}
          </div>

          {/* Career Stats - Compact */}
          {canViewContent && careerStats && (
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
                  <div className="stat-value-large">{careerStats.titles}</div>
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

          {/* Activity Heatmap - Compact */}
          {canViewContent && (
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
          )}

          {/* Recent Matches - Compact */}
          {canViewContent && (
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
          )}

          {/* Privacy Message for Private Profiles */}
          {!canViewContent && profile?.isProfilePrivate && (
            <div className="profile-box" style={{ marginTop: '2rem', textAlign: 'center', padding: '3rem 2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
              <h3 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 900,
                fontSize: '1.5rem',
                color: '#4fffb0',
                textTransform: 'uppercase',
                marginBottom: '0.5rem'
              }}>
                Private Profile
              </h3>
              <p style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '1rem',
                color: 'rgba(255, 255, 255, 0.7)'
              }}>
                Follow {profile?.firstName} to see their stats, matches, and activity
              </p>
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
      </div>
    </>
  )
}

export default PlayerProfilePage
