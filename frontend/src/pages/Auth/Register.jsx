import { uploadIdCard } from '../../api/auth'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const ErrMsg = React.memo(({ msg }) =>
  msg ? <p className="mt-1 text-xs text-red-500">{msg}</p> : null
)

const Register = () => {
  const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState(false)
  const [isOcrLoading, setIsOcrLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const [idCardFile, setIdCardFile] = useState(null)
  const [idCardPreview, setIdCardPreview] = useState('')
  const [extractedData, setExtractedData] = useState(null)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    idNumber: '',
    idCardExpiry: ''
  })

  const firstNameRef = useRef(null)
  const lastNameRef = useRef(null)
  const idNumberRef = useRef(null)
  const idCardExpiryRef = useRef(null)

  useEffect(() => {
    if (extractedData) {
      const fullName = extractedData.name || ''
      const nameParts = fullName.split(' ')

      setFormData({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        idNumber: extractedData.id_number || '',
        idCardExpiry: extractedData.expiry_date
          ? extractedData.expiry_date.split('/').reverse().join('-')
          : ''
      })
    }
  }, [extractedData])

  const validate = useCallback(() => {
    const e = {}

    if (!idCardFile) e.idCardFile = 'Please upload your Cambodian National ID Card'
    if (!extractedData) e.extractedData = 'Please wait until ID card information is extracted'
    if (!formData.firstName) e.firstName = 'First name is required'
    if (!formData.lastName) e.lastName = 'Last name is required'
    if (!formData.idNumber) e.idNumber = 'ID Number is required'
    if (!formData.idCardExpiry) e.idCardExpiry = 'ID Card Expiry is required'

    return e
  }, [formData, idCardFile, extractedData])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()

    const validationErrors = validate()

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors({})
    setIsLoading(true)

    try {
      const step1Data = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        id_number: formData.idNumber,
        id_card_expiry: formData.idCardExpiry,
        extracted_data: extractedData
      }

      sessionStorage.setItem('registration_step1', JSON.stringify(step1Data))
      sessionStorage.setItem('registrationData', JSON.stringify(extractedData))

      navigate('/register/step2')
    } catch (error) {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [validate, navigate, formData, extractedData])

  const inputIconBase =
    'w-full pl-10 pr-3 py-2 border-2 rounded-lg bg-gray-50 text-gray-700 placeholder-gray-400 focus:outline-none cursor-not-allowed'

  const inputBase =
    'w-full px-3 py-2 border-2 rounded-lg bg-gray-50 text-gray-700 placeholder-gray-400 focus:outline-none cursor-not-allowed'

  const clsI = (field) =>
    `${inputIconBase} ${errors[field] ? 'border-red-400' : 'border-gray-300'}`

  const cls = (field) =>
    `${inputBase} ${errors[field] ? 'border-red-400' : 'border-gray-300'}`

  const UserIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  )

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:block lg:w-1/2 relative">
        <img
          src="/img/login-signup.jpg"
          alt="Campus Events"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 to-indigo-900/40" />
      </div>

      <div className="flex-1 flex items-start justify-center px-4 sm:px-6 lg:px-16 xl:px-20 bg-white overflow-y-auto py-8">
        <div className="w-full max-w-xl">
          <div className="flex justify-center mb-4">
            <img
              src="/img/logo1.png"
              alt="CluboraX"
              className="h-14 w-auto drop-shadow-lg"
            />
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              Create Account
            </h2>
            <p className="text-sm text-gray-500">
              Join our campus community
            </p>
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Upload your Cambodian National ID Card here
            </h3>
            <p className="text-sm text-gray-700 mb-4">
          <span className="text-red-600 font-medium">Note:</span>{" "}
          Please make sure your National ID card image is clear, not blurry, and uploaded in the correct horizontal rotation.
        </p>

            <div className="space-y-4">
              <div>
                

                <input
                  type="file"
                  accept="image/*"
                  disabled={isOcrLoading}
                  onChange={async (e) => {
                    const file = e.target.files[0]

                    if (!file) return

                    setIdCardFile(file)
                    setExtractedData(null)
                    setErrors({})
                    setIsOcrLoading(true)

                    setFormData({
                      firstName: '',
                      lastName: '',
                      idNumber: '',
                      idCardExpiry: ''
                    })

                    const reader = new FileReader()

                    reader.onloadend = async () => {
                      setIdCardPreview(reader.result)

                      try {
                        const formDataUpload = new FormData()
                        formDataUpload.append('id_card_image', file)

                        const response = await uploadIdCard(formDataUpload)

                        if (response.success) {
                          setExtractedData(response.data)
                          toast.success('ID card processed successfully')
                        } else {
                          toast.error(response.message || 'Failed to process ID card')
                        }
                      } catch (error) {
                        console.error('OCR upload error:', error)
                        toast.error('Failed to process ID card')
                      } finally {
                        setIsOcrLoading(false)
                      }
                    }

                    reader.onerror = () => {
                      setIsOcrLoading(false)
                      toast.error('Failed to read file')
                    }

                    reader.readAsDataURL(file)
                  }}
                  className={`w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm ${
                    isOcrLoading ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'cursor-pointer'
                  }`}
                />

                {errors.idCardFile && <ErrMsg msg={errors.idCardFile} />}

                {idCardPreview && (
                  <div className="relative mt-2 inline-block overflow-hidden rounded-lg shadow-md border border-gray-200">
                    <img
                      src={idCardPreview}
                      alt="Preview"
                      className="h-32 w-auto object-cover"
                    />
                    {isOcrLoading && (
                      <>
                        <style>{`
                          @keyframes scan {
                            0% { top: 0%; }
                            50% { top: 100%; }
                            100% { top: 0%; }
                          }
                        `}</style>
                        <div
                          className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent shadow-[0_0_8px_#8b5cf6]"
                          style={{
                            animation: 'scan 2s linear infinite',
                            top: 0
                          }}
                        />
                        <div className="absolute inset-0 bg-purple-900/20 backdrop-blur-[1px] flex items-center justify-center">
                          <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm border border-purple-100">
                            <svg className="animate-spin h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span className="text-xs font-semibold text-purple-700 tracking-wide animate-pulse">
                              Scanning ID...
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {errors.extractedData && <ErrMsg msg={errors.extractedData} />}
              </div>

              {extractedData && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                  <h4 className="text-sm font-medium text-green-800 mb-3">
                    ✓ Extracted Information
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-green-700">Name:</span>
                      <span className="text-green-600">
                        {extractedData.name || 'Not found'}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="font-medium text-green-700">ID Number:</span>
                      <span className="text-green-600">
                        {extractedData.id_number || 'Not found'}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="font-medium text-green-700">Date of Birth:</span>
                      <span className="text-green-600">
                        {extractedData.date_of_birth || 'Not found'}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="font-medium text-green-700">Gender:</span>
                      <span className="text-green-600">
                        {extractedData.gender || 'Not found'}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="font-medium text-green-700">ID Card Expiry:</span>
                      <span className="text-green-600">
                        {extractedData.expiry_date || 'Not found'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  First Name
                </label>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <UserIcon />
                  </span>

                  <input
                    ref={firstNameRef}
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    readOnly
                    placeholder="Auto-filled"
                    className={clsI('firstName')}
                  />
                </div>

                <ErrMsg msg={errors.firstName} />
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Last Name
                </label>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <UserIcon />
                  </span>

                  <input
                    ref={lastNameRef}
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    readOnly
                    placeholder="Auto-filled"
                    className={clsI('lastName')}
                  />
                </div>

                <ErrMsg msg={errors.lastName} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="idNumber"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  ID Number
                </label>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0"
                      />
                    </svg>
                  </span>

                  <input
                    ref={idNumberRef}
                    id="idNumber"
                    name="idNumber"
                    type="text"
                    value={formData.idNumber}
                    readOnly
                    placeholder="Auto-filled"
                    className={clsI('idNumber')}
                  />
                </div>

                <ErrMsg msg={errors.idNumber} />
              </div>

              <div>
                <label
                  htmlFor="idCardExpiry"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  ID Card Expiry
                </label>

                <input
                  ref={idCardExpiryRef}
                  id="idCardExpiry"
                  name="idCardExpiry"
                  type="date"
                  value={formData.idCardExpiry}
                  readOnly
                  className={cls('idCardExpiry')}
                />

                <ErrMsg msg={errors.idCardExpiry} />
              </div>
            </div>

            <div className="flex items-start gap-2">
              <input
                id="agree-terms"
                name="agree-terms"
                type="checkbox"
                required
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />

              <label htmlFor="agree-terms" className="text-sm text-gray-600">
                I agree to the{' '}
                <Link to="/terms" className="text-purple-600 hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-purple-600 hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-lg text-white font-semibold text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 transition-opacity"
            >
              {isLoading ? 'Processing...' : 'Next'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-purple-600 hover:underline">
              Sign in here
            </Link>
          </p>

          <div className="mt-4 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
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