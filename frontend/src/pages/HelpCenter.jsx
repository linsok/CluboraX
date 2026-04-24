import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { 
  QuestionMarkCircleIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  CalendarIcon,
  UserGroupIcon,
  CogIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'

const HelpCenter = () => {
  const { isAuthenticated } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFaq, setExpandedFaq] = useState(null)

  const faqSections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: UserCircleIcon,
      questions: [
        {
          id: 1,
          question: 'How do I create an account?',
          answer: 'Click the "Register" button in the top menu. Choose whether you\'re a Student/User or an Organizer, then fill in your details. Students need to provide their Student ID, Faculty, and Year. Organizers need to provide their Organization/Company name.'
        },
        {
          id: 2,
          question: 'What\'s the difference between Student and Organizer accounts?',
          answer: 'Student/User accounts can browse events, RSVP, join clubs, and view the calendar. Organizer accounts have additional permissions to create and manage events, manage club memberships, and submit proposals.'
        }
      ]
    },
    {
      id: 'events',
      title: 'Events',
      icon: CalendarIcon,
      questions: [
        {
          id: 3,
          question: 'How do I RSVP for an event?',
          answer: 'Browse events on the Events page, click on an event card to view details, then click the "RSVP" button. You\'ll receive a confirmation and the event will appear in your "My Events" section.'
        },
        {
          id: 4,
          question: 'How do I create an event?',
          answer: 'You need an Organizer account to create events. Once logged in, go to your Dashboard and click "Create Event". Fill in all required details including title, description, date, time, location, and category. Submit for admin approval.'
        },
        {
          id: 5,
          question: 'Can I cancel my RSVP?',
          answer: 'Yes! Go to "My Events" in your dashboard, find the event, and click "Cancel RSVP". Please cancel at least 24 hours before the event if possible.'
        }
      ]
    },
    {
      id: 'clubs',
      title: 'Clubs',
      icon: UserGroupIcon,
      questions: [
        {
          id: 6,
          question: 'How do I join a club?',
          answer: 'Visit the Clubs page, browse or search for clubs, click on a club to view details, then click "Join Club". You\'ll be added to the club\'s member list and receive updates about club activities.'
        },
        {
          id: 7,
          question: 'How do I propose a new club?',
          answer: 'Go to the Proposals page (accessible from Clubs page), click "Propose New Club", fill in the club details including name, description, category, and objectives. Submit for admin review and approval.'
        }
      ]
    },
    {
      id: 'account',
      title: 'Account & Settings',
      icon: CogIcon,
      questions: [
        {
          id: 8,
          question: 'How do I reset my password?',
          answer: 'Click "Forgot Password?" on the login page, enter your registered email, and follow the instructions sent to your email to reset your password.'
        },
        {
          id: 9,
          question: 'How do I update my profile?',
          answer: 'Log in to your account, click on your profile icon in the top right, select "Profile", and update your information. Don\'t forget to save your changes!'
        }
      ]
    }
  ]

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          {/* Back Button */}
          <Link
            to={isAuthenticated ? "/dashboard" : "/"}
            className="inline-flex items-center gap-2 text-white hover:text-purple-100 transition-colors mb-8"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Back to Home</span>
          </Link>
          
          <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <QuestionMarkCircleIcon className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-4">Help Center</h1>
            <p className="text-xl text-purple-100">Find answers to common questions</p>
          </motion.div>
          </div>

          {/* Search Box */}
          <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8 max-w-2xl mx-auto"
          >
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-lg"
              />
            </div>
          </motion.div>
          </div>
        </div>
      </div>

      {/* FAQ Sections */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {faqSections.map((section, sectionIndex) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: sectionIndex * 0.1 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <section.icon className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
            </div>

            <div className="space-y-4">
              {section.questions.map((faq) => (
                <motion.div
                  key={faq.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  >
                    <h3 className="text-lg font-semibold text-gray-900">{faq.question}</h3>
                    {expandedFaq === faq.id ? (
                      <ChevronUpIcon className="w-5 h-5 text-purple-600 flex-shrink-0" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  {expandedFaq === faq.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-6 pb-4"
                    >
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Contact Support CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-center text-white"
        >
          <h2 className="text-2xl font-bold mb-4">Still need help?</h2>
          <p className="text-purple-100 mb-6">Our support team is here to assist you</p>
          <Link
            to="/contact"
            className="inline-block bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
          >
            Contact Support
          </Link>
        </motion.div>
      </div>
    </div>
  )
}

export default HelpCenter
