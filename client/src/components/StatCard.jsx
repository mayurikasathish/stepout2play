const StatCard = ({ icon, label, value, trend, trendValue }) => {
  return (
    <div className="glass-card rounded-xl p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
          <span className="text-xl">{icon}</span>
        </div>
        {trend && (
          <span className={`text-xs font-medium ${trend === 'up' ? 'text-green-600' : 'text-gray-500'}`}>
            {trendValue}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  )
}

export default StatCard
