import React from 'react'
import {
  CogIcon,
  UserGroupIcon,
  CalendarIcon,
  BellIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

const SettingsSection = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">System Settings</h2>
      
      {/* General Settings */}
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <CogIcon className="w-6 h-6 mr-2 text-red-500" />
          General Settings
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-gray-300 font-medium">Site Name</label>
              <p className="text-sm text-gray-400">Display name for the campus management system</p>
            </div>
            <input type="text" defaultValue="Campus Event Management" className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white w-64" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-gray-300 font-medium">Contact Email</label>
              <p className="text-sm text-gray-400">Main contact email for inquiries</p>
            </div>
            <input type="email" defaultValue="admin@campus.edu" className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white w-64" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-gray-300 font-medium">Maintenance Mode</label>
              <p className="text-sm text-gray-400">Temporarily disable public access</p>
            </div>
            <button className="px-4 py-2 bg-gray-700 rounded-lg text-gray-300 hover:bg-gray-600">Disabled</button>
          </div>
        </div>
      </div>

      {/* Club Settings */}
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <UserGroupIcon className="w-6 h-6 mr-2 text-blue-500" />
          Club Management Settings
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-gray-300 font-medium">Require Club Approval</label>
              <p className="text-sm text-gray-400">New clubs need admin approval before activation</p>
            </div>
            <button className="px-4 py-2 bg-green-600 rounded-lg text-white hover:bg-green-700">Enabled</button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-gray-300 font-medium">Max Members per Club</label>
              <p className="text-sm text-gray-400">Maximum number of members allowed</p>
            </div>
            <input type="number" defaultValue="500" className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white w-32" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-gray-300 font-medium">Allow Public Club Creation</label>
              <p className="text-sm text-gray-400">Students can create clubs without pre-approval</p>
            </div>
            <button className="px-4 py-2 bg-green-600 rounded-lg text-white hover:bg-green-700">Enabled</button>
          </div>
        </div>
      </div>

      {/* Event Settings */}
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <CalendarIcon className="w-6 h-6 mr-2 text-purple-500" />
          Event Management Settings
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-gray-300 font-medium">Require Event Approval</label>
              <p className="text-sm text-gray-400">Events need admin approval before publication</p>
            </div>
            <button className="px-4 py-2 bg-green-600 rounded-lg text-white hover:bg-green-700">Enabled</button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-gray-300 font-medium">Max Event Capacity</label>
              <p className="text-sm text-gray-400">Default maximum attendees per event</p>
            </div>
            <input type="number" defaultValue="1000" className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white w-32" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-gray-300 font-medium">Allow Event Registration</label>
              <p className="text-sm text-gray-400">Enable RSVP and ticketing for events</p>
            </div>
            <button className="px-4 py-2 bg-green-600 rounded-lg text-white hover:bg-green-700">Enabled</button>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <BellIcon className="w-6 h-6 mr-2 text-yellow-500" />
          Notification Settings
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-gray-300 font-medium">Email Notifications</label>
              <p className="text-sm text-gray-400">Send email notifications to users</p>
            </div>
            <button className="px-4 py-2 bg-green-600 rounded-lg text-white hover:bg-green-700">Enabled</button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-gray-300 font-medium">Push Notifications</label>
              <p className="text-sm text-gray-400">Send browser push notifications</p>
            </div>
            <button className="px-4 py-2 bg-green-600 rounded-lg text-white hover:bg-green-700">Enabled</button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-gray-300 font-medium">Notification Frequency</label>
              <p className="text-sm text-gray-400">How often to send digest emails</p>
            </div>
            <select className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white w-48">
              <option>Immediate</option>
              <option>Daily Digest</option>
              <option>Weekly Digest</option>
            </select>
          </div>
        </div>
      </div>

      {/* AI Advisor Settings */}
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <svg className="w-6 h-6 mr-2 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          AI Advisor Settings
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-gray-300 font-medium">Enable AI Advisor</label>
              <p className="text-sm text-gray-400">Activate AI chatbot for student assistance</p>
            </div>
            <button className="px-4 py-2 bg-green-600 rounded-lg text-white hover:bg-green-700">Enabled</button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-gray-300 font-medium">AI Response Tone</label>
              <p className="text-sm text-gray-400">Set the conversation style of AI responses</p>
            </div>
            <select className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white w-48">
              <option>Professional</option>
              <option>Friendly</option>
              <option>Casual</option>
            </select>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <ShieldCheckIcon className="w-6 h-6 mr-2 text-green-500" />
          Security Settings
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-gray-300 font-medium">Password Minimum Length</label>
              <p className="text-sm text-gray-400">Minimum characters required for passwords</p>
            </div>
            <input type="number" defaultValue="8" className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white w-32" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-gray-300 font-medium">Session Timeout</label>
              <p className="text-sm text-gray-400">Auto logout after inactivity (minutes)</p>
            </div>
            <input type="number" defaultValue="60" className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white w-32" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-gray-300 font-medium">Two-Factor Authentication</label>
              <p className="text-sm text-gray-400">Require 2FA for admin accounts</p>
            </div>
            <button className="px-4 py-2 bg-gray-700 rounded-lg text-gray-300 hover:bg-gray-600">Disabled</button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end space-x-4">
        <button className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600">
          Reset to Defaults
        </button>
        <button className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
          Save All Changes
        </button>
      </div>
    </div>
  )
}

export default SettingsSection
