import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserGroupIcon, PlusIcon, MagnifyingGlassIcon, CalendarIcon, XMarkIcon, CheckCircleIcon, EnvelopeIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

const Clubs = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [selectedClub, setSelectedClub] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showCreateClubModal, setShowCreateClubModal] = useState(false)
  const [joinRequests, setJoinRequests] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentId: '',
    major: '',
    year: '',
    message: ''
  })
  const [clubForm, setClubForm] = useState({
    name: '',
    category: 'Academic',
    description: '',
    longDescription: '',
    meetingTime: '',
    locationType: 'physical',
    location: '',
    physicalLocation: '',
    onlinePlatform: '',
    meetingLink: '',
    requirements: '',
    goals: '',
    leaderName: '',
    capacity: 10,
    memberEmails: '',
    president: user?.name || '',
    contactEmail: user?.email || '',
    socialMedia: {
      instagram: '',
      linkedin: '',
      github: ''
    }
  })

  const clubs = [
    {
      id: 1,
      name: 'Computer Science Club',
      category: 'Academic',
      description: 'Explore the world of technology and programming',
      longDescription: 'The Computer Science Club is dedicated to fostering innovation and excellence in technology. We organize coding competitions, hackathons, workshops on emerging technologies, and guest lectures from industry professionals. Our members get hands-on experience with real-world projects and networking opportunities with tech companies.',
      members: 156,
      image: '/api/placeholder/300/200',
      events: 12,
      status: 'active',
      president: 'Sarah Johnson',
      meetingTime: 'Every Wednesday at 6:00 PM',
      location: 'Tech Building, Room 301',
      website: 'https://csclub.university.edu',
      socialMedia: {
        instagram: '@csclub_university',
        linkedin: 'Computer Science Club - University',
        github: 'csclub-university'
      },
      achievements: [
        'Won Regional Hackathon 2023',
        'Published 3 research papers',
        '50+ members placed in top tech companies'
      ],
      requirements: 'Open to all students interested in technology and programming. No prior experience required.'
    },
    {
      id: 2,
      name: 'Photography Club',
      category: 'Arts',
      description: 'Capture moments and express creativity through photography',
      longDescription: 'The Photography Club welcomes students of all skill levels who are passionate about visual storytelling. We provide workshops on camera techniques, photo editing, composition, and lighting. Members participate in photo walks, exhibitions, and competitions. Our club has access to professional equipment and darkroom facilities.',
      members: 89,
      image: '/api/placeholder/300/200',
      events: 8,
      status: 'active',
      president: 'Michael Chen',
      meetingTime: 'Every Tuesday at 5:00 PM',
      location: 'Arts Building, Room 205',
      website: 'https://photoclub.university.edu',
      socialMedia: {
        instagram: '@photoclub_university',
        flickr: 'photoclub-university'
      },
      achievements: [
        'Annual Campus Photography Exhibition',
        'Published in University Magazine',
        'Won State Photography Competition'
      ],
      requirements: 'Basic camera or smartphone required. Open to all students.'
    },
    {
      id: 3,
      name: 'Debate Society',
      category: 'Academic',
      description: 'Develop critical thinking and public speaking skills',
      longDescription: 'The Debate Society is dedicated to developing critical thinking, research skills, and public speaking abilities. We participate in inter-university debates, organize campus debates on current issues, and provide training in argumentation and rhetoric. Our members have consistently performed well in regional and national competitions.',
      members: 67,
      image: '/api/placeholder/300/200',
      events: 15,
      status: 'active',
      president: 'Emily Rodriguez',
      meetingTime: 'Every Thursday at 7:00 PM',
      location: 'Humanities Building, Room 102',
      website: 'https://debatesociety.university.edu',
      socialMedia: {
        instagram: '@debate_society_university',
        twitter: '@DebateSocietyUni'
      },
      achievements: [
        'Regional Debate Champions 2023',
        'National Debate Tournament Quarterfinalists',
        '10+ members selected for Model UN'
      ],
      requirements: 'Strong interest in public speaking and current events. Audition required for competitive team.'
    },
    {
      id: 4,
      name: 'Music Club',
      category: 'Arts',
      description: 'Share your passion for music and performance',
      longDescription: 'The Music Club brings together musicians and music lovers from all backgrounds. We organize concerts, open mic nights, jam sessions, and workshops. Whether you play an instrument, sing, or just love listening to music, there\'s a place for you. We have practice rooms, recording equipment, and performance opportunities throughout the year.',
      members: 124,
      image: '/api/placeholder/300/200',
      events: 10,
      status: 'active',
      president: 'David Martinez',
      meetingTime: 'Every Monday at 6:30 PM',
      location: 'Performing Arts Center, Room 150',
      website: 'https://musicclub.university.edu',
      socialMedia: {
        instagram: '@musicclub_university',
        youtube: 'Music Club University',
        spotify: 'Music Club University Playlist'
      },
      achievements: [
        'Spring Concert Series',
        'Battle of the Bands Winners',
        'Collaboration with Local Symphony'
      ],
      requirements: 'Open to all students. Auditions for performance groups, but everyone can join as a member.'
    }
  ]

  const categories = ['all', 'Academic', 'Arts', 'Sports', 'Cultural', 'Technical']

  const filteredClubs = clubs.filter(club => {
    const matchesSearch = club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         club.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || club.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleJoinClub = (club) => {
    setSelectedClub(club)
    setShowJoinModal(true)
  }

  const handleViewDetails = (club) => {
    setSelectedClub(club)
    setShowDetailsModal(true)
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmitJoinRequest = (e) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.name.trim()) {
      toast.error('Name is required')
      return
    }
    if (!formData.email.trim()) {
      toast.error('Email is required')
      return
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error('Please enter a valid email')
      return
    }
    
    // Create join request
    const request = {
      id: Date.now(),
      clubId: selectedClub.id,
      clubName: selectedClub.name,
      ...formData,
      status: 'pending',
      submittedAt: new Date().toISOString()
    }
    
    // Add to join requests
    setJoinRequests(prev => [...prev, request])
    
    // Show success message
    toast.success(`Join request sent to ${selectedClub.name}!`)
    
    // Reset form and close modal
    setFormData({
      name: '',
      email: '',
      studentId: '',
      major: '',
      year: '',
      message: ''
    })
    setShowJoinModal(false)
    setSelectedClub(null)
  }

  const handleCreateClub = async () => {
    // Check if user is a student
    if (user?.role !== 'student') {
      toast.error('Only students can create clubs')
      return
    }
    
    // Validation
    if (!clubForm.name.trim()) {
      toast.error('Club name is required')
      return
    }
    if (!clubForm.description.trim()) {
      toast.error('Club description is required')
      return
    }
    if (!clubForm.meetingTime.trim()) {
      toast.error('Meeting time is required')
      return
    }
    if (!clubForm.location.trim()) {
      toast.error('Location is required')
      return
    }
    if (!clubForm.leaderName.trim()) {
      toast.error('Leader name is required')
      return
    }
    if (clubForm.capacity < 10) {
      toast.error('Club capacity must be at least 10 members')
      return
    }
    
    try {
      // Get authentication token
      const token = localStorage.getItem('access_token')
      if (!token) {
        toast.error('You must be logged in to submit a club proposal')
        return
      }

      // Create proposal data
      const proposalData = {
        title: `New Club: ${clubForm.name}`,
        description: clubForm.description,
        type: 'club',
        priority: 'medium',
        budget: null,
        deadline: null,
        tags: ['club', clubForm.category.toLowerCase(), 'student-organization'],
        // Additional club-specific data in description
        long_description: `
**Club Details:**
- Name: ${clubForm.name}
- Category: ${clubForm.category}
- Leader: ${clubForm.leaderName}
- Capacity: ${clubForm.capacity} members
- Meeting Time: ${clubForm.meetingTime}
- Location: ${clubForm.location}

**Description:**
${clubForm.description}

**Long Description:**
${clubForm.longDescription || 'No additional description provided'}

**Goals & Objectives:**
${clubForm.goals || 'No specific goals provided'}

**Requirements:**
${clubForm.requirements || 'No specific requirements provided'}

**Meeting Details:**
- Platform: ${clubForm.locationType === 'online' ? 'Online' : 'Physical'}
${clubForm.locationType === 'online' ? `- Online Platform: ${clubForm.onlinePlatform}` : `- Physical Location: ${clubForm.physicalLocation}`}
${clubForm.meetingLink ? `- Meeting Link: ${clubForm.meetingLink}` : ''}

**Social Media:**
- Instagram: ${clubForm.socialMedia.instagram || 'Not provided'}
- LinkedIn: ${clubForm.socialMedia.linkedin || 'Not provided'}
- GitHub: ${clubForm.socialMedia.github || 'Not provided'}

**Member Invitations:**
${clubForm.memberEmails ? clubForm.memberEmails.split(',').map(email => email.trim()).filter(email => email).join(', ') : 'No member invitations'}

**Submitted by:** ${user?.name} (${user?.email})
**Submitted on:** ${new Date().toLocaleDateString()}
        `.trim()
      }

      // Submit proposal to backend
      const response = await fetch('http://localhost:8000/api/admin/proposals/create/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(proposalData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to submit club proposal')
      }

      const result = await response.json()
      
      // Show success message
      toast.success('Club proposal submitted successfully! It will be reviewed by administrators.')
      
      // Invalidate queries to refresh the Dashboard's "My Club Requests"
      queryClient.invalidateQueries(['user-club-requests'])
      queryClient.invalidateQueries(['user-club-proposals'])
      
      // Navigate to Dashboard to show the new club request
      setTimeout(() => {
        navigate('/dashboard?tab=my-clubs')
      }, 1500)
      
      // Reset form
      setClubForm({
        name: '',
        category: 'Academic',
        description: '',
        longDescription: '',
        meetingTime: '',
        locationType: 'physical',
        location: '',
        physicalLocation: '',
        onlinePlatform: '',
        meetingLink: '',
        requirements: '',
        goals: '',
        leaderName: '',
        capacity: 10,
        memberEmails: '',
        president: user?.name || '',
        contactEmail: user?.email || '',
        socialMedia: {
          instagram: '',
          linkedin: '',
          github: ''
        }
      })
      
      // Close modal
      setShowCreateClubModal(false)
      
      console.log('Club proposal submitted:', result)
    } catch (error) {
      console.error('Error submitting club proposal:', error)
      toast.error(error.message || 'Failed to submit club proposal. Please try again.')
    }
  }

  const handleClubFormChange = (e) => {
    const { name, value } = e.target
    if (name.includes('socialMedia.')) {
      const socialField = name.split('.')[1]
      setClubForm(prev => ({
        ...prev,
        socialMedia: {
          ...prev.socialMedia,
          [socialField]: value
        }
      }))
    } else {
      setClubForm(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  // Join Request Modal
  const JoinRequestModal = () => (
    <AnimatePresence>
      {showJoinModal && selectedClub && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowJoinModal(false)}
            />
            
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Join Club Request</h2>
                    <p className="text-purple-100">{selectedClub.name}</p>
                  </div>
                  <button
                    onClick={() => setShowJoinModal(false)}
                    className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmitJoinRequest} className="p-6 space-y-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Student ID
                    </label>
                    <input
                      type="text"
                      name="studentId"
                      value={formData.studentId}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter your student ID"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Major
                    </label>
                    <input
                      type="text"
                      name="major"
                      value={formData.major}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter your major"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Year
                    </label>
                    <select
                      name="year"
                      value={formData.year}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Select year</option>
                      <option value="Freshman">Freshman</option>
                      <option value="Sophomore">Sophomore</option>
                      <option value="Junior">Junior</option>
                      <option value="Senior">Senior</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message (Optional)
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleFormChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    placeholder="Tell us why you want to join this club..."
                  />
                </div>

                {/* Club Info Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Club Information</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium">Club:</span> {selectedClub.name}</p>
                    <p><span className="font-medium">Category:</span> {selectedClub.category}</p>
                    <p><span className="font-medium">Current Members:</span> {selectedClub.members}</p>
                    <p><span className="font-medium">Events:</span> {selectedClub.events}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowJoinModal(false)}
                    className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors duration-300 font-medium"
                  >
                    Send Request
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )

  // Club Details Modal
  const ClubDetailsModal = () => (
    <AnimatePresence>
      {showDetailsModal && selectedClub && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowDetailsModal(false)}
            />
            
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold mb-1">{selectedClub.name}</h2>
                    <p className="text-purple-100">{selectedClub.category} Club</p>
                  </div>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Description */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">About Us</h3>
                  <p className="text-gray-600 leading-relaxed">{selectedClub.longDescription}</p>
                </div>

                {/* Quick Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-900 mb-3">Club Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">President:</span>
                        <span className="font-medium text-gray-900">{selectedClub.president}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Members:</span>
                        <span className="font-medium text-gray-900">{selectedClub.members}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Events:</span>
                        <span className="font-medium text-gray-900">{selectedClub.events}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className="font-medium text-green-600">{selectedClub.status}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-indigo-50 rounded-lg p-4">
                    <h4 className="font-semibold text-indigo-900 mb-3">Meeting Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time:</span>
                        <span className="font-medium text-gray-900">{selectedClub.meetingTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Location:</span>
                        <span className="font-medium text-gray-900">{selectedClub.location}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Requirements */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Requirements</h4>
                  <p className="text-gray-600 text-sm">{selectedClub.requirements}</p>
                </div>

                {/* Achievements */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Recent Achievements</h4>
                  <ul className="space-y-2">
                    {selectedClub.achievements.map((achievement, index) => (
                      <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                        <CheckCircleIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Social Media */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Connect With Us</h4>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(selectedClub.socialMedia).map(([platform, handle]) => (
                      <div key={platform} className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg text-sm">
                        <span className="font-medium text-gray-700 capitalize">{platform}:</span>
                        <span className="text-gray-600">{handle}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Website */}
                {selectedClub.website && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Official Website</h4>
                    <a 
                      href={selectedClub.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-700 underline text-sm"
                    >
                      {selectedClub.website}
                    </a>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="p-6 border-t border-gray-200">
                <div className="flex items-center justify-end space-x-4">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false)
                      handleJoinClub(selectedClub)
                    }}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors duration-300 font-medium"
                  >
                    Join Club
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Clubs</h1>
          <p className="text-gray-600">Discover and join student organizations</p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 flex flex-col md:flex-row gap-4"
        >
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search clubs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Clubs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClubs.map((club, index) => (
            <motion.div
              key={club.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden"
            >
              <div className="h-48 bg-gradient-to-r from-purple-400 to-indigo-400 relative">
                <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                  <UserGroupIcon className="h-16 w-16 text-white" />
                </div>
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                    {club.status}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{club.name}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">{club.description}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <UserGroupIcon className="h-4 w-4 mr-1" />
                      {club.members}
                    </span>
                    <span className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      {club.events}
                    </span>
                  </div>
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                    {club.category}
                  </span>
                </div>
                
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleViewDetails(club)}
                    className="flex-1 border border-purple-600 text-purple-600 py-2 px-4 rounded-lg hover:bg-purple-50 transition-colors duration-300"
                  >
                    View Details
                  </button>
                  <button 
                    onClick={() => handleJoinClub(club)}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 px-4 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors duration-300"
                  >
                    Join Club
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Create Club Button - Only for Students */}
        {user?.role === 'student' && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            onClick={() => setShowCreateClubModal(true)}
            className="fixed bottom-8 right-8 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
            title="Create Club"
          >
            <PlusIcon className="h-6 w-6" />
          </motion.button>
        )}
      </div>

      {/* Join Request Modal */}
      <JoinRequestModal />
      
      {/* Club Details Modal */}
      <ClubDetailsModal />

      {/* Create Club Modal */}
      <AnimatePresence>
        {showCreateClubModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowCreateClubModal(false)}
              />
              
              {/* Modal Content */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold mb-1">Create New Club</h2>
                      <p className="text-purple-100">Start your own student organization</p>
                    </div>
                    <button
                      onClick={() => setShowCreateClubModal(false)}
                      className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={(e) => { e.preventDefault(); handleCreateClub(); }} className="p-6 space-y-6 overflow-y-auto flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900 mb-4">Basic Information</h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Club Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={clubForm.name}
                          onChange={handleClubFormChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Enter club name"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category *
                        </label>
                        <select
                          name="category"
                          value={clubForm.category}
                          onChange={handleClubFormChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                          Description *
                        </label>
                        <textarea
                          name="description"
                          value={clubForm.description}
                          onChange={handleClubFormChange}
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                          placeholder="Brief description of your club"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Leader Name *
                        </label>
                        <input
                          type="text"
                          name="leaderName"
                          value={clubForm.leaderName}
                          onChange={handleClubFormChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Enter leader's full name"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Club Capacity * (Minimum 10)
                        </label>
                        <input
                          type="number"
                          name="capacity"
                          value={clubForm.capacity}
                          onChange={handleClubFormChange}
                          min="10"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Maximum number of members"
                          required
                        />
                      </div>
                    </div>

                    {/* Meeting Details */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900 mb-4">Meeting Details</h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Meeting Time *
                        </label>
                        <input
                          type="text"
                          name="meetingTime"
                          value={clubForm.meetingTime}
                          onChange={handleClubFormChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="e.g., Every Wednesday at 6:00 PM"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Location *
                        </label>
                        <select
                          name="locationType"
                          value={clubForm.locationType || 'physical'}
                          onChange={(e) => {
                            setClubForm(prev => ({
                              ...prev,
                              locationType: e.target.value,
                              location: e.target.value === 'physical' ? '' : 'Online Meeting'
                            }))
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-2"
                          required
                        >
                          <option value="physical">Physical Location</option>
                          <option value="online">Online Meeting</option>
                          <option value="hybrid">Hybrid (Physical + Online)</option>
                        </select>
                        
                        {clubForm.locationType === 'physical' ? (
                          <input
                            type="text"
                            name="location"
                            value={clubForm.location}
                            onChange={handleClubFormChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="e.g., Tech Building, Room 301"
                            required
                          />
                        ) : clubForm.locationType === 'online' ? (
                          <div className="space-y-2">
                            <select
                              name="onlinePlatform"
                              value={clubForm.onlinePlatform || ''}
                              onChange={(e) => {
                                setClubForm(prev => ({
                                  ...prev,
                                  onlinePlatform: e.target.value,
                                  location: e.target.value ? `Online via ${e.target.value}` : ''
                                }))
                              }}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              required
                            >
                              <option value="">Select Platform</option>
                              <option value="Zoom">Zoom</option>
                              <option value="Microsoft Teams">Microsoft Teams</option>
                              <option value="Google Meet">Google Meet</option>
                              <option value="Skype">Skype</option>
                              <option value="Discord">Discord</option>
                              <option value="Other">Other Platform</option>
                            </select>
                            
                            <input
                              type="text"
                              name="meetingLink"
                              value={clubForm.meetingLink || ''}
                              onChange={(e) => {
                                setClubForm(prev => ({
                                  ...prev,
                                  meetingLink: e.target.value,
                                  location: prev.onlinePlatform ? `Online via ${prev.onlinePlatform}` : ''
                                }))
                              }}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="Enter meeting link (e.g., https://zoom.us/j/123456789)"
                              required
                            />
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <input
                              type="text"
                              name="physicalLocation"
                              value={clubForm.physicalLocation || ''}
                              onChange={(e) => {
                                setClubForm(prev => ({
                                  ...prev,
                                  physicalLocation: e.target.value,
                                  location: e.target.value ? `${e.target.value} + Online Meeting` : 'Hybrid Meeting'
                                }))
                              }}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-2"
                              placeholder="e.g., Tech Building, Room 301"
                              required
                            />
                            
                            <select
                              name="onlinePlatform"
                              value={clubForm.onlinePlatform || ''}
                              onChange={(e) => {
                                setClubForm(prev => ({
                                  ...prev,
                                  onlinePlatform: e.target.value,
                                  location: prev.physicalLocation ? `${prev.physicalLocation} + Online via ${e.target.value}` : 'Hybrid Meeting'
                                }))
                              }}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              required
                            >
                              <option value="">Select Online Platform</option>
                              <option value="Zoom">Zoom</option>
                              <option value="Microsoft Teams">Microsoft Teams</option>
                              <option value="Google Meet">Google Meet</option>
                              <option value="Skype">Skype</option>
                              <option value="Discord">Discord</option>
                              <option value="Other">Other Platform</option>
                            </select>
                            
                            <input
                              type="text"
                              name="meetingLink"
                              value={clubForm.meetingLink || ''}
                              onChange={(e) => {
                                setClubForm(prev => ({
                                  ...prev,
                                  meetingLink: e.target.value
                                }))
                              }}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="Enter meeting link (e.g., https://zoom.us/j/123456789)"
                              required
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Requirements
                        </label>
                        <textarea
                          name="requirements"
                          value={clubForm.requirements}
                          onChange={handleClubFormChange}
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                          placeholder="Any requirements for joining the club"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Add Members by Email (CluboraX Accounts)
                        </label>
                        <textarea
                          name="memberEmails"
                          value={clubForm.memberEmails}
                          onChange={handleClubFormChange}
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                          placeholder="Enter email addresses separated by commas (e.g., student1@campushub.edu, student2@campushub.edu)"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Add CluboraX member email addresses to invite them to join your club
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Additional Information</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Long Description
                      </label>
                      <textarea
                        name="longDescription"
                        value={clubForm.longDescription}
                        onChange={handleClubFormChange}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        placeholder="Detailed description of your club's mission and activities"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Goals & Objectives
                      </label>
                      <textarea
                        name="goals"
                        value={clubForm.goals}
                        onChange={handleClubFormChange}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        placeholder="What do you want to achieve with this club?"
                      />
                    </div>
                  </div>

                  {/* Social Media */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Social Media (Optional)</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Instagram
                        </label>
                        <input
                          type="text"
                          name="socialMedia.instagram"
                          value={clubForm.socialMedia.instagram}
                          onChange={handleClubFormChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="@clubname"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          LinkedIn
                        </label>
                        <input
                          type="text"
                          name="socialMedia.linkedin"
                          value={clubForm.socialMedia.linkedin}
                          onChange={handleClubFormChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Club Name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          GitHub
                        </label>
                        <input
                          type="text"
                          name="socialMedia.github"
                          value={clubForm.socialMedia.github}
                          onChange={handleClubFormChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="club-username"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowCreateClubModal(false)}
                      className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors duration-300 font-medium"
                    >
                      Submit for Approval
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Clubs
