import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  PhotoIcon, 
  HeartIcon, 
  ChatBubbleLeftIcon, 
  MagnifyingGlassIcon, 
  PlusIcon, 
  XMarkIcon, 
  CalendarIcon,
  MapPinIcon,
  UserGroupIcon,
  EyeIcon,
  ClockIcon,
  ArrowLeftIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

const Gallery = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showAlbumModal, setShowAlbumModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const galleryItems = [
    {
      id: 1,
      title: 'Annual Tech Fest',
      category: 'Events',
      description: 'Students showcasing their innovative projects',
      longDescription: 'The Annual Tech Fest is a celebration of innovation and creativity where students from various departments showcase their cutting-edge projects, prototypes, and research work. This year\'s event featured over 50 projects ranging from AI applications to sustainable technology solutions.',
      imageUrl: '/api/placeholder/400/300',
      images: [
        '/api/placeholder/800/600',
        '/api/placeholder/800/600',
        '/api/placeholder/800/600',
        '/api/placeholder/800/600',
        '/api/placeholder/800/600',
        '/api/placeholder/800/600',
        '/api/placeholder/800/600',
        '/api/placeholder/800/600'
      ],
      likes: 245,
      comments: 32,
      author: 'Photography Club',
      date: '2024-01-15',
      eventDate: '2024-01-15',
      eventLocation: 'Main Auditorium',
      eventDuration: 'Full Day',
      participants: 150,
      tags: ['Technology', 'Innovation', 'Projects', 'AI', 'Robotics'],
      organizer: 'Computer Science Department',
      highlights: [
        'AI-powered smart home automation system',
        'Sustainable energy solutions',
        'Virtual reality campus tour',
        'Student startup pitches'
      ]
    },
    {
      id: 2,
      title: 'Sports Day 2024',
      category: 'Sports',
      description: 'Annual sports competition highlights',
      longDescription: 'Sports Day 2024 brought together students from all faculties for a day of friendly competition and sportsmanship. Events included track and field, basketball, volleyball, chess, and various fun activities promoting physical fitness and team spirit.',
      imageUrl: '/api/placeholder/400/300',
      images: [
        '/api/placeholder/800/600',
        '/api/placeholder/800/600',
        '/api/placeholder/800/600',
        '/api/placeholder/800/600',
        '/api/placeholder/800/600',
        '/api/placeholder/800/600'
      ],
      likes: 189,
      comments: 28,
      author: 'Sports Club',
      date: '2024-01-10',
      eventDate: '2024-01-10',
      eventLocation: 'Sports Complex',
      eventDuration: 'Full Day',
      participants: 200,
      tags: ['Athletics', 'Competition', 'Team Sports', 'Fitness'],
      organizer: 'Sports Department',
      highlights: [
        'Track and field records broken',
        'Basketball championship finals',
        'Chess tournament winners',
        'Fun relay races'
      ]
    },
    {
      id: 3,
      title: 'Cultural Festival',
      category: 'Cultural',
      description: 'Celebrating diversity through cultural performances',
      longDescription: 'The Cultural Festival celebrated the rich diversity of our campus community through music, dance, drama, and traditional performances from around the world. Students showcased their cultural heritage while learning about others.',
      imageUrl: '/api/placeholder/400/300',
      images: [
        '/api/placeholder/800/600',
        '/api/placeholder/800/600',
        '/api/placeholder/800/600',
        '/api/placeholder/800/600',
        '/api/placeholder/800/600',
        '/api/placeholder/800/600',
        '/api/placeholder/800/600',
        '/api/placeholder/800/600',
        '/api/placeholder/800/600'
      ],
      likes: 312,
      comments: 45,
      author: 'Cultural Club',
      date: '2024-01-08',
      eventDate: '2024-01-08',
      eventLocation: 'Open Air Theater',
      eventDuration: '3 Days',
      participants: 500,
      tags: ['Music', 'Dance', 'Drama', 'Tradition', 'Diversity'],
      organizer: 'Cultural Affairs Committee',
      highlights: [
        'Traditional dance performances',
        'International food festival',
        'Fashion show',
        'Cultural exhibitions'
      ]
    },
    {
      id: 4,
      title: 'Coding Competition',
      category: 'Academic',
      description: 'Students participating in hackathon',
      longDescription: 'The 24-hour coding competition challenged students to develop innovative solutions to real-world problems. Teams worked around the clock to create impressive software applications, mobile apps, and web platforms.',
      imageUrl: '/api/placeholder/400/300',
      images: [
        '/api/placeholder/800/600',
        '/api/placeholder/800/600',
        '/api/placeholder/800/600',
        '/api/placeholder/800/600',
        '/api/placeholder/800/600'
      ],
      likes: 156,
      comments: 23,
      author: 'Computer Science Club',
      date: '2024-01-05',
      eventDate: '2024-01-05',
      eventLocation: 'Tech Building',
      eventDuration: '24 Hours',
      participants: 80,
      tags: ['Programming', 'Hackathon', 'Innovation', 'Competition'],
      organizer: 'Computer Science Department',
      highlights: [
        'Winning healthcare app',
        'Campus navigation system',
        'E-commerce platform',
        'AI chatbot assistant'
      ]
    },
    {
      id: 5,
      title: 'Music Concert',
      category: 'Arts',
      description: 'Annual music concert featuring student performances',
      longDescription: 'The Annual Music Concert showcased the incredible musical talent of our students. From classical orchestral pieces to contemporary bands, the evening was filled with diverse musical performances that captivated the audience.',
      imageUrl: '/api/placeholder/400/300',
      images: [
        '/api/placeholder/800/600',
        '/api/placeholder/800/600',
        '/api/placeholder/800/600',
        '/api/placeholder/800/600',
        '/api/placeholder/800/600',
        '/api/placeholder/800/600',
        '/api/placeholder/800/600'
      ],
      likes: 278,
      comments: 41,
      author: 'Music Club',
      date: '2024-01-03',
      eventDate: '2024-01-03',
      eventLocation: 'Auditorium',
      eventDuration: '3 Hours',
      participants: 300,
      tags: ['Music', 'Performance', 'Concert', 'Entertainment'],
      organizer: 'Music Department',
      highlights: [
        'Orchestra performance',
        'Student bands showcase',
        'Solo vocal performances',
        'Jazz ensemble'
      ]
    },
    {
      id: 6,
      title: 'Art Exhibition',
      category: 'Arts',
      description: 'Student artwork display in the campus gallery',
      longDescription: 'The Art Exhibition featured over 100 pieces of student artwork including paintings, sculptures, digital art, photography, and mixed media installations. The exhibition provided a platform for students to express their creativity and artistic vision.',
      imageUrl: '/api/placeholder/400/300',
      images: [
        '/api/placeholder/800/600',
        '/api/placeholder/800/600',
        '/api/placeholder/800/600',
        '/api/placeholder/800/600',
        '/api/placeholder/800/600',
        '/api/placeholder/800/600',
        '/api/placeholder/800/600',
        '/api/placeholder/800/600',
        '/api/placeholder/800/600',
        '/api/placeholder/800/600'
      ],
      likes: 201,
      comments: 29,
      author: 'Fine Arts Club',
      date: '2024-01-01',
      eventDate: '2024-01-01',
      eventLocation: 'Campus Art Gallery',
      eventDuration: '2 Weeks',
      participants: 75,
      tags: ['Art', 'Exhibition', 'Painting', 'Sculpture', 'Photography'],
      organizer: 'Fine Arts Department',
      highlights: [
        'Digital art showcase',
        'Photography collection',
        '3D sculpture display',
        'Student paintings gallery'
      ]
    }
  ]

  const categories = ['all', 'Events', 'Sports', 'Cultural', 'Academic', 'Arts']

  const filteredItems = galleryItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleViewDetails = (item) => {
    setSelectedItem(item)
    setShowDetailsModal(true)
  }

  const handleViewAlbum = (item) => {
    setSelectedItem(item)
    setCurrentImageIndex(0)
    setShowAlbumModal(true)
  }

  const handleNextImage = () => {
    if (selectedItem && currentImageIndex < selectedItem.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1)
    }
  }

  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1)
    }
  }

  // Gallery Details Modal
  const GalleryDetailsModal = () => (
    <AnimatePresence>
      {showDetailsModal && selectedItem && (
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
                    <h2 className="text-3xl font-bold mb-1">{selectedItem.title}</h2>
                    <p className="text-purple-100">{selectedItem.category}</p>
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
                {/* Main Image */}
                <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-r from-purple-400 to-indigo-400 flex items-center justify-center">
                    <PhotoIcon className="h-20 w-20 text-white" />
                  </div>
                  <div className="absolute bottom-4 right-4">
                    <button
                      onClick={() => {
                        setShowDetailsModal(false)
                        handleViewAlbum(selectedItem)
                      }}
                      className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
                    >
                      <EyeIcon className="w-4 h-4" />
                      View Album
                    </button>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">About This Event</h3>
                  <p className="text-gray-600 leading-relaxed">{selectedItem.longDescription}</p>
                </div>

                {/* Event Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-3">Event Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium text-gray-900">{selectedItem.eventDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Location:</span>
                        <span className="font-medium text-gray-900">{selectedItem.eventLocation}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium text-gray-900">{selectedItem.eventDuration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Participants:</span>
                        <span className="font-medium text-gray-900">{selectedItem.participants}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-indigo-50 rounded-lg p-4">
                    <h4 className="font-semibold text-indigo-900 mb-3">Organization</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Organizer:</span>
                        <span className="font-medium text-gray-900">{selectedItem.organizer}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Photographer:</span>
                        <span className="font-medium text-gray-900">{selectedItem.author}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.tags.map((tag, index) => (
                      <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Highlights */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Event Highlights</h4>
                  <ul className="space-y-2">
                    {selectedItem.highlights.map((highlight, index) => (
                      <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                        <span className="w-2 h-2 bg-green-500 rounded-full mt-1 flex-shrink-0"></span>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-around bg-gray-50 rounded-lg p-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 text-gray-600 mb-1">
                      <HeartIcon className="w-5 h-5" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{selectedItem.likes}</p>
                    <p className="text-xs text-gray-500">Likes</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 text-gray-600 mb-1">
                      <ChatBubbleLeftIcon className="w-5 h-5" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{selectedItem.comments}</p>
                    <p className="text-xs text-gray-500">Comments</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 text-gray-600 mb-1">
                      <PhotoIcon className="w-5 h-5" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{selectedItem.images.length}</p>
                    <p className="text-xs text-gray-500">Photos</p>
                  </div>
                </div>
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
                      handleViewAlbum(selectedItem)
                    }}
                    className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 font-medium"
                  >
                    <EyeIcon className="w-5 h-5" />
                    View Album
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )

  // Album Modal
  const AlbumModal = () => (
    <AnimatePresence>
      {showAlbumModal && selectedItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowAlbumModal(false)}
            />
            
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">{selectedItem.title}</h2>
                    <p className="text-blue-100">Photo Album - {selectedItem.images.length} photos</p>
                  </div>
                  <button
                    onClick={() => setShowAlbumModal(false)}
                    className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Image Gallery */}
              <div className="flex-1 bg-black overflow-hidden">
                <div className="h-full overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                    {selectedItem.images.map((image, index) => (
                      <div 
                        key={index}
                        className="relative group cursor-pointer"
                        onClick={() => setCurrentImageIndex(index)}
                      >
                        <div className="aspect-square bg-gray-800 rounded-lg overflow-hidden">
                          <img
                            src={image}
                            alt={`${selectedItem.title} - Image ${index + 1}`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 text-white text-center">
                            <p className="text-sm font-medium">Image {index + 1}</p>
                            <p className="text-xs">Click to view</p>
                          </div>
                        </div>
                        {currentImageIndex === index && (
                          <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                            Current
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedItem.title}</h3>
                    <p className="text-sm text-gray-600">
                      {selectedItem.images.length} photos • Currently viewing: Image {currentImageIndex + 1}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                      disabled={currentImageIndex === 0}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex(Math.min(selectedItem.images.length - 1, currentImageIndex + 1))}
                      disabled={currentImageIndex === selectedItem.images.length - 1}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                    <button
                      onClick={() => setShowAlbumModal(false)}
                      className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
                    >
                      Close
                    </button>
                  </div>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Campus Gallery</h1>
          <p className="text-gray-600">Explore moments from campus life</p>
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
              placeholder="Search gallery..."
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

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden group"
            >
              <div className="relative h-64 overflow-hidden">
                <div className="w-full h-full bg-gradient-to-r from-purple-400 to-indigo-400 flex items-center justify-center">
                  <PhotoIcon className="h-16 w-16 text-white" />
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                  <button 
                    onClick={() => handleViewDetails(item)}
                    className="opacity-0 group-hover:opacity-100 bg-white text-gray-900 px-4 py-2 rounded-lg font-medium transition-opacity duration-300"
                  >
                    View Details
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">{item.description}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <HeartIcon className="h-4 w-4 mr-1" />
                      {item.likes}
                    </span>
                    <span className="flex items-center">
                      <ChatBubbleLeftIcon className="h-4 w-4 mr-1" />
                      {item.comments}
                    </span>
                  </div>
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                    {item.category}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.author}</p>
                    <p className="text-xs text-gray-500">{item.date}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleViewAlbum(item)}
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      <EyeIcon className="w-4 h-4" />
                      Album
                    </button>
                    <button 
                      onClick={() => handleViewDetails(item)}
                      className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Upload Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="fixed bottom-8 right-8 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
        >
          <PlusIcon className="h-6 w-6" />
        </motion.button>
      </div>

      {/* Modals */}
      <GalleryDetailsModal />
      <AlbumModal />
    </div>
  )
}

export default Gallery
