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
      navigate('/register/step1');
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
        navigate('/register/step1');
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
    navigate('/register/step1');
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">

        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4">
            CX
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Campus Events
          </h2>
          <p className="text-gray-600 mb-8">CluboraX</p>
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">
            Create Account
          </h1>
          <p className="text-gray-600 mb-8">
            Complete your registration
          </p>
        </div>

        {extractedData && (
          <div className="bg-white py-4 px-6 shadow rounded-lg mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Your Information
            </h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Name:</span>
                <span className="text-gray-600">
                  {extractedData.name || 'Not found'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="font-medium text-gray-700">ID Number:</span>
                <span className="text-gray-600">
                  {extractedData.id_number || 'Not found'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white py-8 px-6 shadow rounded-lg">
          <form onSubmit={handleSubmit} className="space-y-6">

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>

              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
                }`}
                placeholder="Enter your email"
              />

              {errors.email && (
                <p className="mt-2 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`block w-full px-3 py-2 pr-16 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                    errors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
                  }`}
                  placeholder="Create a strong password"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-indigo-600 hover:text-indigo-800 focus:outline-none"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">
                      Password strength:
                    </span>

                    <div className="flex-1 bg-gray-200 rounded-full h-2 ml-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
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

                  <div className="space-y-1">
                    {passwordStrength.checks.map((check, index) => (
                      <div key={index} className="flex items-center text-xs">
                        <span className={check.valid ? 'text-green-600' : 'text-red-600'}>
                          {check.valid ? '✓' : '✗'}
                        </span>
                        <span className="ml-2 text-gray-600">
                          {check.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {errors.password && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.password}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>

              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`block w-full px-3 py-2 pr-16 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                    errors.confirmPassword ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
                  }`}
                  placeholder="Confirm your password"
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-indigo-600 hover:text-indigo-800 focus:outline-none"
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {errors.general && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Register As
              </label>

              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    University
                  </label>

                  <select
                    name="university"
                    value={formData.university}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your University Name
                    </label>

                    <input
                      type="text"
                      name="customUniversity"
                      value={formData.customUniversity}
                      onChange={handleChange}
                      className="block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Enter university name"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Major of Study
                  </label>

                  <input
                    type="text"
                    name="major"
                    value={formData.major}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Example: Data Science and Engineering"
                    required
                  />
                </div>
              </>
            )}

            {formData.role === 'organizer' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Name
                </label>

                <input
                  type="text"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter organization name"
                  required
                />
              </div>
            )}

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />

              <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                I agree to{' '}
                <a href="/terms" className="text-indigo-600 hover:text-indigo-500">
                  Terms of Service
                </a>
                {' '}and{' '}
                <a href="/privacy" className="text-indigo-600 hover:text-indigo-500">
                  Privacy Policy
                </a>
              </label>
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Back
              </button>

              <button
                type="submit"
                disabled={loading}
                className={`flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                }`}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign in here
            </a>
          </p>
        </div>

      </div>
    </div>
  );
};

export default RegisterStep2;