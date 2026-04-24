import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  XMarkIcon,
  CalendarIcon,
  MapPinIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  SparklesIcon,
  InformationCircleIcon,
  TicketIcon,
  TagIcon,
} from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../api/client'

/**
 * Enhanced Event Detail Modal Component
 * Displays comprehensive event information in an organized, visually appealing layout
 */
const EnhancedEventDetailsModal = ({ show, eventId, onClose, onRegisterEvent }) => {
  const { data: event, isLoading, error } = useQuery({
    queryKey: ['event-details', eventId],
    queryFn: () => eventId ? apiClient.get(`/api/events/${eventId}/`) : Promise.resolve({ data: {} }),
    enabled: !!eventId && show,
    staleTime: 0,
  })

  const eventData = event?.data || {}

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'TBA'
    try {
      return new Date(dateTime).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateTime
    }
  }

  const formatDate = (date) => {
    if (!date) return 'TBA'
    try {
      return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return date
    }
  }

  const daysUntilEvent = eventData.start_datetime ? Math.ceil((new Date(eventData.start_datetime) - new Date()) / (1000 * 60 * 60 * 24)) : null
  const isUpcoming = daysUntilEvent !== null && daysUntilEvent > 0

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
              {/* Header with Poster */}
              <div className="relative h-40 bg-gradient-to-r from-indigo-600 to-blue-600 overflow-hidden">
                {eventData.poster_image && (
                  <>
                    <img
                      src={eventData.poster_image}
                      alt={eventData.title}
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
                  <h2 className="text-3xl font-bold text-white mb-1">{eventData.title || 'Event Details'}</h2>
                  <div className="flex items-center gap-2 text-blue-100">
                    <TagIcon className="w-4 h-4" />
                    <span className="capitalize">{eventData.category || eventData.event_type || 'Event'}</span>
                  </div>
                </div>
              </div>

              {/* Loading State */}
              {isLoading && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading event details...</p>
                  </div>
                </div>
              )}

              {/* Content */}
              {!isLoading && (
                <div className="p-6 space-y-6 overflow-y-auto flex-1">
                  {/* Key Info Box - Quick Overview */}
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-5 border border-indigo-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Date & Time */}
                      <div className="text-center">
                        <div className="flex justify-center mb-2">
                          <CalendarIcon className="w-6 h-6 text-indigo-600" />
                        </div>
                        <p className="text-xs text-gray-600 font-medium">Date & Time</p>
                        <p className="text-sm font-bold text-gray-900">{formatDateTime(eventData.start_datetime)}</p>
                      </div>

                      {/* Location */}
                      <div className="text-center">
                        <div className="flex justify-center mb-2">
                          <MapPinIcon className="w-6 h-6 text-indigo-600" />
                        </div>
                        <p className="text-xs text-gray-600 font-medium">Venue</p>
                        <p className="text-sm font-bold text-gray-900 truncate">{eventData.venue || 'TBA'}</p>
                      </div>

                      {/* Participants */}
                      <div className="text-center">
                        <div className="flex justify-center mb-2">
                          <UserGroupIcon className="w-6 h-6 text-indigo-600" />
                        </div>
                        <p className="text-xs text-gray-600 font-medium">Capacity</p>
                        <p className="text-sm font-bold text-gray-900">{eventData.max_participants || '∞'}</p>
                      </div>

                      {/* Status */}
                      <div className="text-center">
                        <div className="flex justify-center mb-2">
                          <CheckCircleIcon className={`w-6 h-6 ${
                            isUpcoming
                              ? 'text-green-600'
                              : eventData.status === 'cancelled'
                              ? 'text-red-600'
                              : 'text-blue-600'
                          }`} />
                        </div>
                        <p className="text-xs text-gray-600 font-medium">Status</p>
                        <p className={`text-sm font-bold capitalize ${
                          isUpcoming
                            ? 'text-green-700'
                            : eventData.status === 'cancelled'
                            ? 'text-red-700'
                            : 'text-blue-700'
                        }`}>
                          {isUpcoming ? `In ${daysUntilEvent}d` : eventData.status?.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Description Section */}
                  {eventData.description && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                        <InformationCircleIcon className="w-5 h-5 mr-2 text-indigo-600" />
                        About This Event
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-base">{eventData.description}</p>
                    </div>
                  )}

                  {/* Event Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Date & Time Details */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                      <h4 className="font-bold text-green-900 mb-4 flex items-center text-sm">
                        <CalendarIcon className="w-5 h-5 mr-2" />
                        Event Schedule
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="text-gray-600 font-medium">Start</p>
                          <p className="text-gray-900 font-semibold">{formatDateTime(eventData.start_datetime)}</p>
                        </div>
                        {eventData.end_datetime && (
                          <div>
                            <p className="text-gray-600 font-medium">End</p>
                            <p className="text-gray-900 font-semibold">{formatDateTime(eventData.end_datetime)}</p>
                          </div>
                        )}
                        {eventData.registration_deadline && (
                          <div>
                            <p className="text-gray-600 font-medium">Registration Deadline</p>
                            <p className="text-gray-900 font-semibold">{formatDate(eventData.registration_deadline)}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Location & Capacity */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                      <h4 className="font-bold text-purple-900 mb-4 flex items-center text-sm">
                        <MapPinIcon className="w-5 h-5 mr-2" />
                        Location & Capacity
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="text-gray-600 font-medium">Venue</p>
                          <p className="text-gray-900 font-semibold">{eventData.venue || 'TBA'}</p>
                        </div>
                        {eventData.max_participants && (
                          <div>
                            <p className="text-gray-600 font-medium">Max Participants</p>
                            <p className="text-gray-900 font-semibold">{eventData.max_participants}</p>
                          </div>
                        )}
                        {eventData.event_type && (
                          <div>
                            <p className="text-gray-600 font-medium">Event Type</p>
                            <p className="text-gray-900 font-semibold capitalize">{eventData.event_type}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pricing Section */}
                  {eventData.is_paid && eventData.price && (
                    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-5 border border-yellow-200">
                      <h4 className="font-bold text-yellow-900 mb-4 flex items-center text-base">
                        <CurrencyDollarIcon className="w-5 h-5 mr-2" />
                        Event Fee
                      </h4>
                      <div className="flex items-baseline">
                        <span className="text-4xl font-bold text-yellow-900">${parseFloat(eventData.price).toFixed(2)}</span>
                        <span className="text-gray-700 ml-2">per participant</span>
                      </div>
                    </div>
                  )}

                  {eventData.is_paid === false && (
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-200">
                      <h4 className="font-bold text-blue-900 mb-2 flex items-center text-base">
                        <TicketIcon className="w-5 h-5 mr-2" />
                        Registration
                      </h4>
                      <p className="text-gray-700 font-semibold">Free Event - No registration fee required</p>
                    </div>
                  )}

                  {/* Organizer Info */}
                  {eventData.created_by && (
                    <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-4 border border-cyan-200">
                      <h4 className="font-bold text-cyan-900 mb-4 flex items-center text-sm">
                        <UserGroupIcon className="w-5 h-5 mr-2" />
                        Organizer
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-900 font-semibold">
                          {eventData.created_by.first_name} {eventData.created_by.last_name}
                        </p>
                        {eventData.created_by.email && (
                          <a href={`mailto:${eventData.created_by.email}`} className="text-blue-600 hover:underline">
                            {eventData.created_by.email}
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Club Association */}
                  {eventData.club && (
                    <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200">
                      <h4 className="font-bold text-orange-900 mb-4 flex items-center text-sm">
                        <TagIcon className="w-5 h-5 mr-2" />
                        Organized By
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-900 font-semibold">{eventData.club.name}</p>
                        {eventData.club.description && (
                          <p className="text-gray-700 text-xs">{eventData.club.description.substring(0, 100)}...</p>
                        )}
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
                {isUpcoming && (
                  <button
                    onClick={() => {
                      onClose()
                      onRegisterEvent && onRegisterEvent(eventData)
                    }}
                    className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-colors duration-300 font-medium flex items-center gap-2"
                  >
                    <TicketIcon className="w-4 h-4" />
                    Register Now
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default EnhancedEventDetailsModal
