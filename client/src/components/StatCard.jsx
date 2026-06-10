const StatCard = ({ icon: Icon, label, value, trend, change, description }) => {
  return (
    <div className="glass-card rounded-xl p-6 hover:shadow-glass-lg transition-all duration-300 hover:-translate-y-0.5 group">
      <div className="flex items-start justify-between mb-4">
        {Icon && (
          <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600 group-hover:bg-primary-100 transition-colors">
            <Icon className="w-5 h-5" />
          </div>
        )}
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
            trend === 'up'
              ? 'bg-success-50 text-success-600'
              : trend === 'down'
              ? 'bg-danger-50 text-danger-600'
              : 'bg-gray-50 text-gray-600'
          }`}>
            {trend === 'up' && (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            )}
            {trend === 'down' && (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            )}
            <span>{change}</span>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
        <p className="text-sm font-medium text-gray-600">{label}</p>
        {description && (
          <p className="text-xs text-gray-500 mt-2">{description}</p>
        )}
      </div>
    </div>
  )
}

export default StatCard
