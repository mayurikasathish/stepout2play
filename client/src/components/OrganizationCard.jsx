const OrganizationCard = ({ organization, onClick }) => {
  const getGradient = (name) => {
    const gradients = [
      'from-primary-500 to-primary-600',
      'from-blue-500 to-indigo-600',
      'from-purple-500 to-pink-600',
      'from-orange-500 to-red-600',
      'from-green-500 to-emerald-600',
    ]
    const index = name.charCodeAt(0) % gradients.length
    return gradients[index]
  }

  return (
    <button
      onClick={onClick}
      className="glass-card rounded-xl p-6 text-left hover:shadow-glass-lg transition-all duration-300 w-full group hover:-translate-y-1"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className={`w-14 h-14 bg-gradient-to-br ${getGradient(organization.name)} rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
          <span className="text-white font-bold text-xl">
            {organization.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <span className="px-3 py-1 bg-success-50 text-success-700 text-xs font-medium rounded-full border border-success-100">
          Active
        </span>
      </div>

      {/* Content */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
        {organization.name}
      </h3>

      {/* Location */}
      {(organization.city || organization.state) && (
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{organization.city}{organization.state ? `, ${organization.state}` : ''}</span>
        </div>
      )}

      <p className="text-sm text-gray-600 mb-5 line-clamp-2 leading-relaxed">
        {organization.description || 'No description provided'}
      </p>

      {/* Stats */}
      <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          <span className="font-medium">{organization.tournamentCount || 0}</span>
          <span className="text-gray-500">Tournaments</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span className="font-medium">{organization.memberCount || 0}</span>
          <span className="text-gray-500">Members</span>
        </div>
      </div>
    </button>
  )
}

export default OrganizationCard
