import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { getUserAchievements } from '../api/courses'
import { updateProfile } from '../api/profile'
import toast from 'react-hot-toast'
import {
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  AcademicCapIcon,
  CalendarIcon,
  PencilIcon,
  CameraIcon,
  ArrowRightOnRectangleIcon,
  CogIcon,
  XMarkIcon,
  SparklesIcon,
  StarIcon,
  TrophyIcon,
  IdentificationIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editFormData, setEditFormData] = useState({ name: '', email: '', phone: '' })
  const navigate = useNavigate()
  const { user, logout, isAuthenticated, isLoading } = useAuth()

  const { data: realAchievements } = useQuery({
    queryKey: ['user-achievements'],
    queryFn: getUserAchievements,
    retry: 2,
    staleTime: 15 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    navigate('/login')
    return null
  }

  const userData = {
    name: [(user?.first_name || '').trim(), (user?.last_name || '').trim()].filter(Boolean).join(' ')
      || user?.full_name?.trim() || user?.name || 'User',
    email: user?.email || '',
    phone: user?.phone || '',
    major: user?.major || '',
    year: user?.year || '',
    studentId: user?.student_id || user?.studentId || '',
    joinDate: user?.date_joined
      ? new Date(user.date_joined).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
      : '',
    bio: user?.bio || 'Campus community member',
    role: user?.role || 'student',
    achievements: realAchievements || [],
    clubs: user?.clubs || [],
  }

  const roleColors = {
    admin: 'from-rose-500 to-gray-600',
    organizer: 'from-amber-500 to-orange-500',
    student: 'from-violet-500 to-purple-600',
  }
  const roleBadgeColors = {
    admin: 'bg-rose-100 text-rose-700 border border-rose-200',
    organizer: 'bg-amber-100 text-amberber-700 border border-amber-200',
    student: 'bg-violet-100 text-violet-700 border border-violet-200',
  }
  const bannerGradient = roleColors[userData.role] || roleColors.student
  const badgeClass = roleBadgeColors[userData.role] || roleBadgeColors.student

  const initials = userData.name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()

  const handleEditProfile = () => {
    const displayName = (user?.first_name && user?.last_name)
      ? `${user.first_name} ${user.last_name}`.trim()
      : (user?.name || user?.full_name || '').trim()
    setEditFormData({ name: displayName || '', email: userData.email, phone: userData.phone })
    setIsEditing(true)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setEditFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const nameParts = editFormData.name?.trim().split(/\s+/) || []
      if (!nameParts[0]?.trim()) {
        toast.error('Name is required.')
        setIsSaving(false)
        return
      }
      let phoneToSend = editFormData.phone?.trim() || ''
      if (phoneToSend) {
        const cleanPhone = phoneToSend.replace(/[\s\-()]/g, '')
        if (!/^(\+)?[\d]{7,15}$/.test(cleanPhone)) {
          toast.error('Phone must be 7–15 digits. Example: 098890913')
          setIsSaving(false)
          return
        }
      }
      await updateProfile({
        first_name: nameParts[0],
        last_name: nameParts.slice(1).join(' ') || '',
        phone: phoneToSend
      })
      setIsEditing(false)
      toast.success('Profile updated successfully!')
    } catch (err) {
      const errorData = err.response?.data
      if (errorData?.data) {
        const msgs = Object.entries(errorData.data)
          .map(([f, v]) => `${f}: ${Array.isArray(v) ? v[0] : v}`)
          .join('\n')
        toast.error(msgs || 'Failed to update profile.')
      } else {
        toast.error(errorData?.message || err?.message || 'Failed to update profile.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const stats = [
    { label: 'Achievements', value: userData.achievements.length, icon: TrophyIcon, color: 'text-amber-500' },
    { label: 'Clubs', value: userData.clubs.length, icon: SparklesIcon, color: 'text-violet-500' },
    { label: 'Year', value: userData.year || '—', icon: StarIcon, color: 'text-blue-500' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ── Hero Card ────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl shadow-xl overflow-hidden mb-6"
        >
          {/* Banner */}
          <div className={`bg-gradient-to-r ${bannerGradient} h-36 relative`}>
            {/* decorative circles */}
            <div className="absolute -top-6 -right-6 w-40 h-40 bg-white/10 rounded-full" />
            <div className="absolute top-4 right-20 w-20 h-20 bg-white/10 rounded-full" />
            {/* action buttons */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={handleEditProfile}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-lg backdrop-blur-sm transition-all"
              >
                <PencilIcon className="h-4 w-4" /> Edit
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg backdrop-blur-sm transition-all"
                title="Settings"
              >
                <CogIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => { if (window.confirm('Sign out?')) logout() }}
                className="p-1.5 bg-white/10 hover:bg-red-500/60 text-white rounded-lg backdrop-blur-sm transition-all"
                title="Sign Out"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Avatar + Info */}
          <div className="bg-white px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-14">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className={`w-28 h-28 bg-gradient-to-br ${bannerGradient} rounded-2xl shadow-lg flex items-center justify-center border-4 border-white`}>
                  {user?.profile_picture_url ? (
                    <img src={user.profile_picture_url} alt={userData.name} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <span className="text-4xl font-bold text-white tracking-wide">{initials || <UserCircleIcon className="h-16 w-16 text-white/80" />}</span>
                  )}
                </div>
                <button className="absolute -bottom-1 -right-1 bg-purple-600 hover:bg-purple-700 text-white p-1.5 rounded-lg shadow-md transition-colors">
                  <CameraIcon className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Name & role */}
              <div className="flex-1 pt-2 sm:pt-10">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900">{userData.name}</h1>
                  <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full capitalize ${badgeClass}`}>
                    {userData.role}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{userData.bio}</p>
              </div>

              {/* Stats row (desktop: right-aligned) */}
              <div className="hidden sm:flex gap-5 pb-1">
                {stats.map(s => (
                  <div key={s.label} className="text-center">
                    <p className="text-xl font-bold text-gray-900">{s.value}</p>
                    <p className="text-xs text-gray-500">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats row (mobile) */}
            <div className="flex sm:hidden justify-around mt-4 pt-4 border-t border-gray-100">
              {stats.map(s => (
                <div key={s.label} className="text-center">
                  <p className="text-lg font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Info Cards ───────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-violet-50 rounded-lg">
                <EnvelopeIcon className="h-5 w-5 text-violet-600" />
              </div>
              <h2 className="font-semibold text-gray-800">Contact</h2>
            </div>
            <div className="space-y-3">
              <InfoRow icon={<EnvelopeIcon className="h-4 w-4 text-gray-400" />} label="Email" value={userData.email || '—'} />
              <InfoRow icon={<PhoneIcon className="h-4 w-4 text-gray-400" />} label="Phone" value={userData.phone || '—'} />
            </div>
          </motion.div>

          {/* Academic */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <AcademicCapIcon className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="font-semibold text-gray-800">Academic</h2>
            </div>
            <div className="space-y-3">
              <InfoRow icon={<AcademicCapIcon className="h-4 w-4 text-gray-400" />} label="Major" value={userData.major || '—'} />
              <InfoRow icon={<IdentificationIcon className="h-4 w-4 text-gray-400" />} label="Student ID" value={userData.studentId || '—'} />
              <InfoRow icon={<CalendarIcon className="h-4 w-4 text-gray-400" />} label="Joined" value={userData.joinDate || '—'} />
            </div>
          </motion.div>

          {/* Account */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 md:col-span-2"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <ShieldCheckIcon className="h-5 w-5 text-emerald-600" />
              </div>
              <h2 className="font-semibold text-gray-800">Account</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {stats.map(s => (
                <div key={s.label} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                  <div className={`p-2 bg-white rounded-lg shadow-sm`}>
                    <s.icon className={`h-5 w-5 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{s.value}</p>
                    <p className="text-xs text-gray-500">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── Edit Profile Modal ───────────────────────────── */}
        <AnimatePresence>
          {isEditing && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                onClick={() => setIsEditing(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
              >
                <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
                  {/* header */}
                  <div className={`bg-gradient-to-r ${bannerGradient} px-6 py-4 flex items-center justify-between`}>
                    <h2 className="text-lg font-bold text-white">Edit Profile</h2>
                    <button onClick={() => setIsEditing(false)} className="text-white/80 hover:text-white">
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  {/* body */}
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={editFormData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-gray-400 text-xs">(read-only)</span></label>
                      <input
                        type="email"
                        value={editFormData.email}
                        disabled
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-400 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-gray-400 text-xs">(optional)</span></label>
                      <input
                        type="tel"
                        name="phone"
                        value={editFormData.phone}
                        onChange={handleInputChange}
                        placeholder="098890913 or +85598098913"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                      />
                      <p className="text-xs text-gray-400 mt-1">7–15 digits. Leave blank if not needed.</p>
                    </div>
                  </div>

                  {/* footer */}
                  <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className={`px-6 py-2 bg-gradient-to-r ${bannerGradient} text-white rounded-xl font-medium flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-md transition-all`}
                    >
                      {isSaving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Small helper row
const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-center gap-3">
    <div className="flex-shrink-0">{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-800 truncate">{value}</p>
    </div>
  </div>
)

export default Profile
