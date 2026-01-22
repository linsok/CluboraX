import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  UserIcon, 
  EnvelopeIcon, 
  LockClosedIcon, 
  AcademicCapIcon,
  EyeIcon, 
  EyeSlashIcon,
  CheckIcon,
  XMarkIcon,
  UserGroupIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../../contexts/AuthContext'
import { register as registerUser } from '../../api/auth'
import toast from 'react-hot-toast'

const Register = () => {
  const [searchParams] = useSearchParams()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    studentId: '',
    major: '',
    passportNumber: '',
    passportExpiry: '',
    role: searchParams.get('role') || 'student'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const navigate = useNavigate()
  const { login } = useAuth()

  // Update role when URL parameter changes
  useEffect(() => {
    const roleParam = searchParams.get('role')
    if (roleParam && ['student', 'organizer'].includes(roleParam)) {
      setFormData(prev => ({ ...prev, role: roleParam }))
    }
  }, [searchParams])

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    // Clear error for this field when user starts typing
    if (errors[e.target.name]) {
      setErrors(prev => ({
        ...prev,
        [e.target.name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid'
    if (!formData.password) newErrors.password = 'Password is required'
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters'
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password'
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    if (!formData.role) newErrors.role = 'Please select a role'
    
    // Role-specific validation
    if (formData.role === 'student') {
      if (!formData.studentId.trim()) newErrors.studentId = 'Student ID is required'
      if (!formData.major.trim()) newErrors.major = 'Major is required'
    } else if (formData.role === 'organizer') {
      if (!formData.passportNumber.trim()) newErrors.passportNumber = 'Passport number is required'
      if (!formData.passportExpiry.trim()) newErrors.passportExpiry = 'Passport expiry date is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)
    
    try {
      // Prepare registration data matching Django serializer
      const registrationData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        password: formData.password,
        password_confirm: formData.confirmPassword,
        role: formData.role,
        ...(formData.role === 'student' ? {
          student_id: formData.studentId,
          faculty: formData.major // Map major to faculty for Django
        } : {
          staff_id: formData.passportNumber, // Map passport to staff_id for Django
          department: 'Organizer' // Default department for organizers
        })
      }
      
      // Call the registration API
      const response = await registerUser(registrationData)
      
      if (response.success) {
        // Registration successful
        if (response.data && response.data.access_token) {
          // Auto-login in development mode
          login(response.data.user, response.data.access_token, 'mock_refresh_token')
          toast.success(response.message || 'Registration successful! You are now logged in.')
          
          // Navigate will be handled by auth context
          setTimeout(() => {
            navigate('/')
          }, 100)
        } else if (response.data && response.data.requires_verification) {
          // Requires email verification in production
          toast.success(response.message || 'Registration successful! Please check your email for verification.')
          
          // Store user email for verification step
          localStorage.setItem('pending_verification_email', formData.email)
          
          // Redirect to login page
          setTimeout(() => {
            navigate('/login')
          }, 2000)
        } else {
          toast.success('Registration successful!')
          setTimeout(() => {
            navigate('/login')
          }, 2000)
        }
      } else {
        // Handle error response
        toast.error(response.message || 'Registration failed')
      }
      
    } catch (error) {
      console.error('Registration error:', error)
      
      // Handle API errors
      if (error.data) {
        // Django REST framework returns errors in data object
        const errors = error.data
        if (typeof errors === 'object') {
          // Handle field-specific errors
          Object.keys(errors).forEach(field => {
            const fieldErrors = Array.isArray(errors[field]) ? errors[field] : [errors[field]]
            fieldErrors.forEach(err => {
              toast.error(`${field}: ${err}`)
            })
          })
        } else {
          toast.error('Registration failed. Please try again.')
        }
      } else if (error.message) {
        toast.error(error.message)
      } else {
        toast.error('Registration failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const passwordRequirements = [
    { text: 'At least 8 characters', met: formData.password.length >= 8 },
    { text: 'Contains uppercase letter', met: /[A-Z]/.test(formData.password) },
    { text: 'Contains lowercase letter', met: /[a-z]/.test(formData.password) },
    { text: 'Contains number', met: /\d/.test(formData.password) },
    { text: 'Contains special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password) }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full space-y-8"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="mx-auto h-16 w-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg"
          >
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </motion.div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join Campus Hub and connect with your campus community
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-xl p-8"
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`appearance-none block w-full pl-10 pr-3 py-3 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.firstName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your first name"
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`appearance-none block w-full pl-10 pr-3 py-3 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.lastName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your last name"
                  />
                </div>
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`appearance-none block w-full pl-10 pr-3 py-3 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your email address"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Your Role
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: 'student' }))}
                  className={`relative p-4 border-2 rounded-lg transition-all duration-200 ${
                    formData.role === 'student'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      formData.role === 'student' ? 'bg-purple-500' : 'bg-gray-300'
                    }`}>
                      <AcademicCapIcon className={`h-6 w-6 ${
                        formData.role === 'student' ? 'text-white' : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900">Student</h3>
                      <p className="text-sm text-gray-600">Join events and clubs</p>
                    </div>
                  </div>
                  {formData.role === 'student' && (
                    <div className="absolute top-2 right-2">
                      <CheckIcon className="h-5 w-5 text-purple-500" />
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: 'organizer' }))}
                  className={`relative p-4 border-2 rounded-lg transition-all duration-200 ${
                    formData.role === 'organizer'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      formData.role === 'organizer' ? 'bg-purple-500' : 'bg-gray-300'
                    }`}>
                      <BriefcaseIcon className={`h-6 w-6 ${
                        formData.role === 'organizer' ? 'text-white' : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900">Organizer</h3>
                      <p className="text-sm text-gray-600">Create and manage events</p>
                    </div>
                  </div>
                  {formData.role === 'organizer' && (
                    <div className="absolute top-2 right-2">
                      <CheckIcon className="h-5 w-5 text-purple-500" />
                    </div>
                  )}
                </button>
              </div>
              {errors.role && (
                <p className="mt-2 text-sm text-red-600">{errors.role}</p>
              )}
            </div>

            {/* Role-specific fields */}
            {formData.role === 'student' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-2">
                    Student ID
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <AcademicCapIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="studentId"
                      name="studentId"
                      type="text"
                      required
                      value={formData.studentId}
                      onChange={handleChange}
                      className={`appearance-none block w-full pl-10 pr-3 py-3 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        errors.studentId ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter your student ID"
                    />
                  </div>
                  {errors.studentId && (
                    <p className="mt-1 text-sm text-red-600">{errors.studentId}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="major" className="block text-sm font-medium text-gray-700 mb-2">
                    Major
                  </label>
                  <input
                    id="major"
                    name="major"
                    type="text"
                    required
                    value={formData.major}
                    onChange={handleChange}
                    className={`appearance-none block w-full px-3 py-3 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.major ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your major"
                  />
                  {errors.major && (
                    <p className="mt-1 text-sm text-red-600">{errors.major}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="passportNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Passport Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="passportNumber"
                      name="passportNumber"
                      type="text"
                      required
                      value={formData.passportNumber}
                      onChange={handleChange}
                      className={`appearance-none block w-full pl-10 pr-3 py-3 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        errors.passportNumber ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter passport number"
                    />
                  </div>
                  {errors.passportNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.passportNumber}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="passportExpiry" className="block text-sm font-medium text-gray-700 mb-2">
                    Passport Expiry Date
                  </label>
                  <input
                    id="passportExpiry"
                    name="passportExpiry"
                    type="date"
                    required
                    value={formData.passportExpiry}
                    onChange={handleChange}
                    className={`appearance-none block w-full px-3 py-3 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.passportExpiry ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.passportExpiry && (
                    <p className="mt-1 text-sm text-red-600">{errors.passportExpiry}</p>
                  )}
                </div>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`appearance-none block w-full pl-10 pr-10 py-3 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
              
              {/* Password Requirements */}
              {formData.password && (
                <div className="mt-2 space-y-1">
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center text-sm">
                      {req.met ? (
                        <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                      ) : (
                        <XMarkIcon className="h-4 w-4 text-red-500 mr-2" />
                      )}
                      <span className={req.met ? 'text-green-700' : 'text-red-700'}>
                        {req.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`appearance-none block w-full pl-10 pr-10 py-3 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            <div className="flex items-center">
              <input
                id="agree-terms"
                name="agree-terms"
                type="checkbox"
                required
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="agree-terms" className="ml-2 block text-sm text-gray-700">
                I agree to the{' '}
                <a href="#" className="text-purple-600 hover:text-purple-500">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-purple-600 hover:text-purple-500">
                  Privacy Policy
                </a>
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-sm text-gray-600"
        >
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-purple-600 hover:text-purple-500">
            Sign in here
          </Link>
        </motion.p>
      </motion.div>
    </div>
  )
}

export default Register
