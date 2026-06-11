import React from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getClubMembers, updateMembershipStatus, leaveClub } from '../../api/clubs'
import { XMarkIcon, UserGroupIcon, EnvelopeIcon, BuildingOfficeIcon, ClockIcon, UserIcon, ShieldCheckIcon, TrashIcon, CheckCircleIcon, XCircleIcon, DocumentTextIcon, InformationCircleIcon } from '@heroicons/react/24/outline'

const ClubMembersModal = ({ selectedClubForMembers, setShowClubMembersModal, queryClient, formatDate, exportClubMembersToCSV }) => {
  const [selectedMemberForDetails, setSelectedMemberForDetails] = React.useState(null)
  // Fetch real members from API, normalized to UI shape
  const { data: rawMembers = [], isLoading: loadingMembers } = useQuery({
    queryKey: ['club-members', selectedClubForMembers?.id],
    queryFn: () => getClubMembers(selectedClubForMembers.id),
    enabled: !!selectedClubForMembers?.id,
    staleTime: 60 * 1000,
  })

  // Mutations for member management
  const approveMemberMutation = useMutation({
    mutationFn: (membershipId) => updateMembershipStatus(membershipId, 'approve'),
    onSuccess: () => {
      queryClient.invalidateQueries(['club-members', selectedClubForMembers?.id])
      toast.success('Member approved successfully!')
    },
    onError: () => {
      toast.error('Failed to approve member')
    }
  })

  const rejectMemberMutation = useMutation({
    mutationFn: (membershipId) => updateMembershipStatus(membershipId, 'reject'),
    onSuccess: () => {
      queryClient.invalidateQueries(['club-members', selectedClubForMembers?.id])
      toast.success('Member request declined')
    },
    onError: () => {
      toast.error('Failed to decline member')
    }
  })

  const removeMemberMutation = useMutation({
    mutationFn: (membershipId) => leaveClub(membershipId),
    onSuccess: () => {
      queryClient.invalidateQueries(['club-members', selectedClubForMembers?.id])
      toast.success('Member removed successfully')
    },
    onError: () => {
      toast.error('Failed to remove member')
    }
  })

  const handleApproveMember = (membershipId) => {
    if (window.confirm('Approve this member?')) {
      approveMemberMutation.mutate(membershipId)
    }
  }

  const handleDeclineMember = (membershipId) => {
    if (window.confirm('Decline this membership request?')) {
      rejectMemberMutation.mutate(membershipId)
    }
  }

  const handleRemoveMember = (membershipId, memberName) => {
    if (window.confirm(`Remove ${memberName} from the club? This action cannot be undone.`)) {
      removeMemberMutation.mutate(membershipId)
    }
  }

  const normalizeMember = (m) => ({
    id: m.id,
    name: m.user?.full_name || m.user?.first_name || m.user?.email || 'Unknown',
    email: m.user?.email || '',
    studentId: m.user?.student_id || 'N/A',
    phone: m.user?.phone || 'N/A',
    joinedAt: m.joined_at,
    role: m.role_display || m.role || 'Member',
    status: m.status || 'active',
    notes: m.notes || '',
    faculty: m.user?.faculty || 'N/A',
    department: m.user?.department || 'N/A',
  })

  const members = loadingMembers ? [] : rawMembers.map(normalizeMember)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={() => setShowClubMembersModal(false)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-2xl shadow-2xl max-w-[95vw] lg:max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-gray-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">Club Members</h2>
              <p className="text-purple-100">{selectedClubForMembers?.name}</p>
              <p className="text-purple-200 text-sm mt-1">
                {selectedClubForMembers?.member_count || members.length} total members
              </p>
            </div>
            <button
              onClick={() => setShowClubMembersModal(false)}
              className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Total Members</p>
                  <p className="text-2xl font-bold text-purple-900">{members.length}</p>
                </div>
                <UserGroupIcon className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Active Members</p>
                  <p className="text-2xl font-bold text-green-900">{members.filter(m => m.status === 'approved' || m.status === 'active').length}</p>
                </div>
                <CheckCircleIcon className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 font-medium">Pending Requests</p>
                  <p className="text-2xl font-bold text-yellow-900">{members.filter(m => m.status === 'pending').length}</p>
                </div>
                <ClockIcon className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
          </div>

          {/* Members Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-gray-600 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{member.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{member.email}</div>
                        <div className="text-sm text-gray-500">{member.phone}</div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                        {member.studentId}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          member.role === 'President' ? 'bg-indigo-100 text-indigo-700' :
                          member.role === 'Vice President' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {member.role}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                        {(() => {
                          try {
                            const date = new Date(member.joinedAt)
                            return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                          } catch {
                            return 'N/A'
                          }
                        })()}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          member.status === 'approved' || member.status === 'active' ? 'bg-green-100 text-green-700' : 
                          member.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {member.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-right text-sm font-medium min-w-[200px]">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedMemberForDetails(member)}
                            className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            <InformationCircleIcon className="w-4 h-4 mr-1 text-gray-500" />
                            {member.status === 'pending' ? 'View App' : 'View Info'}
                          </button>
                          {member.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApproveMember(member.id)}
                                disabled={approveMemberMutation.isLoading}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                              >
                                <CheckCircleIcon className="w-4 h-4 mr-1" />
                                Accept
                              </button>
                              <button
                                onClick={() => handleDeclineMember(member.id)}
                                disabled={rejectMemberMutation.isLoading}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                              >
                                <XCircleIcon className="w-4 h-4 mr-1" />
                                Decline
                              </button>
                            </>
                          )}
                          {(member.status === 'approved' || member.status === 'active') && (
                            <button
                              onClick={() => handleRemoveMember(member.id, member.name)}
                              disabled={removeMemberMutation.isLoading}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                            >
                              <TrashIcon className="w-4 h-4 mr-1" />
                              Remove
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {members.length} members
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowClubMembersModal(false)}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Close
              </button>
              <button
                onClick={() => {
                  exportClubMembersToCSV(members, selectedClubForMembers?.name || 'Club')
                  toast.success('Member list exported successfully!')
                }}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-gray-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-medium"
              >
                <DocumentTextIcon className="w-5 h-5" />
                Export List
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Student Application Details Modal Overlay */}
      {selectedMemberForDetails && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-5 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">Applicant Profile</h3>
                <p className="text-indigo-100 text-xs mt-0.5">Membership Request Details</p>
              </div>
              <button
                onClick={() => setSelectedMemberForDetails(null)}
                className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors text-white"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Info */}
            <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              {/* Profile Card */}
              <div className="flex items-center space-x-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full flex items-center justify-center text-white text-lg font-bold">
                  {selectedMemberForDetails.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-base">{selectedMemberForDetails.name}</h4>
                  <p className="text-gray-500 text-xs">Role: {selectedMemberForDetails.role}</p>
                </div>
              </div>

              {/* Grid of Profile Details */}
              <div className="grid grid-cols-2 gap-4 text-sm bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div>
                  <span className="text-xs text-gray-500 font-medium block">Student ID</span>
                  <span className="font-semibold text-gray-800">{selectedMemberForDetails.studentId}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 font-medium block">Email Address</span>
                  <span className="font-semibold text-gray-800 break-all">{selectedMemberForDetails.email}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 font-medium block">Phone Number</span>
                  <span className="font-semibold text-gray-800">{selectedMemberForDetails.phone}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 font-medium block">Department / Major</span>
                  <span className="font-semibold text-gray-800">{selectedMemberForDetails.department || 'N/A'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-gray-500 font-medium block">Faculty</span>
                  <span className="font-semibold text-gray-800">{selectedMemberForDetails.faculty || 'N/A'}</span>
                </div>
              </div>

              {/* Application Message / Notes */}
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 space-y-2">
                <h5 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center">
                  <DocumentTextIcon className="w-4 h-4 mr-1 text-indigo-600" />
                  Application Message
                </h5>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {selectedMemberForDetails.notes || 'No message provided by the applicant.'}
                </p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-5 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => setSelectedMemberForDetails(null)}
                className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
              >
                Close
              </button>
              {selectedMemberForDetails.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      handleDeclineMember(selectedMemberForDetails.id)
                      setSelectedMemberForDetails(null)
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg shadow-sm hover:shadow-md transition-colors"
                  >
                    Decline Request
                  </button>
                  <button
                    onClick={() => {
                      handleApproveMember(selectedMemberForDetails.id)
                      setSelectedMemberForDetails(null)
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg shadow-sm hover:shadow-md transition-colors"
                  >
                    Approve Request
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}


export default ClubMembersModal
