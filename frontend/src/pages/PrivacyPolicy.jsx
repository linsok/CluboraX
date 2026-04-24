import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { 
  ShieldCheckIcon,
  LockClosedIcon,
  UserIcon,
  EyeSlashIcon,
  BellAlertIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'

const PrivacyPolicy = () => {
  const { isAuthenticated } = useAuth()
  const [expandedSection, setExpandedSection] = useState(null)

  const toggleSection = (id) => {
    setExpandedSection(expandedSection === id ? null : id)
  }

  const summaryCards = [
    {
      icon: LockClosedIcon,
      title: 'We Protect Your Data',
      description: 'Your information is encrypted and securely stored'
    },
    {
      icon: UserIcon,
      title: 'You\'re in Control',
      description: 'Access, update, or delete your data anytime'
    },
    {
      icon: EyeSlashIcon,
      title: 'No Selling Data',
      description: 'We never sell your personal information'
    },
    {
      icon: BellAlertIcon,
      title: 'Transparent',
      description: 'Clear about what we collect and why'
    }
  ]

  const sections = [
    {
      id: 1,
      icon: LockClosedIcon,
      title: 'What Information We Collect',
      subtitle: 'The data we gather to provide you with our services',
      content: (
        <div>
          <p className="mb-4">We collect information that you provide directly to us:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li><strong>Account Information:</strong> Name, email, student ID, faculty, year</li>
            <li><strong>Profile Data:</strong> Interests, club memberships, event registrations</li>
            <li><strong>Usage Data:</strong> How you interact with our platform</li>
            <li><strong>Technical Data:</strong> IP address, browser type, device information</li>
          </ul>
        </div>
      )
    },
    {
      id: 2,
      icon: UserIcon,
      title: 'How We Use Your Information',
      subtitle: 'Why we need your data and what we do with it',
      content: (
        <div>
          <p className="mb-4">We use the information we collect to:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>Provide, maintain, and improve our services</li>
            <li>Send you updates about events and club activities</li>
            <li>Respond to your comments and questions</li>
            <li>Analyze usage patterns to enhance user experience</li>
            <li>Detect and prevent fraud and security issues</li>
          </ul>
        </div>
      )
    },
    {
      id: 3,
      icon: ShieldCheckIcon,
      title: 'How We Share Your Information',
      subtitle: 'When and with whom we share your data',
      content: (
        <div>
          <p className="mb-4">We may share your information in the following circumstances:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li><strong>With Your Consent:</strong> When you explicitly agree to share information</li>
            <li><strong>With Event Organizers:</strong> When you RSVP to events</li>
            <li><strong>With Club Administrators:</strong> When you join a club</li>
            <li><strong>For Legal Reasons:</strong> When required by law or to protect rights</li>
            <li><strong>Service Providers:</strong> With trusted partners who help us operate</li>
          </ul>
        </div>
      )
    },
    {
      id: 4,
      icon: LockClosedIcon,
      title: 'Data Security',
      subtitle: 'How we protect your information',
      content: (
        <div>
          <p className="mb-4">We take data security seriously and implement various measures:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>SSL/TLS encryption for data transmission</li>
            <li>Secure database storage with encryption at rest</li>
            <li>Regular security audits and updates</li>
            <li>Limited access to personal data</li>
            <li>Multi-factor authentication for sensitive operations</li>
          </ul>
        </div>
      )
    },
    {
      id: 5,
      icon: UserIcon,
      title: 'Your Rights and Choices',
      subtitle: 'Control over your personal data',
      content: (
        <div>
          <p className="mb-4">You have the following rights regarding your data:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Update:</strong> Correct or update your information</li>
            <li><strong>Delete:</strong> Request deletion of your account and data</li>
            <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
            <li><strong>Data Portability:</strong> Receive your data in a portable format</li>
          </ul>
        </div>
      )
    },
    {
      id: 6,
      icon: BellAlertIcon,
      title: 'Cookies and Tracking',
      subtitle: 'How we use cookies and similar technologies',
      content: (
        <div>
          <p className="mb-4">We use cookies and similar technologies to:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>Keep you signed in to your account</li>
            <li>Remember your preferences and settings</li>
            <li>Analyze site traffic and usage patterns</li>
            <li>Provide personalized content recommendations</li>
            <li>You can control cookies through your browser settings</li>
          </ul>
        </div>
      )
    }
  ]

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
            <ShieldCheckIcon className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-xl text-purple-100">Last updated: January 2025</p>
          </motion.div>
          </div>
        </div>
      </div>

      {/* Quick Summary */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">Privacy at a Glance</h2>
          <p className="text-center text-gray-600 mb-8">We care about your privacy. Here's what you need to know:</p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {summaryCards.map((card, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow text-center"
              >
                <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <card.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{card.title}</h3>
                <p className="text-sm text-gray-600">{card.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Detailed Sections */}
        <div className="max-w-4xl mx-auto">
          <div className="space-y-4">
            {sections.map((section, index) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-md overflow-hidden"
              >
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-6 py-5 flex items-center gap-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <section.icon className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                    <p className="text-sm text-gray-500">{section.subtitle}</p>
                  </div>
                  {expandedSection === section.id ? (
                    <ChevronUpIcon className="w-6 h-6 text-purple-600 flex-shrink-0" />
                  ) : (
                    <ChevronDownIcon className="w-6 h-6 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {expandedSection === section.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-6 pb-6 pt-2"
                  >
                    <div className="text-gray-700">{section.content}</div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-12 max-w-4xl mx-auto bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-center text-white"
        >
          <h2 className="text-2xl font-bold mb-4">Questions About Privacy?</h2>
          <p className="text-purple-100 mb-6">Contact us at privacy@campushub.edu</p>
        </motion.div>
      </div>
    </div>
  )
}

export default PrivacyPolicy
