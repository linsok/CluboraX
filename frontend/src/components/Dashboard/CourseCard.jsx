import React from 'react'
import { motion } from 'framer-motion'
import { BookOpenIcon } from '@heroicons/react/24/outline'

const CourseCard = ({ course, index }) => {
  // Safety checks for course properties
  const safeCourse = {
    category: course?.category || 'General',
    level: course?.level || 'Beginner',
    title: course?.title || 'Untitled Course',
    instructor: course?.instructor || 'Unknown Instructor',
    progress: course?.progress || 0,
    completedLessons: course?.completedLessons || 0,
    totalLessons: course?.totalLessons || 1,
    duration: course?.duration || 'Unknown duration'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-white rounded-xl shadow-sm hover:shadow-lg border border-gray-100 overflow-hidden group cursor-pointer"
    >
      <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="absolute inset-0 bg-black bg-opacity-20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <BookOpenIcon className="w-16 h-16 text-white opacity-50" />
        </div>
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full">
            {safeCourse.category}
          </span>
        </div>
        <div className="absolute top-4 right-4">
          <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full">
            {safeCourse.level}
          </span>
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{safeCourse.title}</h3>
        <p className="text-sm text-gray-600 mb-4">{safeCourse.instructor}</p>
        
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span className="font-medium">{safeCourse.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${safeCourse.progress}%` }}
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{safeCourse.completedLessons}/{safeCourse.totalLessons} lessons</span>
          <span>{safeCourse.duration}</span>
        </div>
      </div>
    </motion.div>
  )
}


export default CourseCard
