const OrganizationCard = ({ organization, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="glass-card rounded-xl p-6 text-left hover:shadow-md transition-all w-full group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-lg">
            {organization.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
          Active
        </span>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
        {organization.name}
      </h3>
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {organization.description || 'No description provided'}
      </p>
      <div className="flex items-center space-x-4 text-xs text-gray-500">
        <div className="flex items-center space-x-1">
          <span>🏆</span>
          <span>{organization.tournamentCount || 0} Tournaments</span>
        </div>
        <div className="flex items-center space-x-1">
          <span>👥</span>
          <span>{organization.memberCount || 0} Members</span>
        </div>
      </div>
    </button>
  )
}

export default OrganizationCard
