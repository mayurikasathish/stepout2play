const CareerStatsCard = ({ stats }) => {
  return (
    <div className="glass-card rounded-2xl p-8 mb-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Career Statistics
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Matches */}
        <div className="border border-gray-200 rounded-xl p-5 hover:border-primary-300 transition-all bg-white">
          <div className="text-4xl font-bold text-gray-900 mb-2">{stats.totalMatches}</div>
          <div className="text-sm text-gray-600 font-medium">Total Matches</div>
        </div>

        {/* Win Rate */}
        <div className="border border-gray-200 rounded-xl p-5 hover:border-primary-300 transition-all bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="text-4xl font-bold text-green-700 mb-2">{stats.winRate}%</div>
          <div className="text-sm text-gray-600 font-medium">Win Rate</div>
          <div className="text-xs text-green-600 mt-1 font-semibold">
            {stats.wins}W - {stats.losses}L
          </div>
        </div>

        {/* Titles */}
        <div className="border border-gray-200 rounded-xl p-5 hover:border-primary-300 transition-all bg-gradient-to-br from-yellow-50 to-amber-50">
          <div className="text-4xl font-bold text-yellow-700 mb-2 flex items-center gap-2">
            {stats.titles}
            <svg className="w-7 h-7 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <div className="text-sm text-gray-600 font-medium">Titles Won</div>
        </div>

        {/* Tournaments Played */}
        <div className="border border-gray-200 rounded-xl p-5 hover:border-primary-300 transition-all bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="text-4xl font-bold text-blue-700 mb-2">{stats.tournamentsPlayed}</div>
          <div className="text-sm text-gray-600 font-medium">Tournaments</div>
        </div>

        {/* Current Streak */}
        <div className="border border-gray-200 rounded-xl p-5 hover:border-primary-300 transition-all bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="text-4xl font-bold text-primary-700 mb-2">
            {stats.currentStreak || '-'}
          </div>
          <div className="text-sm text-gray-600 font-medium">Current Streak</div>
        </div>
      </div>
    </div>
  );
};

export default CareerStatsCard;
