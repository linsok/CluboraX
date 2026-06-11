import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getEventRegistrations } from '../../api/events'
import { apiClient } from '../../api/client'
import {
  XMarkIcon,
  DocumentTextIcon,
  UsersIcon,
  TicketIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  PhotoIcon,
  ArrowDownTrayIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'

/* ─── helpers ──────────────────────────────────────────────────── */
// DB payment_status values: pending | verified | rejected
// DB registration status values: pending_payment | confirmed | cancelled
const statusStyle = (s) => {
  switch (s) {
    case 'verified':             return 'bg-green-100 text-green-700 border border-green-200'
    case 'pending':              return 'bg-amber-100 text-amber-700 border border-amber-200'
    case 'rejected':             return 'bg-red-100 text-red-700 border border-red-200'
    default:                     return 'bg-gray-100 text-gray-600 border border-gray-200'
  }
}
const statusLabel = (s) => {
  switch (s) {
    case 'verified':             return 'Verified'
    case 'pending':              return 'Pending'
    case 'rejected':             return 'Rejected'
    default:                     return 'N/A'
  }
}

const Avatar = ({ name, size = 'md' }) => {
  const s = size === 'lg' ? 'w-14 h-14 text-xl' : 'w-9 h-9 text-sm'
  return (
    <div className={`${s} rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  )
}

/* ─── payment proof viewer ──────────────────────────────────────── */
const ProofViewer = ({ url, type }) => {
  if (!url) return (
    <div className="flex flex-col items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 py-10 gap-3">
      <PhotoIcon className="w-12 h-12 text-gray-300" />
      <p className="text-sm text-gray-400">No payment proof uploaded</p>
    </div>
  )
  if (type === 'pdf') return (
    <div className="flex flex-col items-center gap-3 bg-red-50 rounded-xl p-6 border border-red-100">
      <DocumentTextIcon className="w-14 h-14 text-red-400" />
      <p className="text-sm text-gray-600 font-medium">PDF receipt attached</p>
      <a href={url} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
        <ArrowDownTrayIcon className="w-4 h-4" /> Download PDF
      </a>
    </div>
  )
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200">
      <img
        src={url}
        alt="Payment proof"
        className="w-full max-h-72 object-contain bg-gray-50"
        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
      />
      <div className="hidden flex-col items-center gap-2 py-8 bg-gray-50">
        <PhotoIcon className="w-10 h-10 text-gray-300" />
        <p className="text-sm text-gray-400">Could not load image</p>
      </div>
      <div className="flex justify-end p-2 bg-gray-50 border-t border-gray-100">
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium">
          <ArrowDownTrayIcon className="w-3.5 h-3.5" /> Open full size
        </a>
      </div>
    </div>
  )
}

/* ─── main component ────────────────────────────────────────────── */
const RegistrationsModal = ({ selectedEventForRegistrations, setShowRegistrationsModal, queryClient: qcProp, formatDate }) => {
  const isPaidEvent = (selectedEventForRegistrations?.price || 0) > 0
  const queryClient = useQueryClient()

  const { data: rawRegistrations = [], isLoading } = useQuery({
    queryKey: ['event-registrations', selectedEventForRegistrations?.id],
    queryFn: () => getEventRegistrations(selectedEventForRegistrations.id),
    enabled: !!selectedEventForRegistrations?.id,
    staleTime: 60 * 1000,
  })

  const normalize = (reg) => ({
    id: reg.id,
    name: reg.user?.full_name || reg.user?.first_name || reg.user?.email || 'Unknown',
    email: reg.user?.email || '',
    phone: reg.user?.phone || 'N/A',
    studentId: reg.user?.student_id || 'N/A',
    major: reg.user?.major || '—',
    year: reg.user?.year || '—',
    registeredAt: reg.registration_date || reg.created_at,
    status: reg.status,                        // pending_payment | confirmed | cancelled
    ticketId: reg.qr_code || String(reg.id),
    notes: reg.notes || '',
    paymentStatus: reg.payment_status || null, // pending | verified | rejected (null = no payment yet)
    paymentAmount: parseFloat(reg.event_price) || selectedEventForRegistrations?.price || 0,
    paymentMethod: 'KHQR',
    proofType: reg.payment_receipt
      ? (String(reg.payment_receipt).toLowerCase().endsWith('.pdf') ? 'pdf' : 'image')
      : null,
    receiptUrl: reg.payment_receipt_url || reg.payment_receipt || null,
    transactionInfo: reg.transaction_info || null,
  })

  const registrations = isLoading ? [] : rawRegistrations.map(normalize)

  const [payStatuses, setPayStatuses] = React.useState({})
  const [detailReg, setDetailReg] = React.useState(null) // the reg shown in the side drawer

  React.useEffect(() => {
    if (registrations.length > 0)
      setPayStatuses(Object.fromEntries(registrations.map(r => [r.id, r.paymentStatus])))
  }, [registrations.length])

  const pendingCount   = Object.values(payStatuses).filter(s => s === 'pending').length
  const confirmedCount = Object.values(payStatuses).filter(s => s === 'verified').length
  const rejectedCount  = Object.values(payStatuses).filter(s => s === 'rejected').length
  const totalCollected = confirmedCount * (selectedEventForRegistrations?.price || 0)

  const approvePayment = async (reg) => {
    try {
      await apiClient.patch(`/api/events/registrations/${reg.id}/`, {
        payment_status: 'verified',
        status: 'confirmed',
      })
      setPayStatuses(p => ({ ...p, [reg.id]: 'verified' }))
      if (detailReg?.id === reg.id) setDetailReg(r => ({ ...r, paymentStatus: 'verified', status: 'confirmed' }))
      queryClient.invalidateQueries(['event-registrations', selectedEventForRegistrations?.id])
      toast.success(`✅ Payment approved for ${reg.name}`)
    } catch (err) {
      console.error('approve error', err)
      toast.error('Failed to approve payment: ' + (err.response?.data?.detail || err.message))
    }
  }

  const rejectPayment = async (reg) => {
    try {
      await apiClient.patch(`/api/events/registrations/${reg.id}/`, {
        payment_status: 'rejected',
        status: 'pending_payment',
      })
      setPayStatuses(p => ({ ...p, [reg.id]: 'rejected' }))
      if (detailReg?.id === reg.id) setDetailReg(r => ({ ...r, paymentStatus: 'rejected', status: 'pending_payment' }))
      queryClient.invalidateQueries(['event-registrations', selectedEventForRegistrations?.id])
      toast.error(`❌ Payment rejected for ${reg.name} — student will be notified`)
    } catch (err) {
      console.error('reject error', err)
      toast.error('Failed to reject payment: ' + (err.response?.data?.detail || err.message))
    }
  }

  const exportCSV = () => {
    const header = ['Name', 'Email', 'Phone', 'Student ID', 'Registered', 'Status', 'Payment']
    const rows = registrations.map(r => [
      r.name, r.email, r.phone, r.studentId,
      new Date(r.registeredAt).toLocaleString(),
      r.status, payStatuses[r.id] || r.paymentStatus
    ])
    const csv = [header, ...rows].map(r => r.join(',')).join('\n')
    const a = Object.assign(document.createElement('a'), {
      href: 'data:text/csv,' + encodeURIComponent(csv),
      download: `${selectedEventForRegistrations?.title || 'event'}-registrations.csv`
    })
    a.click()
    toast.success('Exported!')
  }

  return (
    <>
      {/* ── Backdrop + Main Modal ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={() => setShowRegistrationsModal(false)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={e => e.stopPropagation()}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[1400px] max-h-[92vh] overflow-hidden flex flex-col"
        >
          {/* ── Header ── */}
          <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-gray-600 p-6 text-white flex-shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Event Registrations</h2>
                <p className="text-purple-100 mt-0.5">{selectedEventForRegistrations?.title}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="flex items-center gap-1 text-xs bg-white/20 text-white px-2.5 py-1 rounded-full font-medium">
                    <UsersIcon className="w-3.5 h-3.5" />
                    {registrations.length} total
                  </span>
                  {isPaidEvent && pendingCount > 0 && (
                    <span className="flex items-center gap-1 text-xs bg-amber-400 text-amber-900 px-2.5 py-1 rounded-full font-bold">
                      <ClockIcon className="w-3.5 h-3.5" />
                      {pendingCount} pending payment{pendingCount > 1 ? 's' : ''}
                    </span>
                  )}
                  {isPaidEvent && (
                    <span className="flex items-center gap-1 text-xs bg-white/20 text-white px-2.5 py-1 rounded-full font-medium">
                      <CurrencyDollarIcon className="w-3.5 h-3.5" />
                      Collected: ${totalCollected.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowRegistrationsModal(false)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors flex-shrink-0"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Summary stats */}
            {isPaidEvent && (
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  { label: 'Pending', value: pendingCount,   color: 'bg-amber-400/30 text-amber-100' },
                  { label: 'Confirmed', value: confirmedCount, color: 'bg-green-400/30 text-green-100' },
                  { label: 'Rejected', value: rejectedCount,  color: 'bg-red-400/30 text-red-100' },
                ].map(s => (
                  <div key={s.label} className={`${s.color} rounded-xl px-4 py-2.5 text-center backdrop-blur-sm`}>
                    <p className="text-xl font-bold">{s.value}</p>
                    <p className="text-xs opacity-80">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Table ── */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" />
              </div>
            ) : registrations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
                <UsersIcon className="w-12 h-12" />
                <p className="text-sm font-medium">No registrations yet</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    {['Student', 'Contact', 'Student ID', 'Registered', isPaidEvent && 'Payment', 'Actions']
                      .filter(Boolean).map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {registrations.map(reg => {
                    const pStatus = payStatuses[reg.id] || reg.paymentStatus
                    return (
                      <tr key={reg.id} className="hover:bg-gray-50 transition-colors">
                        {/* Student */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <Avatar name={reg.name} />
                            <span className="text-sm font-semibold text-gray-900">{reg.name}</span>
                          </div>
                        </td>
                        {/* Contact */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-700">{reg.email}</div>
                          <div className="text-xs text-gray-400">{reg.phone}</div>
                        </td>
                        {/* Student ID */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {reg.studentId}
                        </td>
                        {/* Registered */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(reg.registeredAt)}
                        </td>

                        {/* Payment */}
                        {isPaidEvent && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusStyle(pStatus)}`}>
                              {statusLabel(pStatus)}
                            </span>
                          </td>
                        )}
                        {/* Actions */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setDetailReg({ ...reg, paymentStatus: pStatus })}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 rounded-lg transition-all shadow-sm"
                            >
                              <InformationCircleIcon className="w-3.5 h-3.5" />
                              View Detail
                            </button>
                            
                            {isPaidEvent && pStatus === 'pending' && (
                              <button
                                onClick={() => setDetailReg({ ...reg, paymentStatus: pStatus })}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-lg transition-all shadow-sm"
                              >
                                <CheckCircleIcon className="w-3.5 h-3.5" />
                                Approve
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="flex-shrink-0 border-t border-gray-200 px-6 py-4 flex items-center justify-between bg-gray-50">
            <span className="text-sm text-gray-500">Showing {registrations.length} registrations</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowRegistrationsModal(false)}
                className="px-5 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Close
              </button>
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg font-medium hover:from-violet-700 hover:to-purple-700 transition-all shadow-sm"
              >
                <DocumentTextIcon className="w-4 h-4" />
                Export List
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Detail Drawer / Side Modal ── */}
      <AnimatePresence>
        {detailReg && (
          <>
            <motion.div
              key="detail-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-[60]"
              onClick={() => setDetailReg(null)}
            />
            <motion.div
              key="detail-panel"
              initial={{ opacity: 0, x: 60, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              onClick={e => e.stopPropagation()}
              className="fixed right-4 top-4 bottom-4 w-full max-w-md bg-white rounded-2xl shadow-2xl z-[70] flex flex-col overflow-hidden"
            >
              {/* drawer header */}
              <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-gray-600 p-5 text-white flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">Registration Detail</h3>
                  <button onClick={() => setDetailReg(null)} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <Avatar name={detailReg.name} size="lg" />
                  <div>
                    <p className="font-bold text-lg leading-tight">{detailReg.name}</p>
                    <p className="text-purple-200 text-sm">{detailReg.email}</p>
                    {isPaidEvent && (
                      <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                        detailReg.paymentStatus === 'confirmed'
                          ? 'bg-green-400/30 text-green-100'
                          : detailReg.paymentStatus === 'rejected'
                          ? 'bg-red-400/30 text-red-100'
                          : 'bg-amber-400/30 text-amber-100'
                      }`}>
                        Payment: {statusLabel(detailReg.paymentStatus)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* drawer body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">

                {/* Personal info */}
                <section className="bg-gray-50 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Personal Info</h4>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                    {[
                      ['Student ID', detailReg.studentId],
                      ['Phone', detailReg.phone],
                      ['Major', detailReg.major],
                      ['Year', detailReg.year],
                    ].map(([l, v]) => (
                      <div key={l}>
                        <p className="text-gray-400 text-xs">{l}</p>
                        <p className="text-gray-900 font-medium">{v || '—'}</p>
                      </div>
                    ))}
                    <div className="col-span-2">
                      <p className="text-gray-400 text-xs">Registered At</p>
                      <p className="text-gray-900 font-medium">{formatDate(detailReg.registeredAt)}</p>
                    </div>
                    {detailReg.notes && (
                      <div className="col-span-2">
                        <p className="text-gray-400 text-xs">Notes</p>
                        <p className="text-gray-700 text-sm mt-0.5 leading-relaxed">{detailReg.notes}</p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Payment proof section */}
                {isPaidEvent && (
                  <section>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Payment Proof</h4>

                    <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-3 mb-3 text-sm">
                      <div>
                        <p className="text-gray-400 text-xs">Amount</p>
                        <p className="font-bold text-gray-900">${(detailReg.paymentAmount || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Method</p>
                        <p className="font-medium text-gray-900">{detailReg.paymentMethod}</p>
                      </div>
                      <div className="ml-auto">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusStyle(detailReg.paymentStatus)}`}>
                          {statusLabel(detailReg.paymentStatus)}
                        </span>
                      </div>
                    </div>

                    <ProofViewer url={detailReg.receiptUrl} type={detailReg.proofType} />
                  </section>
                )}
              </div>

              {/* drawer footer — approve/reject */}
              {isPaidEvent && (() => {
                const ps = detailReg.paymentStatus
                const isPending = ps === 'pending' || ps === null
                return (
                  <div className="flex-shrink-0 border-t border-gray-100 p-4 space-y-3">
                    {isPending ? (
                      <>
                        {!detailReg.receiptUrl && (
                          <p className="text-center text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg py-2 px-3">
                            ⚠️ No payment proof uploaded yet — you can still approve or reject
                          </p>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => rejectPayment(detailReg)}
                            className="flex items-center justify-center gap-2 py-3 border-2 border-red-300 text-red-700 bg-white hover:bg-red-50 rounded-xl text-sm font-bold transition-all"
                          >
                            <XCircleIcon className="w-5 h-5" /> Reject
                          </button>
                          <button
                            onClick={() => approvePayment(detailReg)}
                            className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-bold hover:from-green-600 hover:to-emerald-700 transition-all shadow"
                          >
                            <CheckCircleIcon className="w-5 h-5" /> Approve
                          </button>
                        </div>
                      </>
                    ) : ps === 'verified' ? (
                      <div className="flex items-center justify-center gap-2 py-3 bg-green-50 border-2 border-green-300 rounded-xl text-green-700 text-sm font-bold">
                        <CheckCircleIcon className="w-5 h-5" /> Payment Approved
                      </div>
                    ) : ps === 'rejected' ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center justify-center gap-2 py-3 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-sm font-semibold">
                          <XCircleIcon className="w-5 h-5" /> Rejected
                        </div>
                        <button
                          onClick={() => approvePayment(detailReg)}
                          className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-bold hover:from-amber-600 hover:to-orange-600 transition-all"
                        >
                          <CheckCircleIcon className="w-5 h-5" /> Re-approve
                        </button>
                      </div>
                    ) : (
                      <p className="text-center text-sm text-gray-400 py-2">No payment proof uploaded yet</p>
                    )}
                  </div>
                )
              })()}

              {!isPaidEvent && (
                <div className="flex-shrink-0 p-4 border-t border-gray-100">
                  <button
                    onClick={() => setDetailReg(null)}
                    className="w-full py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium text-sm transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default RegistrationsModal
