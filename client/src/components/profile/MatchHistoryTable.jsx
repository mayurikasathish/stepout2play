const MatchHistoryTable = ({ matches }) => {
  if (!matches || matches.length === 0) {
    return (
      <div className="border border-gray-200 rounded-xl p-8 text-center bg-white">
        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-gray-600 text-lg font-medium">No match history yet</p>
        <p className="text-gray-500 text-sm mt-2">Play matches to build your history!</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getSportEmoji = (sportId) => {
    const emojis = {
      badminton: '🏸',
      'table-tennis': '🏓',
      tennis: '🎾',
      squash: '🎾'
    };
    return emojis[sportId] || '🏆';
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      {/* Desktop View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Opponent
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Tournament
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Score
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Rating
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Result
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {matches.map((match, index) => (
              <tr
                key={match.matchId}
                className="hover:bg-gray-50 transition-colors"
              >
                {/* Opponent */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                      {match.opponentProfilePicture ? (
                        <img src={match.opponentProfilePicture} alt={match.opponent} className="w-full h-full object-cover" />
                      ) : (
                        match.opponent.charAt(0)
                      )}
                    </div>
                    <div>
                      <div className="text-gray-900 font-medium">{match.opponent}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <span>{getSportEmoji(match.sportId)}</span>
                        <span>{match.format}</span>
                      </div>
                    </div>
                  </div>
                </td>

                {/* Tournament */}
                <td className="px-6 py-4">
                  <div className="text-gray-900 font-medium">{match.tournament}</div>
                  <div className="text-sm text-gray-500">{match.city}</div>
                </td>

                {/* Score */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-gray-700 font-mono text-sm">{match.score}</span>
                </td>

                {/* Rating Change */}
                <td className="px-6 py-4 text-center whitespace-nowrap">
                  <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold ${
                    match.ratingChange > 0
                      ? 'bg-green-100 text-green-700'
                      : match.ratingChange < 0
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {match.ratingChange > 0 ? '+' : ''}{match.ratingChange}
                  </span>
                </td>

                {/* Result */}
                <td className="px-6 py-4 text-center whitespace-nowrap">
                  <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${
                    match.result === 'WIN'
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-red-100 text-red-700 border border-red-200'
                  }`}>
                    {match.result}
                  </span>
                </td>

                {/* Date */}
                <td className="px-6 py-4 text-right whitespace-nowrap text-sm text-gray-600">
                  {formatDate(match.date)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden divide-y divide-gray-100">
        {matches.map((match) => (
          <div key={match.matchId} className="p-4">
            {/* Result Badge */}
            <div className="flex items-center justify-between mb-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold uppercase ${
                match.result === 'WIN'
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-red-100 text-red-700 border border-red-200'
              }`}>
                {match.result}
              </span>
              <span className="text-sm text-gray-500">{formatDate(match.date)}</span>
            </div>

            {/* Opponent */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold overflow-hidden">
                {match.opponentProfilePicture ? (
                  <img src={match.opponentProfilePicture} alt={match.opponent} className="w-full h-full object-cover" />
                ) : (
                  match.opponent.charAt(0)
                )}
              </div>
              <div className="flex-1">
                <div className="text-gray-900 font-medium">{match.opponent}</div>
                <div className="text-sm text-gray-500 flex items-center gap-1">
                  <span>{getSportEmoji(match.sportId)}</span>
                  <span>{match.format}</span>
                </div>
              </div>
            </div>

            {/* Tournament & Score */}
            <div className="space-y-2 text-sm bg-gray-50 rounded-lg p-3 border border-gray-100">
              <div className="flex justify-between">
                <span className="text-gray-500">Tournament:</span>
                <span className="text-gray-900 font-medium">{match.tournament}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Score:</span>
                <span className="text-gray-700 font-mono">{match.score}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Rating:</span>
                <span className={`font-bold ${
                  match.ratingChange > 0 ? 'text-green-600' : match.ratingChange < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {match.ratingChange > 0 ? '+' : ''}{match.ratingChange}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MatchHistoryTable;
