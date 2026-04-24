import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { register as registerUser } from '../../api/auth'
import toast from 'react-hot-toast'

// Defined OUTSIDE Register so its reference never changes between renders
const ErrMsg = React.memo(({ msg }) =>
  msg ? <p className="mt-1 text-xs text-red-500">{msg}</p> : null
)

const PW_REQUIREMENTS = [
  { label: 'At least 8 characters',      test: (pw) => pw.length >= 8 },
  { label: 'Contains uppercase letter',  test: (pw) => /[A-Z]/.test(pw) },
  { label: 'Contains lowercase letter',  test: (pw) => /[a-z]/.test(pw) },
  { label: 'Contains number',            test: (pw) => /\d/.test(pw) },
  { label: 'Contains special character', test: (pw) => /[!@#$%^&*(),.?":{}|<>]/.test(pw) },
]

const Register = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuth()

  const [role, setRole] = useState(() =>
    searchParams.get('role') === 'organizer' ? 'organizer' : 'student'
  )
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [pwChecks, setPwChecks] = useState([false, false, false, false, false])

  const firstNameRef       = useRef()
  const lastNameRef        = useRef()
  const emailRef           = useRef()
  const passwordRef        = useRef()
  const confirmPasswordRef = useRef()
  const studentIdRef       = useRef()
  const majorRef           = useRef()
  const passportNumberRef  = useRef()
  const passportExpiryRef  = useRef()

  useEffect(() => {
    const roleParam = searchParams.get('role')
    if (roleParam === 'organizer' || roleParam === 'student') setRole(roleParam)
  }, [searchParams])

  const handlePasswordInput = useCallback(() => {
    const pw = passwordRef.current?.value || ''
    setPwChecks(PW_REQUIREMENTS.map(r => r.test(pw)))
  }, [])

  const validate = useCallback(() => {
    const e = {}
    const firstName = firstNameRef.current?.value.trim()
    const lastName  = lastNameRef.current?.value.trim()
    const email     = emailRef.current?.value.trim()
    const password  = passwordRef.current?.value
    const confirm   = confirmPasswordRef.current?.value

    if (!firstName)                        e.firstName = 'First name is required'
    if (!lastName)                         e.lastName  = 'Last name is required'
    if (!email)                            e.email     = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email     = 'Email is invalid'
    if (!password)                         e.password  = 'Password is required'
    else if (password.length < 8)          e.password  = 'Password must be at least 8 characters'
    if (!confirm)                          e.confirmPassword = 'Please confirm your password'
    else if (password !== confirm)         e.confirmPassword = 'Passwords do not match'

    if (role === 'student') {
      if (!studentIdRef.current?.value.trim()) e.studentId = 'Student ID is required'
      if (!majorRef.current?.value.trim())     e.major     = 'Major is required'
    } else {
      if (!passportNumberRef.current?.value.trim()) e.passportNumber = 'Passport number is required'
      if (!passportExpiryRef.current?.value.trim()) e.passportExpiry = 'Passport expiry is required'
    }
    return e
  }, [role])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setErrors({})
    setIsLoading(true)

    const email = emailRef.current.value.trim()
    try {
      const emailExists = await fetch(`/api/auth/check-email/?email=${encodeURIComponent(email)}`)
        .then(r => r.json()).then(d => d.exists).catch(() => false)
      if (emailExists) {
        setErrors({ email: 'This email is already registered.' })
        setIsLoading(false)
        return
      }

      const registrationData = {
        first_name:  firstNameRef.current.value.trim(),
        last_name:   lastNameRef.current.value.trim(),
        email,
        password:         passwordRef.current.value,
        password_confirm: confirmPasswordRef.current.value,
        role,
        ...(role === 'student'
          ? { student_id: studentIdRef.current.value.trim(), faculty: majorRef.current.value.trim() }
          : { staff_id: passportNumberRef.current.value.trim(), department: 'Organizer' })
      }

      const response = await registerUser(registrationData)
      if (response.success) {
        if (response.data?.access_token) {
          login(response.data.user, response.data.access_token, 'mock_refresh_token')
          toast.success(response.message || 'Registration successful!')
          setTimeout(() => navigate('/'), 100)
        } else {
          toast.success(response.message || 'Registration successful! Please check your email.')
          localStorage.setItem('pending_verification_email', email)
          setTimeout(() => navigate('/login'), 2000)
        }
      } else {
        toast.error(response.message || 'Registration failed')
      }
    } catch (error) {
      if (error.data && typeof error.data === 'object') {
        Object.entries(error.data).forEach(([field, msgs]) => {
          const msg = Array.isArray(msgs) ? msgs[0] : msgs
          toast.error(`${field}: ${msg}`)
        })
      } else {
        toast.error(error.message || 'Registration failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [validate, login, navigate, role])

  const handleRoleChange = useCallback((val) => {
    setRole(val)
    setErrors({})
  }, [])

  const inputBase  = 'w-full px-3 py-2 border-2 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-500'
  const inputIconBase = 'w-full pl-10 pr-3 py-2 border-2 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-500'
  const cls  = (field) => `${inputBase} ${errors[field] ? 'border-red-400' : 'border-gray-300'}`
  const clsI = (field) => `${inputIconBase} ${errors[field] ? 'border-red-400' : 'border-gray-300'}`

  const UserIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )

  return (
    <div className="min-h-screen flex">
      <div
        className="hidden lg:block lg:w-1/2 relative"
        style={{ willChange: 'transform', transform: 'translateZ(0)', contain: 'strict' }}
      >
        <img
          src="/img/login-signup.jpg"
          alt="Campus Events"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: 'translateZ(0)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 to-indigo-900/40" />
      </div>

      <div
        className="flex-1 flex items-start justify-center px-4 sm:px-6 lg:px-16 xl:px-20 bg-white overflow-y-auto py-8"
        style={{ isolation: 'isolate', contain: 'paint' }}
      >
        <div className="w-full max-w-xl">

          <div className="flex justify-center mb-4">
            <img src="/img/logo1.png" alt="CluboraX" className="h-14 w-auto drop-shadow-lg" />
          </div>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Create Account</h2>
            <p className="text-sm text-gray-500">Join our campus community</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><UserIcon /></span>
                  <input ref={firstNameRef} id="firstName" name="firstName" type="text"
                    placeholder="First name" className={clsI('firstName')} />
                </div>
                <ErrMsg msg={errors.firstName} />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><UserIcon /></span>
                  <input ref={lastNameRef} id="lastName" name="lastName" type="text"
                    placeholder="Last name" className={clsI('lastName')} />
                </div>
                <ErrMsg msg={errors.lastName} />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input ref={emailRef} id="email" name="email" type="email"
                  placeholder="Enter your email" className={clsI('email')} />
              </div>
              <ErrMsg msg={errors.email} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">I am a</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'student',   label: 'Student',   sub: 'Join events & clubs',   icon: String.fromCodePoint(0x1F393) },
                  { value: 'organizer', label: 'Organizer', sub: 'Create & manage events', icon: String.fromCodePoint(0x1F4BC) }
                ].map(opt => (
                  <button
                    key={opt.value} type="button"
                    onClick={() => handleRoleChange(opt.value)}
                    className={`relative p-3 border-2 rounded-xl text-left transition-colors ${
                      role === opt.value ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <span className="text-xl">{opt.icon}</span>
                    <p className="font-semibold text-gray-900 text-sm mt-1">{opt.label}</p>
                    <p className="text-xs text-gray-500">{opt.sub}</p>
                    {role === opt.value && (
                      <span className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {role === 'student' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />
                      </svg>
                    </span>
                    <input ref={studentIdRef} id="studentId" name="studentId" type="text"
                      placeholder="e.g. 6501234" className={clsI('studentId')} />
                  </div>
                  <ErrMsg msg={errors.studentId} />
                </div>
                <div>
                  <label htmlFor="major" className="block text-sm font-medium text-gray-700 mb-1">Major / Faculty</label>
                  <input ref={majorRef} id="major" name="major" type="text"
                    placeholder="e.g. Computer Science" className={cls('major')} />
                  <ErrMsg msg={errors.major} />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="passportNumber" className="block text-sm font-medium text-gray-700 mb-1">Passport Number</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><UserIcon /></span>
                    <input ref={passportNumberRef} id="passportNumber" name="passportNumber" type="text"
                      placeholder="Enter passport number" className={clsI('passportNumber')} />
                  </div>
                  <ErrMsg msg={errors.passportNumber} />
                </div>
                <div>
                  <label htmlFor="passportExpiry" className="block text-sm font-medium text-gray-700 mb-1">Passport Expiry</label>
                  <input ref={passportExpiryRef} id="passportExpiry" name="passportExpiry" type="date"
                    className={cls('passportExpiry')} />
                  <ErrMsg msg={errors.passportExpiry} />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  ref={passwordRef}
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  onInput={handlePasswordInput}
                  className={`${clsI('password')} pr-10`}
                />
                <button type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(v => !v)}>
                  {showPassword
                    ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>
              </div>
              <ErrMsg msg={errors.password} />
              <div className="mt-2 space-y-1">
                {PW_REQUIREMENTS.map((req, i) => (
                  <div key={i} className={`flex items-center text-sm ${pwChecks[i] ? 'text-green-700' : 'text-red-500'}`}>
                    <span className="mr-2 font-bold w-3 inline-block">{pwChecks[i] ? '\u2713' : '\u2717'}</span>
                    {req.label}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  ref={confirmPasswordRef}
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  className={`${clsI('confirmPassword')} pr-10`}
                />
                <button type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowConfirmPassword(v => !v)}>
                  {showConfirmPassword
                    ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>
              </div>
              <ErrMsg msg={errors.confirmPassword} />
            </div>

            <div className="flex items-start gap-2">
              <input id="agree-terms" name="agree-terms" type="checkbox" required
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
              <label htmlFor="agree-terms" className="text-sm text-gray-600">
                I agree to the{' '}
                <Link to="/terms" className="text-purple-600 hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-purple-600 hover:underline">Privacy Policy</Link>
              </label>
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-lg text-white font-semibold text-sm
                bg-gradient-to-r from-purple-600 to-indigo-600
                hover:from-purple-700 hover:to-indigo-700
                focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-opacity">
              {isLoading
                ? <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating account...
                  </span>
                : 'Create Account'
              }
            </button>

          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-purple-600 hover:underline">Sign in here</Link>
          </p>
          <div className="mt-4 text-center">
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Register