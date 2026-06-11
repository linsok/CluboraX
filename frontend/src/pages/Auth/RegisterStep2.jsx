import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAccount } from "../../api/auth";

const RegisterStep2 = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    university: '',
    customUniversity: '',
    major: '',
    organizationName: ''
  });

  const cambodianUniversities = [
    'Royal University of Phnom Penh',
    'Institute of Technology of Cambodia',
    'Royal University of Law and Economics',
    'National University of Management',
    'Cambodia Academy of Digital Technology',
    'American University of Phnom Penh',
    'Paragon International University',
    'Paññāsāstra University of Cambodia',
    'Norton University',
    'Western University',
    'University of Cambodia',
    'Other'
  ];

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const storedData = sessionStorage.getItem('registrationData');

    if (storedData) {
      setExtractedData(JSON.parse(storedData));
    } else {
      navigate('/register');
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    } else {
      const hasUpper = /[A-Z]/.test(formData.password);
      const hasLower = /[a-z]/.test(formData.password);
      const hasNumber = /\d/.test(formData.password);
      const hasSpecial = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(formData.password);

      if (!hasUpper) newErrors.password = 'Contains uppercase letter';
      if (!hasLower) newErrors.password = 'Contains lowercase letter';
      if (!hasNumber) newErrors.password = 'Contains number';
      if (!hasSpecial) newErrors.password = 'Contains special character';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const registrationData = JSON.parse(sessionStorage.getItem('registrationData'));

      if (!registrationData) {
        setErrors({ general: 'Please upload your ID card first' });
        navigate('/register');
        return;
      }

      const finalData = {
        ...formData,
        confirm_password: formData.confirmPassword,
        id_card_data: registrationData,
        name: registrationData.name,
        id_number: registrationData.id_number,
        date_of_birth: registrationData.date_of_birth,
        gender: registrationData.gender,
        expiry_date: registrationData.expiry_date,
        university:
          formData.university === 'Other'
            ? formData.customUniversity
            : formData.university,
      };

      const response = await createAccount(finalData);

      if (response.success) {
        sessionStorage.removeItem('registrationData');
        alert('Account created successfully!');
        navigate('/login');
      } else {
        setErrors({ general: response.message || 'Failed to create account' });
      }
    } catch (err) {
      setErrors({ general: 'An error occurred while creating your account' });
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/register');
  };

  const getPasswordStrength = () => {
    const { password } = formData;
    if (!password) return { strength: 0, checks: [] };

    let strength = 0;
    const checks = [];

    if (password.length >= 8) {
      strength += 25;
      checks.push({ text: 'At least 8 characters', valid: true });
    } else {
      checks.push({ text: 'At least 8 characters', valid: false });
    }

    if (/[A-Z]/.test(password)) {
      strength += 25;
      checks.push({ text: 'Contains uppercase letter', valid: true });
    } else {
      checks.push({ text: 'Contains uppercase letter', valid: false });
    }

    if (/[a-z]/.test(password)) {
      strength += 25;
      checks.push({ text: 'Contains lowercase letter', valid: true });
    } else {
      checks.push({ text: 'Contains lowercase letter', valid: false });
    }

    if (/\d/.test(password)) {
      strength += 25;
      checks.push({ text: 'Contains number', valid: true });
    } else {
      checks.push({ text: 'Contains number', valid: false });
    }

    if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
      strength += 25;
      checks.push({ text: 'Contains special character', valid: true });
    } else {
      checks.push({ text: 'Contains special character', valid: false });
    }

    return { strength, checks };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="min-h-screen flex">
      {/* Left panel image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img
          src="/img/login-signup.jpg"
          alt="Campus Events"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 to-indigo-900/40" />
      </div>

      {/* Right panel form */}
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
              Complete your registration details below
            </p>
          </div>

          {extractedData && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                ✓ Extracted Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex flex-col">
                  <span className="text-xs text-green-700 font-medium">Name:</span>
                  <span className="text-green-900 font-semibold">
                    {extractedData.name || 'Not found'}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-xs text-green-700 font-medium">ID Number:</span>
                  <span className="text-green-900 font-semibold">
                    {extractedData.id_number || 'Not found'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>

              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border-2 rounded-lg text-sm transition-colors focus:outline-none focus:border-purple-500 ${
                  errors.email ? 'border-red-400 bg-red-50/10' : 'border-gray-300'
                }`}
                placeholder="Enter your email"
              />

              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`block w-full px-3 py-2 pr-16 border-2 rounded-lg text-sm transition-colors focus:outline-none focus:border-purple-500 ${
                    errors.password ? 'border-red-400 bg-red-50/10' : 'border-gray-300'
                  }`}
                  placeholder="Create a strong password"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-purple-600 hover:text-purple-800 focus:outline-none"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              {formData.password && (
                <div className="mt-2 bg-gray-50 p-2.5 rounded-lg border border-gray-150">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500">
                      Password strength:
                    </span>

                    <div className="flex-1 bg-gray-200 rounded-full h-1.5 ml-2 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          passwordStrength.strength === 0 ? 'bg-red-500' :
                          passwordStrength.strength <= 25 ? 'bg-orange-500' :
                          passwordStrength.strength <= 50 ? 'bg-yellow-500' :
                          passwordStrength.strength <= 75 ? 'bg-blue-500' : 'bg-green-500'
                        }`}
                        style={{
                          width: `${Math.min(passwordStrength.strength, 100)}%`,
                          maxWidth: '100%'
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                    {passwordStrength.checks.map((check, index) => (
                      <div key={index} className="flex items-center text-[11px]">
                        <span className={check.valid ? 'text-green-600 font-bold' : 'text-gray-400'}>
                          {check.valid ? '✓' : '•'}
                        </span>
                        <span className={`ml-1 ${check.valid ? 'text-gray-700' : 'text-gray-400'}`}>
                          {check.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {errors.password && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.password}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>

              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`block w-full px-3 py-2 pr-16 border-2 rounded-lg text-sm transition-colors focus:outline-none focus:border-purple-500 ${
                    errors.confirmPassword ? 'border-red-400 bg-red-50/10' : 'border-gray-300'
                  }`}
                  placeholder="Confirm your password"
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-purple-600 hover:text-purple-800 focus:outline-none"
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {errors.general && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-600">{errors.general}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Register As
              </label>

              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="block w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500 transition-colors bg-white"
                required
              >
                <option value="">Select role</option>
                <option value="student">Student</option>
                <option value="organizer">Organizer</option>
              </select>
            </div>

            {formData.role === 'student' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    University
                  </label>

                  <select
                    name="university"
                    value={formData.university}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500 transition-colors bg-white"
                    required
                  >
                    <option value="">Select university</option>
                    {cambodianUniversities.map((uni) => (
                      <option key={uni} value={uni}>
                        {uni}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.university === 'Other' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Your University Name
                    </label>

                    <input
                      type="text"
                      name="customUniversity"
                      value={formData.customUniversity}
                      onChange={handleChange}
                      className="block w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500 transition-colors"
                      placeholder="Enter university name"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Major of Study
                  </label>

                  <input
                    type="text"
                    name="major"
                    value={formData.major}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="Example: Data Science and Engineering"
                    required
                  />
                </div>
              </>
            )}

            {formData.role === 'organizer' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Name
                </label>

                <input
                  type="text"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Enter organization name"
                  required
                />
              </div>
            )}

            <div className="flex items-start gap-2 pt-2">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />

              <label htmlFor="terms" className="text-sm text-gray-600">
                I agree to the{' '}
                <a href="/terms" className="text-purple-600 hover:underline">
                  Terms of Service
                </a>
                {' '}and{' '}
                <a href="/privacy" className="text-purple-600 hover:underline">
                  Privacy Policy
                </a>
              </label>
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 flex justify-center py-2.5 px-4 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
              >
                Back
              </button>

              <button
                type="submit"
                disabled={loading}
                className={`flex-1 flex justify-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white transition-all ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed animate-pulse'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 shadow-md hover:shadow-lg'
                }`}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <a href="/login" className="font-semibold text-purple-600 hover:underline">
              Sign in here
            </a>
          </p>

          <div className="mt-4 text-center">
            <button
              onClick={handleBack}
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
              Back to Step 1
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RegisterStep2;