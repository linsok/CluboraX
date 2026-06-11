import React from 'react'
import { motion } from 'framer-motion'
import { EnvelopeIcon, BuildingOfficeIcon, ClockIcon } from '@heroicons/react/24/outline'

const ClubRequestCard = ({ request, getStatusColor, viewClubDetails, formatDate }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -5, scale: 1.02 }}
    transition={{ duration: 0.3 }}
    onClick={() => viewClubDetails(request)}
    className="bg-white rounded-xl shadow-sm hover:shadow-lg border border-gray-100 p-6 cursor-pointer h-full flex flex-col justify-between"
  >
    <div className="flex-grow flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{request.clubName}</h3>
          <p className="text-sm text-gray-500">{request.clubCategory}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
          {request.status}
        </span>
      </div>
      
      <div className="space-y-3 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <EnvelopeIcon className="w-4 h-4 mr-2 text-gray-400 shrink-0" />
          {request.formData.email}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <BuildingOfficeIcon className="w-4 h-4 mr-2 text-gray-400 shrink-0" />
          {request.formData.studentId}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <ClockIcon className="w-4 h-4 mr-2 text-gray-400 shrink-0" />
          Submitted: {formatDate(request.submittedAt)}
        </div>
      </div>

      {request.formData.message && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4 mt-auto">
          <p className="text-sm text-gray-600 line-clamp-2">{request.formData.message}</p>
        </div>
      )}
    </div>

    <div className="flex items-center justify-between text-sm mt-4 pt-4 border-t border-gray-100">
      <span className="text-gray-500">
        Year: {request.formData.year} • Major: {request.formData.major}
      </span>
    </div>
  </motion.div>
)

export default ClubRequestCard
