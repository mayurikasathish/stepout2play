const AlertIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
)

const NotEligibleModal = ({ isOpen, onClose, reasons, userAge, eventCategory, eventGender }) => {
  if (!isOpen) return null

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Barlow:wght@400;500;600&display=swap');

        .not-eligible-overlay {
          position: fixed;
          inset: 0;
          z-index: 999;
          background: rgba(6, 13, 31, 0.85);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .not-eligible-content {
          background: linear-gradient(135deg, rgba(10, 22, 40, 0.95), rgba(6, 13, 31, 0.98));
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 2px solid rgba(251, 146, 60, 0.3);
          border-radius: 16px;
          padding: 2.5rem;
          max-width: 500px;
          width: 100%;
          box-shadow: 0 0 40px rgba(251, 146, 60, 0.2);
          text-align: center;
          animation: scaleIn 0.3s ease-out;
        }

        .not-eligible-icon-wrapper {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(251, 146, 60, 0.15), rgba(251, 146, 60, 0.05));
          border: 2px solid rgba(251, 146, 60, 0.3);
          margin: 0 auto 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .not-eligible-icon {
          width: 40px;
          height: 40px;
          color: #fb923c;
        }

        .not-eligible-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 2rem;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          color: #fb923c;
          margin-bottom: 0.75rem;
        }

        .not-eligible-subtitle {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        .not-eligible-reasons {
          background: rgba(251, 146, 60, 0.1);
          border: 1px solid rgba(251, 146, 60, 0.3);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          text-align: left;
        }

        .not-eligible-reasons ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .not-eligible-reasons li {
          font-family: 'Barlow', sans-serif;
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.85);
          padding: 0.5rem 0;
          display: flex;
          align-items: start;
          gap: 0.75rem;
          line-height: 1.5;
        }

        .not-eligible-reasons li:not(:last-child) {
          border-bottom: 1px solid rgba(251, 146, 60, 0.15);
        }

        .not-eligible-bullet {
          color: #fb923c;
          font-weight: 700;
          font-size: 1.2rem;
          flex-shrink: 0;
          margin-top: -2px;
        }

        .not-eligible-details {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          text-align: left;
        }

        .not-eligible-details-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 1rem;
        }

        .not-eligible-detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          font-family: 'Barlow', sans-serif;
          font-size: 0.95rem;
        }

        .not-eligible-detail-row:not(:last-child) {
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .not-eligible-detail-label {
          color: rgba(255, 255, 255, 0.6);
        }

        .not-eligible-detail-value {
          color: rgba(255, 255, 255, 0.9);
          font-weight: 600;
        }

        .not-eligible-button {
          width: 100%;
          background: linear-gradient(135deg, #fb923c, #f97316);
          color: #fff;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          text-transform: uppercase;
          padding: 0.85rem 2rem;
          border: none;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(251, 146, 60, 0.3);
        }

        .not-eligible-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(251, 146, 60, 0.4);
          background: linear-gradient(135deg, #f97316, #ea580c);
        }

        .not-eligible-help {
          font-family: 'Barlow', sans-serif;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.5);
          margin-top: 1rem;
          text-align: center;
        }

        .not-eligible-help a {
          color: #4fffb0;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s ease;
        }

        .not-eligible-help a:hover {
          color: #6bffbe;
          text-decoration: underline;
        }
      `}</style>

      <div className="not-eligible-overlay" onClick={onClose}>
        <div className="not-eligible-content" onClick={(e) => e.stopPropagation()}>
          {/* Icon */}
          <div className="not-eligible-icon-wrapper">
            <AlertIcon className="not-eligible-icon" />
          </div>

          {/* Title */}
          <h2 className="not-eligible-title">Not Eligible</h2>
          <p className="not-eligible-subtitle">
            Unfortunately, you don't meet the requirements for this event
          </p>

          {/* Reasons */}
          <div className="not-eligible-reasons">
            <ul>
              {reasons.map((reason, index) => (
                <li key={index}>
                  <span className="not-eligible-bullet">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Event Details */}
          {(eventCategory || eventGender || userAge !== null) && (
            <div className="not-eligible-details">
              <div className="not-eligible-details-title">Event Requirements</div>
              <div>
                {eventCategory && (
                  <div className="not-eligible-detail-row">
                    <span className="not-eligible-detail-label">Category:</span>
                    <span className="not-eligible-detail-value">{eventCategory}</span>
                  </div>
                )}
                {eventGender && (
                  <div className="not-eligible-detail-row">
                    <span className="not-eligible-detail-label">Gender:</span>
                    <span className="not-eligible-detail-value">{eventGender}</span>
                  </div>
                )}
                {userAge !== null && (
                  <div className="not-eligible-detail-row">
                    <span className="not-eligible-detail-label">Your Age on Event Date:</span>
                    <span className="not-eligible-detail-value">{userAge} years</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Button */}
          <button onClick={onClose} className="not-eligible-button">
            Got it
          </button>

          {/* Help Text */}
          <p className="not-eligible-help">
            Need to update your profile?{' '}
            <a href="/profile">Go to Profile</a>
          </p>
        </div>
      </div>
    </>
  )
}

export default NotEligibleModal
