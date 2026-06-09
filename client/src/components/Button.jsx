const Button = ({ children, variant = 'primary', fullWidth = false, loading = false, ...props }) => {
  const baseStyle = {
    padding: '0.75rem 2rem',
    borderRadius: '10px',
    fontSize: '1rem',
    fontWeight: '600',
    border: 'none',
    cursor: props.disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    width: fullWidth ? '100%' : 'auto',
    opacity: props.disabled || loading ? 0.6 : 1,
  }

  const variants = {
    primary: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
    },
    secondary: {
      background: 'transparent',
      color: '#667eea',
      border: '2px solid #667eea',
    },
    danger: {
      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      color: 'white',
    },
  }

  return (
    <button
      {...props}
      style={{
        ...baseStyle,
        ...variants[variant],
        ...props.style,
      }}
      disabled={props.disabled || loading}
      onMouseEnter={(e) => {
        if (!props.disabled && !loading) {
          e.target.style.transform = 'translateY(-2px)'
          e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)'
        }
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = 'translateY(0)'
        e.target.style.boxShadow = 'none'
      }}
    >
      {loading && (
        <div
          style={{
            width: '16px',
            height: '16px',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderTop: '2px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
      )}
      {children}
    </button>
  )
}

export default Button
