import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import FloatingChatbot from '../components/FloatingChatbot'
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
  ArrowRightIcon,
  DocumentTextIcon,
  CameraIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const Gallery = () => {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showAlbumModal, setShowAlbumModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  
  // State for upload form
  const [uploadForm, setUploadForm] = useState({
    title: '',
    category: 'Events',
    description: '',
    longDescription: '',
    eventDate: '',
    eventLocation: '',
    images: [],
    author: user?.name || 'Unknown',
    tags: []
  })

  // Handler for upload button click
  const handleUploadAlbum = () => {
    if (user?.role === 'organizer' || user?.role === 'admin') {
      setShowUploadModal(true)
    } else {
      toast.error('You need to be an organizer to upload albums')
    }
  }

  // Handler for form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target
    setUploadForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Handler for image uploads
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    const validFiles = files.filter(file => {
      // Check file type (images only)
      return file.type.startsWith('image/')
    })

    if (validFiles.length > 0) {
      // Convert files to preview URLs
      const imagePromises = validFiles.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            resolve({
              file,
              url: e.target.result,
              name: file.name,
              size: file.size
            })
          }
          reader.readAsDataURL(file)
        })
      })

      Promise.all(imagePromises).then(images => {
        setUploadForm(prev => ({
          ...prev,
          images: [...prev.images, ...images]
        }))
        toast.success(`${images.length} image(s) uploaded successfully`)
      })
    } else {
      toast.error('Please select valid image files')
    }
  }

  // Handler for removing an image
  const removeImage = (index) => {
    setUploadForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
    toast.success('Image removed')
  }

  // Handler for album submission
  const handleUploadSubmit = () => {
    // Validation
    if (!uploadForm.title.trim()) {
      toast.error('Please enter an album title')
      return
    }
    if (uploadForm.images.length === 0) {
      toast.error('Please upload at least one image')
      return
    }

    // Create new album object
    const newAlbum = {
      id: Date.now(),
      ...uploadForm,
      likes: 0,
      comments: 0,
      date: new Date().toISOString().split('T')[0],
      imageUrl: uploadForm.images[0]?.url || '/api/placeholder/400/300',
      images: uploadForm.images.map(img => img.url)
    }

    console.log('Creating album:', newAlbum)
    toast.success('Album uploaded successfully!')

    // Reset form and close modal
    setUploadForm({
      title: '',
      category: 'Events',
      description: '',
      longDescription: '',
      eventDate: '',
      eventLocation: '',
      images: [],
      author: user?.name || 'Unknown',
      tags: []
    })
    setShowUploadModal(false)
  }

  const { data: galleryItemsRaw = [], isLoading: galleryLoading } = useQuery({
    queryKey: ['gallery'],
    queryFn: async () => {
      const res = await apiClient.get('/api/gallery/?is_public=true&ordering=-created_at')
      const raw = res.data?.results || (Array.isArray(res.data) ? res.data : [])
      return raw.map(g => ({
        id: g.id,
        title: g.title,
        category: g.gallery_type_display || g.gallery_type || 'General',
        description: g.description || '',
        longDescription: g.description || '',
        imageUrl: g.cover_image_url || 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=400&h=300&fit=crop',
        images: g.cover_image_url ? [g.cover_image_url] : [],
        likes: g.total_likes || 0,
        comments: g.total_comments || 0,
        author: g.created_by?.full_name || g.created_by?.username || 'Campus',
        date: g.date_taken || (g.created_at ? g.created_at.substring(0, 10) : ''),
        eventDate: g.date_taken || '',
        eventLocation: g.location || '',
        eventDuration: '',
        participants: 0,
        tags: Array.isArray(g.tags) ? g.tags : [],
        organizer: g.created_by?.full_name || '',
        highlights: [],
      }))
    },
    staleTime: 5 * 60 * 1000,
  })

  const galleryItems = galleryItemsRaw

  const categories = ['all', 'Event', 'Club', 'General', 'Achievement', 'Campus Life']

  // Filter gallery items based on search and category
  const filteredItems = galleryItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.author.toLowerCase().includes(searchTerm.toLowerCase())
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

  // Upload Modal Component
  const UploadModal = () => {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={() => setShowUploadModal(false)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            duration: 0.5
          }}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">Upload Event Album</h2>
                <p className="text-purple-100">Share your event moments with the campus community</p>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1">
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Album Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Album Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={uploadForm.title}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 hover:border-purple-400 hover:shadow-sm"
                      placeholder="Enter album title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      name="category"
                      value={uploadForm.category}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 hover:border-purple-400 hover:shadow-sm"
                    >
                      <option value="Events">Events</option>
                      <option value="Sports">Sports</option>
                      <option value="Cultural">Cultural</option>
                      <option value="Academic">Academic</option>
                      <option value="Arts">Arts</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Short Description
                    </label>
                    <input
                      type="text"
                      name="description"
                      value={uploadForm.description}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 hover:border-purple-400 hover:shadow-sm"
                      placeholder="Brief description of the album"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event Date
                    </label>
                    <input
                      type="date"
                      name="eventDate"
                      value={uploadForm.eventDate}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 hover:border-purple-400 hover:shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event Location
                    </label>
                    <input
                      type="text"
                      name="eventLocation"
                      value={uploadForm.eventLocation}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 hover:border-purple-400 hover:shadow-sm"
                      placeholder="Event location"
                    />
                  </div>
                </div>
              </div>

              {/* Long Description */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-4">Detailed Description</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Long Description
                  </label>
                  <textarea
                    name="longDescription"
                    value={uploadForm.longDescription}
                    onChange={handleFormChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 hover:border-purple-400 hover:shadow-sm resize-none"
                    placeholder="Detailed description of the album and event"
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-4">Upload Images</h3>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-green-300 rounded-lg p-6 bg-white/50">
                    {uploadForm.images.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {uploadForm.images.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={image.url}
                              alt={image.name}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <button
                              onClick={() => removeImage(index)}
                              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                            <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                              {image.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <CameraIcon className="w-12 h-12 text-green-400 mx-auto mb-3" />
                        <label htmlFor="image-upload" className="cursor-pointer">
                          <span className="text-sm font-medium text-green-600 hover:text-green-700">
                            Click to upload images
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            JPG, PNG, GIF files only. Max 5MB per file.
                          </p>
                          <input
                            id="image-upload"
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => document.getElementById('image-upload').click()}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
                  >
                    <CameraIcon className="w-5 h-5 inline-block mr-2" />
                    Add Images
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {uploadForm.images.length} image(s) uploaded
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadSubmit}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 font-medium"
                >
                  Upload Album
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )
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
              className="relative bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col"
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
              <div className="flex-1 bg-black overflow-y-auto">
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
      {/* Hero Section */}
      <div 
        style={{
          position: 'relative',
          background: 'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(/img/home.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          color: 'white',
          padding: 'calc(6rem + 60px) 2rem 5.5rem',
          textAlign: 'center',
          overflow: 'hidden'
        }}
      >
        {/* Curved bottom shape */}
        <div 
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '60px',
            background: '#f9fafb',
            borderRadius: '100% 100% 0 0 / 80px 80px 0 0'
          }}
        />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              fontSize: '0.95rem',
              marginBottom: '0.5rem',
              opacity: 0.9,
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              fontWeight: 500
            }}
          >
            Explore Memories
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              fontSize: '2.5rem',
              marginBottom: '1rem',
              fontWeight: 700,
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
            }}
          >
            Campus <span style={{ color: '#667eea' }}>Gallery</span>
          </motion.h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Gallery</h2>
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
          {galleryLoading ? (
            <div className="col-span-3 text-center py-16 text-gray-500">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p>Loading gallery...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="col-span-3 text-center py-16 text-gray-500">
              <PhotoIcon className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-xl font-medium">No gallery items found</p>
              <p className="text-sm mt-1">Check back after events have been photographed</p>
            </div>
          ) : (
          filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden group"
            >
              <div className="relative h-64 overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"%3E%3Cpath stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /%3E%3C/svg%3E';
                    e.target.className = 'w-full h-full bg-gradient-to-r from-purple-400 to-indigo-400 flex items-center justify-center';
                    e.target.parentElement.innerHTML = '<div class="w-full h-full bg-gradient-to-r from-purple-400 to-indigo-400 flex items-center justify-center"><svg class="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>';
                  }}
                />
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
          ))
          )}
        </div>

        {/* Upload Button - Only for Organizers */}
        {user?.role === 'organizer' || user?.role === 'admin' ? (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            onClick={handleUploadAlbum}
            className="fixed bottom-8 right-8 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
          >
            <PlusIcon className="h-6 w-6" />
          </motion.button>
        ) : null}
      </div>

      {/* Modals */}
      <GalleryDetailsModal />
      <AlbumModal />
      
      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && <UploadModal />}
      </AnimatePresence>

      {/* Floating Chatbot Button */}
      <FloatingChatbot />
    </div>
  )
}

export default Gallery
