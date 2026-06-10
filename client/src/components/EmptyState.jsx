const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  actionText,
  secondaryAction,
  secondaryActionText,
  illustration
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      {/* Icon or Illustration */}
      {illustration ? (
        <div className="mb-6">
          {illustration}
        </div>
      ) : Icon ? (
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center mb-6 shadow-sm">
          <Icon className="w-8 h-8 text-primary-600" />
        </div>
      ) : null}

      {/* Content */}
      <div className="space-y-3 mb-8 max-w-md">
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        <p className="text-[15px] text-gray-600 leading-relaxed">{description}</p>
      </div>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3">
          {action && (
            <button
              onClick={action}
              className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-all shadow-sm hover:shadow-md"
            >
              {actionText}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction}
              className="px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg border border-gray-300 transition-all shadow-sm hover:shadow"
            >
              {secondaryActionText}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default EmptyState
