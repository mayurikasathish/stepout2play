const CTACard = ({ icon, title, description, buttonText, onClick, variant = 'primary' }) => {
  const variants = {
    primary: 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white',
    secondary: 'glass-card border-2 border-indigo-200 hover:border-indigo-300',
  }

  const buttonVariants = {
    primary: 'bg-white text-indigo-600 hover:bg-gray-50',
    secondary: 'bg-indigo-600 text-white hover:bg-indigo-700',
  }

  return (
    <div className={`${variants[variant]} rounded-xl p-6 transition-all hover:shadow-lg`}>
      <div className="mb-4">
        <div className={`w-12 h-12 ${variant === 'primary' ? 'bg-white/20' : 'bg-indigo-50'} rounded-lg flex items-center justify-center mb-4`}>
          <span className="text-2xl">{icon}</span>
        </div>
        <h3 className={`text-xl font-semibold mb-2 ${variant === 'primary' ? 'text-white' : 'text-gray-900'}`}>
          {title}
        </h3>
        <p className={`text-sm ${variant === 'primary' ? 'text-indigo-50' : 'text-gray-600'} mb-4`}>
          {description}
        </p>
      </div>
      <button
        onClick={onClick}
        className={`w-full px-4 py-2.5 ${buttonVariants[variant]} rounded-lg font-medium text-sm transition-colors`}
      >
        {buttonText}
      </button>
    </div>
  )
}

export default CTACard
