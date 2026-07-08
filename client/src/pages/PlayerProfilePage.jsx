import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import SportRatingCard from '../components/profile/SportRatingCard';
import MatchHistoryTable from '../components/profile/MatchHistoryTable';
import CareerStatsCard from '../components/profile/CareerStatsCard';
import api from '../services/api';

const PlayerProfilePage = () => {
  const { userId } = useParams();
  const { user: authUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [sportsStats, setSportsStats] = useState([]);
  const [careerStats, setCareerStats] = useState(null);
  const [matchHistory, setMatchHistory] = useState([]);
  const [selectedSport, setSelectedSport] = useState('all');

  const isOwnProfile = authUser?.id === userId;

  useEffect(() => {
    fetchProfileData();
  }, [userId]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);

      // Fetch user info
      const userResponse = await api.get(`/users/players/${userId}`);
      setUser(userResponse.data.user || userResponse.data.player);

      // Fetch profile stats
      const statsResponse = await api.get(`/users/${userId}/profile-stats`);
      setSportsStats(statsResponse.data.sportsStats);
      setCareerStats(statsResponse.data.careerStats);

      // Fetch match history
      const historyResponse = await api.get(`/users/${userId}/match-history?limit=50`);
      setMatchHistory(historyResponse.data.matchHistory);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile data:', error);
      setLoading(false);
    }
  };

  const handleSportFilter = (sportId) => {
    setSelectedSport(sportId);
    fetchFilteredMatches(sportId);
  };

  const fetchFilteredMatches = async (sportId) => {
    try {
      const query = sportId === 'all' ? '' : `?sportId=${sportId}`;
      const response = await api.get(`/users/${userId}/match-history${query}`);
      setMatchHistory(response.data.matchHistory);
    } catch (error) {
      console.error('Error fetching filtered matches:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 mb-8 border border-purple-500/20">
          <div className="flex items-center gap-6">
            {/* Profile Picture */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt={user.firstName} className="w-full h-full object-cover" />
              ) : (
                `${user?.firstName?.[0]}${user?.lastName?.[0]}`
              )}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">
                {user?.firstName} {user?.lastName}
              </h1>
              {user?.city && (
                <p className="text-gray-400 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {user.city}
                </p>
              )}
              {user?.bio && (
                <p className="text-gray-300 mt-2">{user.bio}</p>
              )}
            </div>

            {isOwnProfile && (
              <button
                onClick={() => window.location.href = '/profile'}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Career Stats */}
        {careerStats && <CareerStatsCard stats={careerStats} />}

        {/* Sport Rating Cards */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Performance by Sport
          </h2>
          {sportsStats.length === 0 ? (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-purple-500/20 text-center">
              <p className="text-gray-400">No sports ratings yet. Play matches to build your profile!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sportsStats.map((sport) => (
                <SportRatingCard key={sport.sportId} sport={sport} userId={userId} />
              ))}
            </div>
          )}
        </div>

        {/* Match History */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Match History
            </h2>

            {/* Sport Filter */}
            <select
              value={selectedSport}
              onChange={(e) => handleSportFilter(e.target.value)}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg border border-purple-500/30 focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Sports</option>
              {sportsStats.map((sport) => (
                <option key={sport.sportId} value={sport.sportId}>
                  {sport.sportId.charAt(0).toUpperCase() + sport.sportId.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <MatchHistoryTable matches={matchHistory} />
        </div>
      </div>
    </div>
  );
};

export default PlayerProfilePage;
