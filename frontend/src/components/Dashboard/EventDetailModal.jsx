import React from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { getEventRegistrations } from '../../api/events'
import { XMarkIcon, CalendarIcon, MapPinIcon, TicketIcon, TagIcon, InformationCircleIcon, UsersIcon, CheckCircleIcon, ExclamationTriangleIcon, AcademicCapIcon, ClockIcon, DocumentTextIcon, PlusIcon } from '@heroicons/react/24/outline'

const EventDetailModal = ({ selectedEvent, setShowEventDetailModal, queryClient }) => {
  const formatDateTime = (datetime) => {
    if (!datetime) return 'N/A'
    try {
      const date = new Date(datetime)
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', weekday: 'short' }) + ' at ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    } catch { return 'N/A' }
  }

  // Safe field accessors with smart fallbacks
  const getEventDate = () => {
    if (selectedEvent?.eventDate) return new Date(selectedEvent.eventDate).toLocaleDateString()
    if (selectedEvent?.proposed_date) return new Date(selectedEvent.proposed_date).toLocaleDateString()
    if (selectedEvent?.start_datetime) return new Date(selectedEvent.start_datetime).toLocaleDateString()
    return 'TBA'
  }

  const getEventTime = () => {
    if (selectedEvent?.event_time) return selectedEvent.event_time
    if (selectedEvent?.start_datetime) {
      const time = new Date(selectedEvent.start_datetime)
      return time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }
    return 'TBA'
  }

  const getVenue = () => {
    return selectedEvent?.venue || selectedEvent?.specificLocation || 'TBA'
  }

  const getCapacity = () => {
    return selectedEvent?.capacity || selectedEvent?.expected_participants || selectedEvent?.max_participants || '0'
  }

  const getPrice = () => {
    const price = selectedEvent?.price || selectedEvent?.ticketPrice
    return price ? `$${parseFloat(price).toFixed(2)}` : 'Free'
  }

  const getDescription = () => {
    return selectedEvent?.description || 'No description provided'
  }

  const getAgenda = () => {
    return selectedEvent?.agenda_description || selectedEvent?.agenda || null
  }

  const getRequirements = () => {
    return selectedEvent?.requirements || selectedEvent?.special_requirements || null
  }

  const getSpecialRequirements = () => {
    return selectedEvent?.special_requirements || null
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={() => setShowEventDetailModal(false)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header with Image */}
        {selectedEvent?.poster_image && (
          <div className="relative h-40 bg-gradient-to-r from-blue-400 to-indigo-600 overflow-hidden">
            <img src={selectedEvent.poster_image} alt={selectedEvent.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/30" />
          </div>
        )}
        
        {/* Header */}
        <div className={`p-6 text-white relative ${ selectedEvent?.poster_image ? 'bg-gradient-to-r from-blue-600 to-indigo-600 -mt-8 relative z-10' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`}>
          <button
            onClick={() => setShowEventDetailModal(false)}
            className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
          <h2 className="text-3xl font-bold mb-2">{selectedEvent?.title || 'Event Details'}</h2>
          <p className="text-blue-100 flex items-center">
            <SparklesIcon className="w-4 h-4 mr-2" />
            {selectedEvent?.event_type || selectedEvent?.category || 'Campus Event'}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Description */}
          {getDescription() && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                <InformationCircleIcon className="w-5 h-5 mr-2 text-blue-600" />
                About This Event
              </h3>
              <p className="text-gray-700 leading-relaxed text-sm">{getDescription()}</p>
            </div>
          )}

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date & Time */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
              <h4 className="font-bold text-blue-900 mb-3 flex items-center text-sm">
                <CalendarIcon className="w-4 h-4 mr-2" /> When
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-600 font-medium">Date</p>
                  <p className="text-gray-900 font-semibold">{getEventDate()}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Time</p>
                  <p className="text-gray-900 font-semibold">{getEventTime()}</p>
                </div>
              </div>
            </div>

            {/* Location & Capacity */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
              <h4 className="font-bold text-indigo-900 mb-3 flex items-center text-sm">
                <MapPinIcon className="w-4 h-4 mr-2" /> Location & Capacity
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-600 font-medium">Venue</p>
                  <p className="text-gray-900 font-semibold">{getVenue()}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Max Capacity</p>
                  <p className="text-gray-900 font-semibold">{getCapacity()} people</p>
                </div>
              </div>
            </div>
          </div>

          {/* Cost & Registration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
              <h4 className="font-bold text-green-900 mb-3 flex items-center text-sm">
                <TicketIcon className="w-4 h-4 mr-2" /> Cost
              </h4>
              <div className="text-sm">
                <p className="text-gray-600 font-medium">Fee</p>
                <p className="text-gray-900 font-bold text-lg">{getPrice()}</p>
              </div>
            </div>

            {selectedEvent?.registration_deadline && (
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-100">
                <h4 className="font-bold text-orange-900 mb-3 flex items-center text-sm">
                  <ClockIcon className="w-4 h-4 mr-2" /> Registration Deadline
                </h4>
                <p className="text-gray-900 font-semibold text-sm">{formatDateTime(selectedEvent.registration_deadline)}</p>
              </div>
            )}
          </div>

          {/* Requirements */}
          {getRequirements() && (
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-100">
              <h4 className="font-bold text-amber-900 mb-2 flex items-center text-sm">
                <CheckCircleIcon className="w-4 h-4 mr-2" /> Requirements
              </h4>
              <p className="text-gray-700 text-sm leading-relaxed">{getRequirements()}</p>
            </div>
          )}

          {/* Agenda Description */}
          {getAgenda() && (
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-4 border border-violet-100">
              <h4 className="font-bold text-violet-900 mb-2 flex items-center text-sm">
                <DocumentTextIcon className="w-4 h-4 mr-2" /> Agenda
              </h4>
              <p className="text-gray-700 text-sm leading-relaxed">{getAgenda()}</p>
            </div>
          )}

          {/* Special Requirements */}
          {getSpecialRequirements() && (
            <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-4 border border-rose-100">
              <h4 className="font-bold text-rose-900 mb-2 flex items-center text-sm">
                <ExclamationTriangleIcon className="w-4 h-4 mr-2" /> Special Requirements
              </h4>
              <p className="text-gray-700 text-sm leading-relaxed">{getSpecialRequirements()}</p>
            </div>
          )}

          {/* Organizer Information */}
          {(selectedEvent?.organizerName || selectedEvent?.submitted_by_details) && (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
              <h4 className="font-bold text-emerald-900 mb-3 flex items-center text-sm">
                <UserIcon className="w-4 h-4 mr-2" /> Event Organizer
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-600 font-medium">Name</p>
                  <p className="text-gray-900 font-semibold">{selectedEvent?.organizerName || selectedEvent?.submitted_by_details?.first_name + ' ' + selectedEvent?.submitted_by_details?.last_name || 'Event Organizer'}</p>
                </div>
                {selectedEvent?.organizerEmail && (
                  <div>
                    <p className="text-gray-600 font-medium">Email</p>
                    <a href={`mailto:${selectedEvent.organizerEmail}`} className="text-emerald-600 hover:underline font-medium text-xs truncate">
                      {selectedEvent.organizerEmail}
                    </a>
                  </div>
                )}
                {selectedEvent?.organizerPhone && (
                  <div>
                    <p className="text-gray-600 font-medium">Phone</p>
                    <p className="text-gray-900 font-semibold">{selectedEvent.organizerPhone}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {selectedEvent?.tags && selectedEvent.tags.length > 0 && (
            <div>
              <h4 className="font-bold text-gray-900 mb-3 flex items-center text-sm">
                <TagIcon className="w-4 h-4 mr-2" /> Topics
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedEvent.tags.map((tag, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-end space-x-3">
          <button
            onClick={() => setShowEventDetailModal(false)}
            className="px-5 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
          >
            Close
          </button>
          {!isOrganizer && (
            <button
              onClick={() => {
                setShowEventDetailModal(false)
                const ticket = myEventRegistrations?.find(reg => reg.id === selectedEvent?.id)
                if (ticket) viewTicket(ticket)
              }}
              className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-medium shadow-md hover:shadow-lg"
            >
              <TicketIcon className="w-5 h-5" />
              View Ticket
            </button>
          )}
          {isOrganizer && (
            <button
              onClick={() => {
                setShowEventDetailModal(false)
                viewEventRegistrations(selectedEvent)
              }}
              className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-medium shadow-md hover:shadow-lg"
            >
              <UsersIcon className="w-5 h-5" />
              View Registrations
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// Organizer Club Detail Modal

export default EventDetailModal
