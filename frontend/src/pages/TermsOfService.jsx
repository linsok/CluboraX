import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { 
  DocumentTextIcon,
  UserIcon,
  ShieldCheckIcon,
  ScaleIcon,
  HandRaisedIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'

const TermsOfService = () => {
  const { isAuthenticated } = useAuth()
  const [expandedSection, setExpandedSection] = useState(null)

  const toggleSection = (id) => {
    setExpandedSection(expandedSection === id ? null : id)
  }

  const summaryCards = [
    {
      icon: HandRaisedIcon,
      title: 'Be Respectful',
      description: 'Treat others with respect and follow community guidelines'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Account Security',
      description: 'You\'re responsible for keeping your account secure'
    },
    {
      icon: ScaleIcon,
      title: 'Follow Rules',
      description: 'Comply with university policies and local laws'
    },
    {
      icon: UserIcon,
      title: 'Fair Use',
      description: 'Use the platform responsibly and ethically'
    }
  ]

  const sections = [
    {
      id: 1,
      icon: DocumentTextIcon,
      title: 'Acceptance of Terms',
      subtitle: 'What you agree to when using our platform',
      content: (
        <div>
          <p className="text-gray-600 leading-relaxed">
            By accessing and using Campus Events (CluboraX), you accept and agree to be bound by these terms and conditions. 
            If you don't agree with any part of these terms, please don't use our service. We may update these terms from time to time, 
            and your continued use of the platform constitutes acceptance of any changes.
          </p>
        </div>
      )
    },
    {
      id: 2,
      icon: UserIcon,
      title: 'User Accounts & Responsibilities',
      subtitle: 'Your obligations as a platform user',
      content: (
        <div>
          <p className="mb-4">When you create an account, you agree to:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>Provide accurate and complete information</li>
            <li>Maintain the security of your account credentials</li>
            <li>Notify us immediately of any unauthorized access</li>
            <li>Be responsible for all activities under your account</li>
            <li>Not share your account with others</li>
            <li>Be at least 13 years old to use the platform</li>
          </ul>
        </div>
      )
    },
    {
      id: 3,
      icon: HandRaisedIcon,
      title: 'Acceptable Use Policy',
      subtitle: 'What you can and cannot do on our platform',
      content: (
        <div>
          <p className="mb-4">You agree NOT to:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>Post inappropriate, offensive, or illegal content</li>
            <li>Harass, bully, or threaten other users</li>
            <li>Impersonate others or provide false information</li>
            <li>Spam or send unsolicited messages</li>
            <li>Attempt to hack or disrupt the platform</li>
            <li>Scrape or collect data without permission</li>
            <li>Use the platform for commercial purposes without authorization</li>
          </ul>
        </div>
      )
    },
    {
      id: 4,
      icon: DocumentTextIcon,
      title: 'Event Creation and Management',
      subtitle: 'Rules for organizers creating events',
      content: (
        <div>
          <p className="mb-4">If you're an event organizer, you must:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>Provide accurate event information</li>
            <li>Follow university policies and regulations</li>
            <li>Obtain necessary approvals before creating events</li>
            <li>Ensure events comply with local laws</li>
            <li>Handle attendee data responsibly</li>
            <li>Not create fake or misleading events</li>
            <li>Cancel events properly if needed, with adequate notice</li>
          </ul>
        </div>
      )
    },
    {
      id: 5,
      icon: ShieldCheckIcon,
      title: 'Club Management',
      subtitle: 'Guidelines for club administrators',
      content: (
        <div>
          <p className="mb-4">Club administrators agree to:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>Manage club information accurately</li>
            <li>Welcome all eligible members without discrimination</li>
            <li>Communicate clearly with members</li>
            <li>Follow university club policies</li>
            <li>Maintain appropriate conduct in club activities</li>
            <li>Handle member data with care and privacy</li>
          </ul>
        </div>
      )
    },
    {
      id: 6,
      icon: DocumentTextIcon,
      title: 'Intellectual Property',
      subtitle: 'Ownership of content and materials',
      content: (
        <div>
          <p className="mb-4 text-gray-600">
            You retain ownership of content you post on the platform. However, by posting content, you grant us a license to use, 
            display, and distribute it within the platform. We own all rights to the platform itself, including its design, 
            features, and functionality.
          </p>
          <p className="text-gray-600">
            You may not copy, modify, or distribute our platform or its content without permission.
          </p>
        </div>
      )
    },
    {
      id: 7,
      icon: ShieldCheckIcon,
      title: 'Privacy and Data Protection',
      subtitle: 'How we handle your information',
      content: (
        <div>
          <p className="text-gray-600 leading-relaxed">
            Your privacy is important to us. We collect and use your personal information as described in our Privacy Policy. 
            By using the platform, you consent to our data practices. We implement security measures to protect your data, 
            but cannot guarantee absolute security. You're responsible for maintaining the confidentiality of your account.
          </p>
        </div>
      )
    },
    {
      id: 8,
      icon: ScaleIcon,
      title: 'Disclaimers and Limitation of Liability',
      subtitle: 'Important legal limitations',
      content: (
        <div>
          <p className="mb-4 text-gray-600">
            The platform is provided "as is" without warranties of any kind. We don't guarantee that the platform will be 
            error-free or always available. We're not responsible for:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>Content posted by users</li>
            <li>Events organized by third parties</li>
            <li>Technical issues or interruptions</li>
            <li>Loss of data or unauthorized access</li>
            <li>Disputes between users</li>
          </ul>
        </div>
      )
    },
    {
      id: 9,
      icon: HandRaisedIcon,
      title: 'Termination',
      subtitle: 'When and how accounts can be suspended',
      content: (
        <div>
          <p className="mb-4 text-gray-600">
            We reserve the right to suspend or terminate your account if you:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>Violate these terms of service</li>
            <li>Engage in illegal activities</li>
            <li>Abuse or harass other users</li>
            <li>Compromise platform security</li>
          </ul>
          <p className="mt-4 text-gray-600">
            You may also delete your account at any time through your account settings.
          </p>
        </div>
      )
    },
    {
      id: 10,
      icon: ScaleIcon,
      title: 'Changes to Terms',
      subtitle: 'How we update these terms',
      content: (
        <div>
          <p className="text-gray-600 leading-relaxed">
            We may update these terms from time to time to reflect changes in our practices or for legal reasons. 
            We'll notify you of significant changes via email or platform notification. Your continued use of the 
            platform after changes constitutes acceptance of the updated terms.
          </p>
        </div>
      )
    },
    {
      id: 11,
      icon: DocumentTextIcon,
      title: 'Contact and Governing Law',
      subtitle: 'Legal jurisdiction and how to reach us',
      content: (
        <div>
          <p className="mb-4 text-gray-600">
            These terms are governed by the laws of your jurisdiction. For questions about these terms, contact us at:
          </p>
          <p className="text-gray-600 font-semibold">legal@campushub.edu</p>
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
            <DocumentTextIcon className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
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
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">Terms at a Glance</h2>
          <p className="text-center text-gray-600 mb-8">Here's what you're agreeing to when using Campus Events:</p>
          
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
                transition={{ duration: 0.5, delay: index * 0.05 }}
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
                    {section.content}
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
          <h2 className="text-2xl font-bold mb-4">Questions About Our Terms?</h2>
          <p className="text-purple-100 mb-6">Contact us at legal@campushub.edu</p>
        </motion.div>
      </div>
    </div>
  )
}

export default TermsOfService
