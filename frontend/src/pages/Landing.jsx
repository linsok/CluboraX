import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import { 
  SparklesIcon,
  UserGroupIcon,
  CalendarIcon,
  PhotoIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'
import Navbar from '../components/Layout/Navbar'
import Footer from '../components/Layout/Footer'

const Landing = () => {
  const { data: statsData } = useQuery({
    queryKey: ['public-stats'],
    queryFn: async () => {
      const res = await apiClient.get('/api/stats/public/')
      return res.data?.data || { total_events: 0, total_clubs: 0, total_participants: 0 }
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const stats = {
    totalEvents: statsData?.total_events ?? 0,
    totalClubs: statsData?.total_clubs ?? 0,
    totalParticipants: statsData?.total_participants ?? 0,
  }

  return (
    <div className="min-h-screen">
      <Navbar user={null} onMenuClick={() => {}} />
      
      {/* Hero Section with Background */}
      <section className="relative bg-cover bg-center bg-fixed text-white pt-32 pb-24 px-8 text-center overflow-hidden" style={{ backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('/img/home.jpg')" }}>
        {/* Curved bottom shape */}
        <div className="absolute bottom-0 left-0 w-full h-20 bg-white" style={{ borderRadius: '100% 100% 0 0 / 100px 100px 0 0' }}></div>
        
        <div className="relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold mb-3"
            style={{ textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)' }}
          >
            Welcome to CluboraX
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg md:text-xl mb-6 opacity-95"
            style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)' }}
          >
            Discover, Join, and Manage Campus Activities
          </motion.p>

          {/* Hero Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mt-6 mb-48"
          >
            <div className="bg-white bg-opacity-15 backdrop-blur-sm p-4 rounded-xl border border-white border-opacity-20 transition-all hover:transform hover:-translate-y-1 hover:bg-opacity-25">
              <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-white" />
              <h3 className="text-2xl font-bold mb-1">{stats.totalEvents}</h3>
              <p className="text-white text-opacity-90 text-xs">Upcoming Events</p>
            </div>
            <div className="bg-white bg-opacity-15 backdrop-blur-sm p-4 rounded-xl border border-white border-opacity-20 transition-all hover:transform hover:-translate-y-1 hover:bg-opacity-25">
              <UserGroupIcon className="w-8 h-8 mx-auto mb-2 text-white" />
              <h3 className="text-2xl font-bold mb-1">{stats.totalClubs}</h3>
              <p className="text-white text-opacity-90 text-xs">Active Clubs</p>
            </div>
            <div className="bg-white bg-opacity-15 backdrop-blur-sm p-4 rounded-xl border border-white border-opacity-20 transition-all hover:transform hover:-translate-y-1 hover:bg-opacity-25">
              <AcademicCapIcon className="w-8 h-8 mx-auto mb-2 text-white" />
              <h3 className="text-2xl font-bold mb-1">{stats.totalParticipants}</h3>
              <p className="text-white text-opacity-90 text-xs">Participants</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <div className="pt-12 pb-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need for Campus Life
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover events, join clubs, manage your activities, and connect with fellow students.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: CalendarIcon,
                title: 'Campus Events',
                description: 'Discover and join exciting campus events, workshops, and activities.',
                color: 'from-blue-500 to-cyan-500'
              },
              {
                icon: UserGroupIcon,
                title: 'Student Clubs',
                description: 'Join or create student organizations and build lasting connections.',
                color: 'from-purple-500 to-pink-500'
              },
              {
                icon: PhotoIcon,
                title: 'Photo Gallery',
                description: 'Share and browse memories from campus events and activities.',
                color: 'from-green-500 to-teal-500'
              },
              {
                icon: AcademicCapIcon,
                title: 'Academic Resources',
                description: 'Access learning materials and educational opportunities.',
                color: 'from-orange-500 to-red-500'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* CTA Image */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="order-2 lg:order-1"
            >
              <img 
                src="/img/Pre-Footer CTA Section.jpg" 
                alt="Pre-Footer CTA Section"
                className="w-full h-auto rounded-2xl shadow-2xl"
                onError={(e) => e.target.style.display = 'none'}
              />
            </motion.div>
            
            {/* CTA Text */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="order-1 lg:order-2"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Discover. Connect. Celebrate.
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Join over 5,000 students and hundreds of clubs from around campus in the ultimate event management platform. Create and propose new events, start your own club, discover the latest campus activities, connect with like-minded peers, and celebrate achievements in a vibrant, engaging environment.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-lg flex items-center justify-center"
                >
                  Get Started Today
                  <ArrowRightIcon className="ml-2 w-5 h-5" />
                </Link>
                <Link
                  to="/login"
                  className="border-2 border-purple-600 text-purple-600 px-8 py-4 rounded-lg font-semibold hover:bg-purple-50 transition-all duration-300 flex items-center justify-center"
                >
                  Browse Events
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Landing
