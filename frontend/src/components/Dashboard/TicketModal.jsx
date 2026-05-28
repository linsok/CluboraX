import React from 'react'
import { motion } from 'framer-motion'
import { XMarkIcon, QrCodeIcon, TicketIcon } from '@heroicons/react/24/outline'

const TicketModal = ({ selectedTicket, setShowTicketModal, downloadTicket }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    onClick={() => setShowTicketModal(false)}
  >
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      onClick={(e) => e.stopPropagation()}
      className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white text-center">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-1">Event Ticket</h2>
            <p className="text-green-100">{selectedTicket?.eventName}</p>
          </div>
          <button
            onClick={() => setShowTicketModal(false)}
            className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Ticket Content */}
      <div className="p-6 space-y-6">
        {/* QR Code */}
        <div className="flex justify-center">
          <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-gray-200">
            <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <QrCodeIcon className="w-16 h-16 text-gray-400 mb-2" />
                <p className="text-xs text-gray-500">QR Code</p>
                <p className="text-xs text-gray-400 mt-1">{selectedTicket?.ticketId?.substring(0, 8)}...</p>
              </div>
            </div>
          </div>
        </div>

        {/* Ticket Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3 text-center">Ticket Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="font-medium text-gray-600">Ticket ID:</span>
              <span className="text-gray-900">{selectedTicket?.ticketId}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-600">Event:</span>
              <span className="text-gray-900">{selectedTicket?.eventName}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-600">Date:</span>
              <span className="text-gray-900">{selectedTicket?.eventDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-600">Time:</span>
              <span className="text-gray-900">{selectedTicket?.eventTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-600">Location:</span>
              <span className="text-gray-900">{selectedTicket?.eventLocation}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-600">Attendee:</span>
              <span className="text-gray-900">{selectedTicket?.formData.name}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={() => setShowTicketModal(false)}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            Close
          </button>
          <button
            onClick={() => downloadTicket(selectedTicket)}
            className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-medium"
          >
            <TicketIcon className="w-5 h-5" />
            Download
          </button>
        </div>
      </div>
    </motion.div>
  </motion.div>
)


export default TicketModal
