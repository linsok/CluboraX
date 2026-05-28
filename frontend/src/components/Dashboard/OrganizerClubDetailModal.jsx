import React from 'react'
import { motion } from 'framer-motion'
import { XMarkIcon, UserGroupIcon, InformationCircleIcon, ClockIcon, AcademicCapIcon, EnvelopeIcon, SparklesIcon, TagIcon, Cog6ToothIcon, UserCircleIcon, CalendarIcon, GlobeAltIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

const OrganizerClubDetailModal = ({ selectedOrganizerClub, setShowOrganizerClubDetailModal }) => {
  const club = selectedOrganizerClub
  const foundedDate = club?.submitted_date ? new Date(club.submitted_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={() => setShowOrganizerClubDetailModal(false)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header with Logo */}
        {club?.club_logo && (
          <div className="relative h-40 bg-gradient-to-r from-purple-400 to-pink-400 overflow-hidden">
            <img src={club.club_logo} alt={club.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/20" />
          </div>
        )}
        
        {/* Header */}
        <div className={`p-6 text-white relative ${club?.club_logo ? 'bg-gradient-to-r from-purple-600 to-gray-600 -mt-8 relative z-10' : 'bg-gradient-to-r from-purple-600 to-gray-600'}`}>
          <button
            onClick={() => setShowOrganizerClubDetailModal(false)}
            className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
          <h2 className="text-3xl font-bold mb-2">{club?.name || 'Club Details'}</h2>
          <p className="text-purple-100 flex items-center">
            <UserGroupIcon className="w-4 h-4 mr-2" />
            {club?.club_type ? club.club_type.charAt(0).toUpperCase() + club.club_type.slice(1) : 'Club'} Club
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Description */}
          {club?.description && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                <InformationCircleIcon className="w-5 h-5 mr-2 text-purple-600" />
                About
              </h3>
              <p className="text-gray-700 leading-relaxed text-sm">{club.description}</p>
            </div>
          )}

          {/* Mission Statement */}
          {club?.mission && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
              <h4 className="font-bold text-purple-900 mb-2 flex items-center text-sm">
                <SparklesIcon className="w-4 h-4 mr-2" /> Mission
              </h4>
              <p className="text-gray-700 text-sm leading-relaxed">{club.mission}</p>
            </div>
          )}

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Club Info */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
              <h4 className="font-bold text-purple-900 mb-3 flex items-center text-sm">
                <Cog6ToothIcon className="w-4 h-4 mr-2" /> Club Info
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-600 font-medium">Type</p>
                  <p className="text-gray-900 font-semibold capitalize">{club?.club_type || 'General'}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Status</p>
                  <span className={`inline-block px-2 py-1 text-xs font-bold rounded-full ${
                    club?.status === 'published' || club?.status === 'active' 
                      ? 'bg-green-100 text-green-700'
                      : club?.status === 'approved' 
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {club?.status || 'N/A'}
                  </span>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Created</p>
                  <p className="text-gray-900 font-semibold">{foundedDate}</p>
                </div>
              </div>
            </div>

            {/* Membership Info */}
            <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-4 border border-pink-100">
              <h4 className="font-bold text-pink-900 mb-3 flex items-center text-sm">
                <UserGroupIcon className="w-4 h-4 mr-2" /> Members
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-600 font-medium">Expected Members</p>
                  <p className="text-gray-900 font-bold text-lg">{club?.expected_members || 0}</p>
                </div>
                {club?.start_date && (
                  <div>
                    <p className="text-gray-600 font-medium">Start Date</p>
                    <p className="text-gray-900 font-semibold">{new Date(club.start_date).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Leadership & Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {club?.president_name && (
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
                <h4 className="font-bold text-blue-900 mb-3 flex items-center text-sm">
                  <UserCircleIcon className="w-4 h-4 mr-2" /> Club President
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-gray-600 font-medium">Name</p>
                    <p className="text-gray-900 font-semibold">{club.president_name}</p>
                  </div>
                  {club?.president_email && (
                    <div>
                      <p className="text-gray-600 font-medium">Email</p>
                      <a href={`mailto:${club.president_email}`} className="text-blue-600 hover:underline font-medium text-xs truncate">
                        {club.president_email}
                      </a>
                    </div>
                  )}
                  {club?.president_phone && (
                    <div>
                      <p className="text-gray-600 font-medium">Phone</p>
                      <a href={`tel:${club.president_phone}`} className="text-blue-600 hover:underline font-medium text-xs">
                        {club.president_phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {club?.advisor_name && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
                <h4 className="font-bold text-amber-900 mb-3 flex items-center text-sm">
                  <AcademicCapIcon className="w-4 h-4 mr-2" /> Faculty Advisor
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-gray-600 font-medium">Name</p>
                    <p className="text-gray-900 font-semibold">{club.advisor_name}</p>
                  </div>
                  {club?.advisor_email && (
                    <div>
                      <p className="text-gray-600 font-medium">Email</p>
                      <a href={`mailto:${club.advisor_email}`} className="text-blue-600 hover:underline font-medium text-xs truncate">
                        {club.advisor_email}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Meeting Details */}
          {(club?.meeting_time || club?.meeting_location) && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
              <h4 className="font-bold text-green-900 mb-3 flex items-center text-sm">
                <CalendarIcon className="w-4 h-4 mr-2" /> Meeting Details
              </h4>
              <div className="space-y-2 text-sm">
                {club?.meeting_time && (
                  <div>
                    <p className="text-gray-600 font-medium">Time</p>
                    <p className="text-gray-900">{club.meeting_time}</p>
                  </div>
                )}
                {club?.meeting_location && (
                  <div>
                    <p className="text-gray-600 font-medium">Location</p>
                    <p className="text-gray-900">{club.meeting_location}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Social Media */}
          {(club?.instagram || club?.linkedin || club?.github) && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
              <h4 className="font-bold text-indigo-900 mb-3 flex items-center text-sm">
                <GlobeAltIcon className="w-4 h-4 mr-2" /> Social Media
              </h4>
              <div className="flex flex-wrap gap-3">
                {club?.instagram && (
                  <a href={`https://instagram.com/${club.instagram}`} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-800 text-sm font-medium">
                     {club.instagram}
                  </a>
                )}
                {club?.linkedin && (
                  <a href={`https://linkedin.com/company/${club.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                     {club.linkedin}
                  </a>
                )}
                {club?.github && (
                  <a href={`https://github.com/${club.github}`} target="_blank" rel="noopener noreferrer" className="text-gray-800 hover:text-gray-900 text-sm font-medium">
                     {club.github}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Objectives */}
          {club?.objectives && (
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-100">
              <h4 className="font-bold text-orange-900 mb-2 flex items-center text-sm">
                <CheckCircleIcon className="w-4 h-4 mr-2" /> Objectives
              </h4>
              <p className="text-gray-700 text-sm leading-relaxed">{club.objectives}</p>
            </div>
          )}

          {/* Activities */}
          {club?.activities && (
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-4 border border-cyan-100">
              <h4 className="font-bold text-cyan-900 mb-2 flex items-center text-sm">
                <SparklesIcon className="w-4 h-4 mr-2" /> Planned Activities
              </h4>
              <p className="text-gray-700 text-sm leading-relaxed">{club.activities}</p>
            </div>
          )}

          {/* Requirements */}
          {club?.requirements && (
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-4 border border-yellow-100">
              <h4 className="font-bold text-yellow-900 mb-2 flex items-center text-sm">
                <CheckCircleIcon className="w-4 h-4 mr-2" /> Membership Requirements
              </h4>
              <p className="text-gray-700 text-sm leading-relaxed">{club.requirements}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-end space-x-3">
          <button
            onClick={() => setShowOrganizerClubDetailModal(false)}
            className="px-5 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default OrganizerClubDetailModal
