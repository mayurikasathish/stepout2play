const Input = ({ label, error, ...props }) => {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      {label && (
        <label
          style={{
            display: 'block',
            marginBottom: '0.5rem',
            color: '#374151',
            fontSize: '0.875rem',
            fontWeight: '600',
          }}
        >
          {label}
        </label>
      )}
      <input
        {...props}
        style={{
          width: '100%',
          padding: '0.75rem 1rem',
          border: error ? '2px solid #ef4444' : '1px solid #e5e7eb',
          borderRadius: '10px',
          fontSize: '1rem',
          outline: 'none',
          transition: 'all 0.2s',
          backgroundColor: 'white',
          ...props.style,
        }}
        onFocus={(e) => {
          if (!error) {
            e.target.style.borderColor = '#667eea'
            e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)'
          }
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? '#ef4444' : '#e5e7eb'
          e.target.style.boxShadow = 'none'
        }}
      />
      {error && (
        <p
          style={{
            marginTop: '0.5rem',
            fontSize: '0.875rem',
            color: '#ef4444',
          }}
        >
          {error}
        </p>
      )}
    </div>
  )
}

export default Input
