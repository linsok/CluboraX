import React from 'react'
import { motion } from 'framer-motion'
import { CalendarIcon, TicketIcon, ClockIcon } from '@heroicons/react/24/outline'

const EventRegistrationCard = ({ registration, getStatusColor, viewEvent, formatDate, viewTicket }) => {
  const getRegStatusLabel = (status) => {
    if (status === 'pending_payment') return 'Pending Payment'
    if (status === 'confirmed') return 'Confirmed'
    if (status === 'cancelled') return 'Cancelled'
    return status ? status.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : ''
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      onClick={() => viewEvent(registration)}
      className="bg-white rounded-xl shadow-sm hover:shadow-lg border border-gray-100 p-6 cursor-pointer h-full flex flex-col justify-between"
    >
      <div className="flex-grow flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{registration.eventName}</h3>
            <p className="text-sm text-gray-500">
              {registration.eventDate} at {registration.eventTime}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(registration.status)}`}>
            {getRegStatusLabel(registration.status)}
          </span>
        </div>
        
        <div className="space-y-3 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <CalendarIcon className="w-4 h-4 mr-2 text-gray-400 shrink-0" />
            {registration.eventLocation}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <TicketIcon className="w-4 h-4 mr-2 text-gray-400 shrink-0" />
            Ticket ID: {registration.ticketId}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <ClockIcon className="w-4 h-4 mr-2 text-gray-400 shrink-0" />
            Registered: {formatDate(registration.registeredAt)}
          </div>
        </div>

        {registration.formData.notes && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4 mt-auto">
            <p className="text-sm text-gray-600 line-clamp-2">{registration.formData.notes}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <span className="text-sm font-semibold text-gray-900">
          {registration.eventPrice > 0 ? `$${registration.eventPrice}` : 'Free'}
        </span>
        {registration.status === 'confirmed' && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              viewTicket(registration)
            }}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md flex items-center gap-1.5"
          >
            <TicketIcon className="w-4 h-4" />
            <span>View Ticket</span>
          </button>
        )}
      </div>
    </motion.div>
  )
}

export default EventRegistrationCard
