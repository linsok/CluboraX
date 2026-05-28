import React from 'react'
import { motion } from 'framer-motion'
import { UserGroupIcon, TagIcon, UsersIcon, ClockIcon, EyeIcon, PhotoIcon } from '@heroicons/react/24/outline'

const StudentOrganizedClubCard = ({ club, setSelectedOrganizerClub, setShowOrganizerClubDetailModal, viewClubMembers, openImageUploadModal }) => {
  const getStatusBadgeClass = (status) => {
    const s = (status || '').toLowerCase()
    if (s === 'published' || s === 'active' || s === 'approved') {
      return 'bg-green-50 text-green-700 border border-green-200/60'
    }
    if (s === 'pending') {
      return 'bg-yellow-50 text-yellow-700 border border-yellow-200/60'
    }
    return 'bg-gray-50 text-gray-700 border border-gray-200/60'
  }

  const foundedDate = club.start_date 
    ? new Date(club.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) 
    : (club.submitted_date 
       ? new Date(club.submitted_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) 
       : 'N/A')

  const handleView = () => {
    const clubData = {
      ...club,
      category: club.club_type || 'General',
      members: club.expected_members || 0,
      requirements: club.requirements || 'No specific requirements',
      mission_statement: club.mission || '',
      advisor_name: club.advisor_name || 'TBA',
      advisor_email: club.advisor_email || '',
      meeting_schedule: club.meeting_schedule || 'TBA',
      tags: [],
      status: 'published'
    }
    setSelectedOrganizerClub(clubData)
    setShowOrganizerClubDetailModal(true)
  }

  const handleMembers = () => {
    const clubData = {
      id: club.id,
      name: club.name,
      member_count: club.expected_members || 0
    }
    viewClubMembers(clubData)
  }

  const handleImage = (e) => {
    const clubData = {
      id: club.id,
      title: club.name,
      name: club.name
    }
    openImageUploadModal(clubData, e)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-2xl border border-gray-200/60 p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.06)] transition-all duration-200 flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 pr-4">
            <h4 className="text-lg font-bold text-gray-900 leading-snug mb-1">{club.name}</h4>
            <p className="text-xs text-gray-500 font-medium capitalize">
              {club.club_type || 'General'} Club
            </p>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 capitalize ${getStatusBadgeClass(club.status || 'published')}`}>
            {club.status || 'Published'}
          </span>
        </div>

        <div className="space-y-3 my-5">
          <div className="flex items-center text-sm text-gray-600">
            <TagIcon className="w-4 h-4 text-gray-400 mr-2.5 flex-shrink-0" />
            <span className="capitalize">{club.club_type || 'General'}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <UsersIcon className="w-4 h-4 text-gray-400 mr-2.5 flex-shrink-0" />
            <span>{club.expected_members ?? 0} expected members</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <ClockIcon className="w-4 h-4 text-gray-400 mr-2.5 flex-shrink-0" />
            <span>Created: {foundedDate}</span>
          </div>
        </div>
      </div>

      <div>
        <div className="pt-1 pb-4">
          <span className="text-sm font-semibold text-gray-500">
            Active
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
          <button
            onClick={handleView}
            className="flex items-center justify-center gap-1 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl transition-all font-semibold text-xs"
          >
            <EyeIcon className="w-3.5 h-3.5" />
            View
          </button>
          <button
            onClick={handleMembers}
            className="flex items-center justify-center gap-1 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-all font-semibold text-xs"
          >
            <UserGroupIcon className="w-3.5 h-3.5" />
            Members
          </button>
          <button
            onClick={handleImage}
            className="flex items-center justify-center gap-1 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl transition-all font-semibold text-xs"
          >
            <PhotoIcon className="w-3.5 h-3.5" />
            Image
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default StudentOrganizedClubCard
