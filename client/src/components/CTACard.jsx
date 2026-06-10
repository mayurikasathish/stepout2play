const CTACard = ({
  icon: Icon,
  title,
  description,
  buttonText,
  onClick,
  variant = 'primary'
}) => {
  const variants = {
    primary: 'bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-lg',
    secondary: 'glass-card border-2 border-primary-100 hover:border-primary-200',
    ghost: 'bg-gray-50 hover:bg-gray-100 border border-gray-200',
  }

  const iconBgVariants = {
    primary: 'bg-white/20',
    secondary: 'bg-primary-50',
    ghost: 'bg-white',
  }

  const iconColorVariants = {
    primary: 'text-white',
    secondary: 'text-primary-600',
    ghost: 'text-gray-600',
  }

  const textColorVariants = {
    primary: 'text-white',
    secondary: 'text-gray-900',
    ghost: 'text-gray-900',
  }

  const descColorVariants = {
    primary: 'text-white/90',
    secondary: 'text-gray-600',
    ghost: 'text-gray-600',
  }

  const buttonVariants = {
    primary: 'bg-white text-primary-700 hover:bg-gray-50',
    secondary: 'bg-primary-600 text-white hover:bg-primary-700',
    ghost: 'bg-gray-900 text-white hover:bg-gray-800',
  }

  return (
    <div className={`${variants[variant]} rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group`}>
      {/* Icon */}
      {Icon && (
        <div className={`w-12 h-12 ${iconBgVariants[variant]} rounded-xl flex items-center justify-center mb-5 ${iconColorVariants[variant]} group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6" />
        </div>
      )}

      {/* Content */}
      <div className="mb-6 space-y-2">
        <h3 className={`text-xl font-semibold ${textColorVariants[variant]}`}>
          {title}
        </h3>
        <p className={`text-[15px] leading-relaxed ${descColorVariants[variant]}`}>
          {description}
        </p>
      </div>

      {/* Button */}
      <button
        onClick={onClick}
        className={`w-full px-4 py-2.5 ${buttonVariants[variant]} rounded-lg font-medium text-sm transition-all shadow-sm hover:shadow-md`}
      >
        {buttonText}
      </button>
    </div>
  )
}

export default CTACard
