import React from 'react'
import { motion } from 'framer-motion'
import { XMarkIcon, EnvelopeIcon, BuildingOfficeIcon, ClockIcon, AcademicCapIcon, DocumentTextIcon, TagIcon, UserGroupIcon, InformationCircleIcon, UserIcon, ChatBubbleLeftIcon, CalendarIcon } from '@heroicons/react/24/outline'

const ClubRequestDetailModal = ({ selectedClubRequest, setShowClubDetailModal, getStatusColor, formatDate }) => {
  const membershipDate = selectedClubRequest?.submittedAt ? new Date(selectedClubRequest.submittedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={() => setShowClubDetailModal(false)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header with Gradient */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white relative">
          <button
            onClick={() => setShowClubDetailModal(false)}
            className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-3xl font-bold mb-1">Club Membership Request</h2>
            <p className="text-purple-100 text-lg">{selectedClubRequest?.clubName}</p>
          </div>
        </div>

        {/* Status Bar */}
        <div className="px-6 py-3 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${selectedClubRequest?.status === 'approved' ? 'bg-green-500' : selectedClubRequest?.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-400'}`} />
            <span className="text-sm font-semibold text-gray-700">Status: {selectedClubRequest?.status?.toUpperCase()}</span>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedClubRequest?.status === 'approved' ? 'bg-green-100 text-green-700' : selectedClubRequest?.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
            {selectedClubRequest?.status?.charAt(0).toUpperCase() + selectedClubRequest?.status?.slice(1)}
          </span>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Club Overview */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100">
            <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center">
              <UserGroupIcon className="w-5 h-5 mr-2" />
              About the Club
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 font-medium">Club Name</p>
                <p className="text-gray-900 font-semibold text-base">{selectedClubRequest?.clubName}</p>
              </div>
              <div>
                <p className="text-gray-600 font-medium">Category</p>
                <p className="text-gray-900 font-semibold capitalize">{selectedClubRequest?.clubCategory}</p>
              </div>
            </div>
          </div>

          {/* Your Information */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-100">
            <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center">
              <UserIcon className="w-5 h-5 mr-2" />
              Your Information
            </h3>
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 font-medium">Full Name</p>
                  <p className="text-gray-900 font-semibold">{selectedClubRequest?.formData?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Student ID</p>
                  <p className="text-gray-900 font-semibold">{selectedClubRequest?.formData?.studentId || 'N/A'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 font-medium">Email</p>
                  <p className="text-gray-900 font-semibold text-sm truncate">{selectedClubRequest?.formData?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Phone</p>
                  <p className="text-gray-900 font-semibold">{selectedClubRequest?.formData?.phone || 'N/A'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 font-medium">Major</p>
                  <p className="text-gray-900 font-semibold">{selectedClubRequest?.formData?.major || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Year</p>
                  <p className="text-gray-900 font-semibold">{selectedClubRequest?.formData?.year || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Application Message */}
          {selectedClubRequest?.formData?.message && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
              <h3 className="text-lg font-bold text-green-900 mb-3 flex items-center">
                <ChatBubbleLeftIcon className="w-5 h-5 mr-2" />
                Your Message
              </h3>
              <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap">{selectedClubRequest?.formData?.message}</p>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-5 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <CalendarIcon className="w-5 h-5 mr-2" />
              Timeline
            </h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 bg-purple-500 rounded-full border-2 border-white" />
                  <div className="w-0.5 h-12 bg-purple-200" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Request Submitted</p>
                  <p className="text-sm text-gray-600">{membershipDate}</p>
                </div>
              </div>
              {selectedClubRequest?.status === 'approved' && (
                <div className="flex items-start space-x-3">
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Request Approved</p>
                    <p className="text-sm text-gray-600">Welcome to the club! Your membership is now active.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-end">
          <button
            onClick={() => setShowClubDetailModal(false)}
            className="px-5 py-2 bg-gray-100 hover:bg-gray-250 border border-gray-300 text-gray-700 hover:text-gray-900 font-medium transition-colors rounded-lg shadow-sm"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}


export default ClubRequestDetailModal
