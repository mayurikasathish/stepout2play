import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PasswordInput from '../components/PasswordInput'

const SignupPage = () => {
  const navigate = useNavigate()
  const { register, isAuthenticated } = useAuth()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) {
    navigate('/dashboard', { replace: true })
    return null
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    if (errors[e.target.name] || errors.general) {
      setErrors({ ...errors, [e.target.name]: '', general: '' })
    }
  }

  const validate = () => {
    const errs = {}
    if (!formData.firstName.trim()) errs.firstName = 'First name is required'
    if (!formData.lastName.trim()) errs.lastName = 'Last name is required'
    if (!formData.email) errs.email = 'Email is required'
    if (!formData.password) {
      errs.password = 'Password is required'
    } else if (formData.password.length < 8) {
      errs.password = 'At least 8 characters'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(formData.password)) {
      errs.password = 'Must include uppercase, lowercase, number & special character'
    }
    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match'
    }
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setLoading(true)
    setErrors({})
    try {
      await register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
      })
      navigate('/onboarding', { replace: true })
    } catch (error) {
      const serverErrors = error.response?.data?.errors
      const msg = Array.isArray(serverErrors)
        ? serverErrors.join('. ')
        : error.response?.data?.error || 'Registration failed. Please try again.'
      setErrors({ general: msg })
    } finally {
      setLoading(false)
    }
  }

  const inputCls = (field) =>
    `w-full px-4 py-3 border ${errors[field] ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'} rounded-xl focus:ring-2 focus:border-transparent outline-none transition-all bg-white`

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20 flex flex-col">
      {/* Header */}
      <div className="glass-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-black text-xl">S</span>
            </div>
            <span className="text-lg font-bold text-gray-900">StepOut2Play</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create your account</h1>
            <p className="text-gray-600">Get started in under a minute</p>
          </div>

          <div className="glass-card rounded-2xl p-8 shadow-glass-lg">
            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-700 font-medium">{errors.general}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">First name</label>
                  <input type="text" name="firstName" placeholder="Mayurika"
                    value={formData.firstName} onChange={handleChange}
                    className={inputCls('firstName')} autoFocus />
                  {errors.firstName && <p className="mt-1.5 text-sm text-red-600">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Last name</label>
                  <input type="text" name="lastName" placeholder="Sharma"
                    value={formData.lastName} onChange={handleChange}
                    className={inputCls('lastName')} />
                  {errors.lastName && <p className="mt-1.5 text-sm text-red-600">{errors.lastName}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Email address</label>
                <input type="email" name="email" placeholder="you@example.com"
                  value={formData.email} onChange={handleChange}
                  className={inputCls('email')} />
                {errors.email && <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Password</label>
                <PasswordInput name="password" placeholder="Create a strong password"
                  value={formData.password} onChange={handleChange} error={errors.password} />
                {!errors.password && (
                  <p className="mt-1.5 text-xs text-gray-500">Min 8 chars, uppercase, lowercase, number & symbol</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Confirm password</label>
                <PasswordInput name="confirmPassword" placeholder="Confirm your password"
                  value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword} />
              </div>

              <button type="submit" disabled={loading}
                className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm hover:shadow-md">
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating account...
                  </>
                ) : 'Create account'}
              </button>
            </form>

            {/* Switch to login */}
            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignupPage
