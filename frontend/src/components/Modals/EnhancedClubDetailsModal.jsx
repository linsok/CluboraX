import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  XMarkIcon, 
  UserGroupIcon, 
  CalendarIcon,
  MapPinIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  SparklesIcon,
  UserCircleIcon,
  AcademicCapIcon,
  ClockIcon,
  TagIcon,
  InformationCircleIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../api/client'

/**
 * Enhanced Club Detail Modal Component
 * Displays comprehensive club information in an organized, visually appealing layout
 */
const EnhancedClubDetailsModal = ({ show, clubId, onClose, onJoinClub }) => {
  const { data: club, isLoading, error } = useQuery({
    queryKey: ['club-details', clubId],
    queryFn: () => clubId ? apiClient.get(`/api/clubs/${clubId}/`) : Promise.resolve({ data: {} }),
    enabled: !!clubId && show,
    staleTime: 0,
  })

  const clubData = club?.data || {}
  const memberCount = clubData.member_count || clubData.members || 0

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={onClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with Logo */}
              <div className="relative h-32 bg-gradient-to-r from-purple-600 to-indigo-600 overflow-hidden">
                {clubData.logo && (
                  <>
                    <img 
                      src={clubData.logo} 
                      alt={clubData.name} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30" />
                  </>
                )}
                
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors z-10"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>

                {/* Title Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/50 to-transparent">
                  <h2 className="text-3xl font-bold text-white mb-1">{clubData.name || 'Club Details'}</h2>
                  <div className="flex items-center gap-2 text-purple-100">
                    <TagIcon className="w-4 h-4" />
                    <span className="capitalize">{clubData.category || 'General'}</span>
                  </div>
                </div>
              </div>

              {/* Loading State */}
              {isLoading && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading club details...</p>
                  </div>
                </div>
              )}

              {/* Content */}
              {!isLoading && (
                <div className="p-6 space-y-6 overflow-y-auto flex-1">
                  {/* About Section */}
                  {clubData.description && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                        <InformationCircleIcon className="w-5 h-5 mr-2 text-purple-600" />
                        About This Club
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-base">{clubData.description}</p>
                    </div>
                  )}

                  {/* Mission Section */}
                  {clubData.mission_statement && (
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100">
                      <h4 className="font-bold text-purple-900 mb-3 flex items-center text-base">
                        <SparklesIcon className="w-5 h-5 mr-2" />
                        Our Mission
                      </h4>
                      <p className="text-gray-700 leading-relaxed">{clubData.mission_statement}</p>
                    </div>
                  )}

                  {/* Club Information Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Info Card 1 */}
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                      <h4 className="font-bold text-blue-900 mb-4 flex items-center text-sm">
                        <UserGroupIcon className="w-5 h-5 mr-2" />
                        Club Information
                      </h4>
                      <div className="space-y-3 text-sm">
                        {clubData.category && (
                          <div>
                            <p className="text-gray-600 font-medium">Category</p>
                            <p className="text-gray-900 font-semibold capitalize">{clubData.category}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-gray-600 font-medium">Members</p>
                          <p className="text-gray-900 font-semibold text-lg">{memberCount}</p>
                        </div>
                        {clubData.founded_date && (
                          <div>
                            <p className="text-gray-600 font-medium">Founded</p>
                            <p className="text-gray-900 font-semibold">{new Date(clubData.founded_date).toLocaleDateString()}</p>
                          </div>
                        )}
                        {clubData.status && (
                          <div>
                            <p className="text-gray-600 font-medium">Status</p>
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                              clubData.status === 'published' || clubData.status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : clubData.status === 'approved'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {clubData.status.charAt(0).toUpperCase() + clubData.status.slice(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Info Card 2 */}
                    {(clubData.advisor_name || clubData.meeting_schedule) && (
                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                        <h4 className="font-bold text-amber-900 mb-4 flex items-center text-sm">
                          <AcademicCapIcon className="w-5 h-5 mr-2" />
                          Leadership & Schedule
                        </h4>
                        <div className="space-y-3 text-sm">
                          {clubData.advisor_name && (
                            <div>
                              <p className="text-gray-600 font-medium">Faculty Advisor</p>
                              <p className="text-gray-900 font-semibold">{clubData.advisor_name}</p>
                              {clubData.advisor_email && (
                                <a href={`mailto:${clubData.advisor_email}`} className="text-blue-600 hover:underline text-xs mt-1 break-all">
                                  {clubData.advisor_email}
                                </a>
                              )}
                            </div>
                          )}
                          {clubData.meeting_schedule && (
                            <div>
                              <p className="text-gray-600 font-medium">Meeting Schedule</p>
                              <p className="text-gray-900 font-semibold">{clubData.meeting_schedule}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Requirements */}
                  {clubData.requirements && (
                    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-5 border border-yellow-200">
                      <h4 className="font-bold text-yellow-900 mb-3 flex items-center text-base">
                        <CheckCircleIcon className="w-5 h-5 mr-2" />
                        Membership Requirements
                      </h4>
                      <p className="text-gray-700 leading-relaxed">{clubData.requirements}</p>
                    </div>
                  )}

                  {/* Tags */}
                  {clubData.tags && clubData.tags.length > 0 && (
                    <div>
                      <h4 className="font-bold text-gray-900 mb-3 flex items-center text-base">
                        <TagIcon className="w-5 h-5 mr-2" />
                        Tags
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {clubData.tags.map((tag, idx) => (
                          <span key={idx} className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Social Links */}
                  {clubData.social_links && Object.keys(clubData.social_links).length > 0 && (
                    <div>
                      <h4 className="font-bold text-gray-900 mb-3 flex items-center text-base">
                        <GlobeAltIcon className="w-5 h-5 mr-2" />
                        Connect With Us
                      </h4>
                      <div className="flex flex-wrap gap-3">
                        {Object.entries(clubData.social_links).map(([platform, handle]) => (
                          <div key={platform} className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition-colors">
                            <span className="font-medium text-gray-700 capitalize">{platform}:</span>
                            <span className="text-gray-600">{handle}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-end space-x-4">
                <button
                  onClick={onClose}
                  className="px-6 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    onClose()
                    onJoinClub && onJoinClub(clubData)
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors duration-300 font-medium"
                >
                  Join Club
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default EnhancedClubDetailsModal
