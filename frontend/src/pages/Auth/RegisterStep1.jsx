import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { uploadIdCard } from "../../api/auth";
import { useAuth } from '../../contexts/AuthContext'
import { register as registerUser } from '../../api/auth'
import toast from 'react-hot-toast'

const RegisterStep1 = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (selectedFile) => {
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        setProcessing(true);
        setError('');
        
        // Upload and process ID card with real OCR
        const formData = new FormData();
        formData.append('id_card_image', selectedFile);
        
        uploadIdCard(formData)
          .then(response => {
            if (response.success) {
              setExtractedData(response.data);
              toast.success('ID card processed successfully!');
            } else {
              setError(response.message || 'Failed to process ID card');
              toast.error(response.message || 'Failed to process ID card');
            }
          })
          .catch(error => {
            console.error('OCR Error:', error);
            setError('Failed to process ID card. Please try again.');
            toast.error('Failed to process ID card. Please try again.');
          })
          .finally(() => {
            setProcessing(false);
          });
      };
      reader.readAsDataURL(selectedFile);
      setError('');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select your ID card image');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('id_card_image', file);

      const response = await uploadIdCard(formData);
      
      if (response.success) {
        setExtractedData(response.data);
        // Store data in session storage for next step
        sessionStorage.setItem('registrationData', JSON.stringify(response.data));
        // Navigate to next step
        navigate('/register/step2');
      } else {
        setError(response.message || 'Failed to process ID card');
      }
    } catch (err) {
      setError('An error occurred while processing your ID card');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const formatExpiryDate = (dateString) => {
    if (!dateString) return '';
    // Convert DD/MM/YYYY to MM/DD/YYYY if needed
    const parts = dateString.split('/');
    if (parts.length === 3) {
      return `${parts[1].padStart(2, '0')}/${parts[0].padStart(2, '0')}/${parts[2]}`;
    }
    return dateString;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4">
            CX
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Campus Events
          </h2>
          <p className="text-gray-600 mb-8">
            CluboraX
          </p>
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">
            Create Account
          </h1>
          <p className="text-gray-600 mb-8">
            Join our campus community
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white py-8 px-6 shadow rounded-lg">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Upload your Cambodian National ID Card here
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Please upload a clear image of your national ID card (JPG, JPEG, PNG)
            </p>
          </div>

          {/* Drag and Drop Area */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={(e) => handleFileSelect(e.target.files[0])}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            {preview ? (
              <div className="space-y-4">
                <img
                  src={preview}
                  alt="ID Card Preview"
                  className="mx-auto h-48 w-auto max-w-full rounded-lg shadow-md object-cover"
                />
                {processing ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                    <p className="text-sm text-blue-600 font-medium">
                      Processing ID card...
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-green-600 font-medium">
                    ✓ ID card image selected
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="mx-auto h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 01-5 5v2a5 5 0 01-10 0v-2a5 5 0 0110 0v2a5 5 0 01-10 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002 2v2a2 2 0 01-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2h12a2 2 0 002-2v-2a2 2 0 01-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2h12a2 2 0 002-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">
                    Drag and drop your ID card image here, or
                  </p>
                  <label className="mt-2 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer">
                    Browse Files
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Upload Button */}
          <div className="mt-6">
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                !file || uploading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              }`}
            >
              {uploading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4V6a8 8 0 018-8z"></path>
                  </svg>
                  Processing...
                </div>
              ) : (
                'Upload & Process ID Card'
              )}
            </button>
          </div>

          {/* Extracted Data Preview */}
          {extractedData && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <h4 className="text-sm font-medium text-green-800 mb-3">
                ✓ Information Extracted Successfully
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-green-700">Name:</span>
                  <span className="text-green-600">{extractedData.name || 'Not found'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-green-700">ID Number:</span>
                  <span className="text-green-600">{extractedData.id_number || 'Not found'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-green-700">Date of Birth:</span>
                  <span className="text-green-600">{extractedData.date_of_birth || 'Not found'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-green-700">Gender:</span>
                  <span className="text-green-600">{extractedData.gender || 'Not found'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-green-700">ID Card Expiry:</span>
                  <span className="text-green-600">{formatExpiryDate(extractedData.expiry_date) || 'Not found'}</span>
                </div>
              </div>
              <button
              onClick={() => {
                  sessionStorage.setItem('registrationData', JSON.stringify(extractedData));
                  navigate('/register/step2');
                }}
                className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Back to Login */}
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

export default RegisterStep1;
