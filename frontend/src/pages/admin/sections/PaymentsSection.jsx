import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  BanknotesIcon,
  CalendarIcon,
  EyeIcon,
  XCircleIcon,
  CheckCircleIcon,
  XMarkIcon,
  DocumentTextIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'

const PaymentsSection = ({ feeSubmissions = [], feeLoading, confirmFeePayment, rejectFeePayment }) => {
  const [feeFilterStatus, setFeeFilterStatus] = useState('all')
  const [selectedFeeProof, setSelectedFeeProof] = useState(null)

  const feePending = feeSubmissions.filter(f => f.status === 'pending_confirmation').length
  const feeConfirmed = feeSubmissions.filter(f => f.status === 'confirmed').length
  const totalConfirmedRevenue = feeSubmissions
    .filter(f => f.status === 'confirmed')
    .reduce((sum, f) => sum + f.platformFee, 0)
  const filtered = feeSubmissions.filter(f =>
    feeFilterStatus === 'all' || f.status === feeFilterStatus
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-white">Payments</h2>
          <p className="text-gray-400 text-sm mt-1">Review and confirm platform fees submitted by event organizers for paid events</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-xl border border-amber-700 p-5">
          <p className="text-amber-400 text-sm font-medium">Awaiting Confirmation</p>
          <p className="text-3xl font-bold text-white mt-1">{feePending}</p>
          <p className="text-gray-500 text-xs mt-1">platform fee submissions</p>
        </div>
        <div className="bg-gray-800 rounded-xl border border-green-700 p-5">
          <p className="text-green-400 text-sm font-medium">Confirmed</p>
          <p className="text-3xl font-bold text-white mt-1">{feeConfirmed}</p>
          <p className="text-gray-500 text-xs mt-1">fee payments approved</p>
        </div>
        <div className="bg-gray-800 rounded-xl border border-blue-700 p-5">
          <p className="text-blue-400 text-sm font-medium">Platform Revenue</p>
          <p className="text-3xl font-bold text-white mt-1">${totalConfirmedRevenue.toFixed(2)}</p>
          <p className="text-gray-500 text-xs mt-1">from confirmed fees</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {['all', 'pending_confirmation', 'confirmed', 'rejected'].map(s => (
          <button
            key={s}
            onClick={() => setFeeFilterStatus(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              feeFilterStatus === s ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {s === 'all' ? 'All' :
             s === 'pending_confirmation' ? `Pending (${feePending})` :
             s === 'confirmed' ? 'Confirmed' : 'Rejected'}
          </button>
        ))}
      </div>

      {/* Payment cards */}
      {filtered.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
          <BanknotesIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No fee submissions found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(fee => {
            const status = fee.status
            return (
              <div key={fee.id} className={`bg-gray-800 rounded-xl border p-6 ${
                status === 'pending_confirmation' ? 'border-amber-600' :
                status === 'confirmed' ? 'border-green-700' :
                'border-red-800'
              }`}>
                <div className="flex items-start justify-between gap-6 flex-wrap">
                  {/* Left: event + fee info */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <CalendarIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold text-white">{fee.eventTitle}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${
                          status === 'pending_confirmation' ? 'bg-amber-900 text-amber-300' :
                          status === 'confirmed' ? 'bg-green-900 text-green-300' :
                          'bg-red-900 text-red-300'
                        }`}>
                          {status === 'pending_confirmation' ? 'Pending' :
                           status === 'confirmed' ? 'Confirmed' : 'Rejected'}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mt-0.5">{fee.organizer} &mdash; <span className="text-gray-500">{fee.organizerEmail}</span></p>
                      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-1.5 text-sm">
                        <div>
                          <span className="text-gray-500 text-xs">Ticket Price</span>
                          <p className="text-white font-medium">${fee.ticketPrice.toFixed(2)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs">Method</span>
                          <p className="text-white font-medium">{fee.paymentMethod}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs">Transaction ID</span>
                          <p className="text-white font-mono text-xs">{fee.transactionId}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs">Submitted</span>
                          <p className="text-white font-medium">{new Date(fee.submittedAt).toLocaleString()}</p>
                        </div>
                      </div>
                      {fee.platformFee > 0 && (
                        <div className="mt-3 flex gap-6 text-sm">
                          <span className="text-gray-500">Expected revenue: <span className="text-green-400 font-medium">${fee.expectedRevenue.toFixed(2)}</span></span>
                          <span className="text-gray-500">Platform fee (3%): <span className="text-amber-400 font-medium">${fee.platformFee.toFixed(2)}</span></span>
                          <span className="text-gray-500">Net payout: <span className="text-blue-400 font-medium">${fee.netPayout.toFixed(2)}</span></span>
                        </div>
                      )}
                      {status === 'rejected' && fee.rejectionReason && (
                        <p className="mt-2 text-xs text-red-400 bg-red-900/30 rounded px-3 py-1.5">
                          Rejection note: {fee.rejectionReason}
                        </p>
                      )}
                      {fee.note && status !== 'rejected' && (
                        <p className="mt-2 text-xs text-gray-400 italic">&ldquo;{fee.note}&rdquo;</p>
                      )}
                    </div>
                  </div>

                  {/* Right: proof + actions */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <button
                      onClick={() => setSelectedFeeProof(fee)}
                      className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 border border-blue-800 bg-gray-700 hover:bg-gray-600 rounded-lg px-4 py-2 transition-all"
                    >
                      <EyeIcon className="w-4 h-4" />
                      View Proof {fee.proofType === 'pdf' ? '(PDF)' : '(Image)'}
                    </button>
                    {status === 'pending_confirmation' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => rejectFeePayment(fee)}
                          className="flex items-center gap-1.5 text-sm text-red-400 border border-red-800 bg-gray-700 hover:bg-gray-600 rounded-lg px-4 py-2 font-medium transition-all"
                        >
                          <XCircleIcon className="w-4 h-4" />
                          Reject
                        </button>
                        <button
                          onClick={() => confirmFeePayment(fee)}
                          className="flex items-center gap-1.5 text-sm text-white bg-green-700 hover:bg-green-600 rounded-lg px-4 py-2 font-medium transition-all"
                        >
                          <CheckCircleIcon className="w-4 h-4" />
                          Confirm
                        </button>
                      </div>
                    )}
                    {status === 'confirmed' && (
                      <span className="flex items-center gap-1 text-sm text-green-400 font-medium">
                        <CheckCircleIcon className="w-4 h-4" /> Confirmed
                      </span>
                    )}
                    {status === 'rejected' && (
                      <button
                        onClick={() => confirmFeePayment(fee)}
                        className="text-sm text-amber-400 border border-amber-700 bg-gray-700 hover:bg-gray-600 rounded-lg px-4 py-2 font-medium transition-all"
                      >
                        Re-confirm
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Proof Preview Modal */}
      {selectedFeeProof && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedFeeProof(null)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            onClick={e => e.stopPropagation()}
            className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-lg w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-lg">Payment Proof</h3>
              <button onClick={() => setSelectedFeeProof(null)} className="p-1.5 hover:bg-gray-700 rounded-full text-gray-400">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-1.5 text-sm text-gray-300 mb-5">
              <div><span className="text-gray-500">Event:</span> {selectedFeeProof.eventTitle}</div>
              <div><span className="text-gray-500">Organizer:</span> {selectedFeeProof.organizer}</div>
              <div><span className="text-gray-500">Transaction ID:</span> <span className="font-mono text-xs text-amber-300">{selectedFeeProof.transactionId}</span></div>
              <div><span className="text-gray-500">Method:</span> {selectedFeeProof.paymentMethod}</div>
              <div><span className="text-gray-500">Submitted:</span> {new Date(selectedFeeProof.submittedAt).toLocaleString()}</div>
            </div>
            {selectedFeeProof.proofType === 'pdf' ? (
              <div className="flex flex-col items-center justify-center bg-gray-700 rounded-xl p-8 gap-3">
                <DocumentTextIcon className="w-16 h-16 text-gray-400" />
                <p className="text-sm text-gray-400">PDF receipt uploaded by organizer</p>
                <button className="text-xs text-blue-400 underline">Download PDF</button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center bg-gray-700 rounded-xl p-8 gap-3">
                <PhotoIcon className="w-16 h-16 text-gray-400" />
                <p className="text-sm text-gray-400">Payment screenshot uploaded by organizer</p>
                <p className="text-xs text-gray-500">(Image preview requires backend integration)</p>
              </div>
            )}
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { rejectFeePayment(selectedFeeProof); setSelectedFeeProof(null) }}
                className="flex-1 py-2.5 border border-red-700 text-red-400 rounded-lg text-sm font-medium hover:bg-red-900/30 transition-all"
              >
                Reject
              </button>
              <button
                onClick={() => { confirmFeePayment(selectedFeeProof); setSelectedFeeProof(null) }}
                className="flex-1 py-2.5 bg-green-700 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-all"
              >
                Confirm Payment
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default PaymentsSection
