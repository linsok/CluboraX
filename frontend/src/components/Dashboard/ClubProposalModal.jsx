import React, { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { createClubProposal } from '../../api/proposals'
import { useAuth } from '../../contexts/AuthContext'
import {
  XMarkIcon,
  UserGroupIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  TagIcon,
  UsersIcon,
  ClockIcon,
  MapPinIcon,
  SparklesIcon,
  ArrowUpTrayIcon,
  GlobeAltIcon,
  EyeIcon,
  PhotoIcon,
  PlusIcon
} from '@heroicons/react/24/outline'

const ClubProposalModal = ({ onClose, queryClient, setActiveTab }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    category: 'Academic',
    description: '',
    leaderName: '',
    capacity: 10,
    meetingTime: '',
    locationType: 'Physical Location',
    location: '',
    requirements: '',
    memberEmails: '',
    livingDescription: '',
    goals: '',
    instagram: '',
    linkedin: '',
    github: '',
    clubLogo: null
  })
  const [clubLogoPreview, setClubLogoPreview] = useState(null)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const closeModal = () => {
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name || !formData.category || !formData.description || !formData.leaderName || !formData.meetingTime || !formData.location) {
      toast.error('Please fill in all required fields')
      return
    }

    if (Number(formData.capacity) < 5) {
      toast.error('Club capacity must be at least 5 members!')
      return
    }

    setIsSubmitting(true)
    try {
      // Map category to club_type for backend
      const clubTypeMap = {
        'Academic': 'academic',
        'Arts': 'arts',
        'Sports': 'sports',
        'Cultural': 'cultural',
        'Technical': 'technical'
      }

      // Build the payload with ALL fields that were collected
      const payload = {
        name: formData.name,
        club_type: clubTypeMap[formData.category] || 'academic',
        description: formData.description + (formData.livingDescription ? `\n\nDetailed Description: ${formData.livingDescription}` : ''),
        objectives: formData.goals || `This club aims to bring together students interested in ${formData.category} activities.`,
        activities: formData.additionalNotes || '',
        mission: formData.mission || '',
        president_name: formData.leaderName || '',
        president_email: formData.presidentEmail || formData.leaderEmail || '',
        president_phone: formData.presidentPhone || formatPhoneNumber(formData.leaderPhoneNumber) || '',
        president_gender: formData.presidentGender || '',
        advisor_name: formData.advisorName || '',
        advisor_email: formData.advisorEmail || '',
        advisor_phone: formData.advisorPhone || '',
        expected_members: Number(formData.capacity) || 0,
        requirements: formData.requirements || 'Open to all interested students',
        meeting_time: formData.meetingTime || '',
        meeting_location: formData.location || '',
        instagram: formData.instagram || '',
        linkedin: formData.linkedin || '',
        github: formData.github || '',
        start_date: formData.startDate || new Date().toISOString().split('T')[0],
        end_date: formData.endDate || '',
      }

      // Add member emails if provided
      if (formData.memberEmails && Array.isArray(formData.memberEmails)) {
        payload.member_emails = formData.memberEmails
      } else if (formData.memberEmails) {
        // If it's a string, split by comma
        payload.member_emails = formData.memberEmails.split(',').map(email => email.trim())
      }

      // Add club logo if provided (as File object, not string)
      if (formData.clubLogo && formData.clubLogo instanceof File) {
        payload.club_logo = formData.clubLogo
      }

      await createClubProposal(payload)
      toast.success('Club proposal submitted successfully! Pending admin approval.')
      queryClient.invalidateQueries(['my-club-proposals'])
      setActiveTab('proposals')
      closeModal()
    } catch (error) {
      console.error('Club proposal error:', error)
      const errorMsg = error.response?.data?.name?.[0] || 
                       error.response?.data?.club_type?.[0] || 
                       error.response?.data?.detail || 
                       'Failed to submit club proposal'
      toast.error(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={closeModal}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">Create Club Proposal</h2>
              <p className="text-purple-100">Start your own student organization</p>
            </div>
            <button
              onClick={closeModal}
              className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Club Details Form */}
        <>
          <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Basic Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Club Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                          placeholder="Enter club name"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                          required
                        >
                          <option value="Academic">Academic</option>
                          <option value="Arts">Arts</option>
                          <option value="Sports">Sports</option>
                          <option value="Cultural">Cultural</option>
                          <option value="Technical">Technical</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
                          placeholder="Brief description of your club"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Leader Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="leaderName"
                          value={formData.leaderName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                          placeholder="Enter leader's full name"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Club Capacity <span className="text-red-500">*</span> (Minimum 5)
                        </label>
                        <input
                          type="number"
                          name="capacity"
                          value={formData.capacity}
                          onChange={handleInputChange}
                          min="5"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                          placeholder="10"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-4">Meeting Details</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Meeting Time <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="meetingTime"
                          value={formData.meetingTime}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                          placeholder="e.g., Every Wednesday at 6:00 PM"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Location <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="locationType"
                          value={formData.locationType}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all mb-3"
                        >
                          <option value="Physical Location">Physical Location</option>
                          <option value="Virtual">Virtual</option>
                          <option value="Hybrid">Hybrid</option>
                        </select>
                        <input
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                          placeholder="e.g., Tech Building, Room 301"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Requirements
                        </label>
                        <textarea
                          name="requirements"
                          value={formData.requirements}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
                          placeholder="Any requirements for joining the club"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="font-semibold text-purple-900 mb-4">Additional Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Add Members by Email (Student Accounts)
                    </label>
                    <textarea
                      name="memberEmails"
                      value={formData.memberEmails}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
                      placeholder="Enter email addresses separated by commas (student@campusedu.edu, student2@campusedu.edu)"
                    />
                    <p className="text-xs text-gray-500 mt-1">Add multiple member email addresses to invite them to join your club</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Living Description
                    </label>
                    <textarea
                      name="livingDescription"
                      value={formData.livingDescription}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
                      placeholder="Detailed description of your club's mission and activities"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Goals & Objectives
                    </label>
                    <textarea
                      name="goals"
                      value={formData.goals}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
                      placeholder="What do you want to achieve with this club?"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-4">Social Media (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instagram
                    </label>
                    <input
                      type="text"
                      name="instagram"
                      value={formData.instagram}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      placeholder="@clubname"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      LinkedIn
                    </label>
                    <input
                      type="text"
                      name="linkedin"
                      value={formData.linkedin}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      placeholder="Club Name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GitHub
                    </label>
                    <input
                      type="text"
                      name="github"
                      value={formData.github}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      placeholder="club-username"
                    />
                  </div>
                </div>
              </div>

              {/* Club Logo / Profile Image Upload */}
              <div className="bg-pink-50 rounded-lg p-4">
                <h3 className="font-semibold text-pink-900 mb-4 flex items-center">
                  <PhotoIcon className="w-5 h-5 mr-2" />
                  Club Logo / Profile Image
                </h3>
                <p className="text-sm text-gray-600 mb-3">Upload a logo or profile image for your club (recommended: 500x500px)</p>
                <div className="border-2 border-dashed border-pink-300 rounded-lg p-4 bg-white/50 hover:border-pink-400 hover:bg-pink-100/50 cursor-pointer transition-all">
                  {formData.clubLogo && clubLogoPreview ? (
                    <div className="space-y-3">
                      <img src={clubLogoPreview} alt="Club logo preview" className="w-full h-48 object-cover rounded-lg" />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <PhotoIcon className="w-8 h-8 text-pink-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{formData.clubLogo.name}</p>
                            <p className="text-xs text-gray-500">{(formData.clubLogo.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => {
                            setFormData({...formData, clubLogo: null})
                            setClubLogoPreview(null)
                          }} 
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all">
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <PhotoIcon className="w-12 h-12 text-pink-400 mx-auto mb-3" />
                      <label htmlFor="club-logo-upload" className="cursor-pointer">
                        <span className="text-sm font-medium text-pink-600 hover:text-pink-700 transition-colors">Click to upload image</span>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, or GIF - max 5MB</p>
                        <input 
                          id="club-logo-upload" 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              if (file.size > 5 * 1024 * 1024) {
                                toast.error('Image must be less than 5MB')
                                return
                              }
                              setFormData({...formData, clubLogo: file})
                              // Create data URL preview
                              const reader = new FileReader()
                              reader.onload = (e) => setClubLogoPreview(e.target.result)
                              reader.readAsDataURL(file)
                            }
                          }} 
                          className="hidden" 
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex items-center justify-end">
                <div className="flex items-center space-x-4">
                  <button type="button" onClick={closeModal} className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium hover:bg-gray-100 rounded-lg transition-all">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit for Approval'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </>
      </motion.div>
    </motion.div>
  )
}

export default ClubProposalModal
