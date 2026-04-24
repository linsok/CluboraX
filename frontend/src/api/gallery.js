import { apiClient } from './client'

// ── Gallery ────────────────────────────────────────────────────────────────────

export const getGalleries = async (params = {}) => {
  const res = await apiClient.get('/api/gallery/', { params })
  return res.data?.results ?? res.data ?? []
}

export const getGallery = async (id) => {
  const res = await apiClient.get(`/api/gallery/${id}/`)
  return res.data
}

export const createGallery = async (data) => {
  const res = await apiClient.post('/api/gallery/', data)
  return res.data
}

export const updateGallery = async (id, data) => {
  const res = await apiClient.patch(`/api/gallery/${id}/`, data)
  return res.data
}

export const deleteGallery = async (id) => {
  await apiClient.delete(`/api/gallery/${id}/`)
}

// ── Media Files ────────────────────────────────────────────────────────────────

export const getMediaFiles = async (params = {}) => {
  const res = await apiClient.get('/api/gallery/media/', { params })
  return res.data?.results ?? res.data ?? []
}

export const uploadMediaFile = async (data) => {
  const res = await apiClient.post('/api/gallery/media/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export const updateMediaFile = async (id, data) => {
  const res = await apiClient.patch(`/api/gallery/media/${id}/`, data)
  return res.data
}

export const deleteMediaFile = async (id) => {
  await apiClient.delete(`/api/gallery/media/${id}/`)
}

export const likeMediaFile = async (mediaFileId) => {
  const res = await apiClient.post(`/api/gallery/media/${mediaFileId}/like/`)
  return res.data
}

export const moderateMediaFile = async (mediaFileId, data) => {
  const res = await apiClient.post(
    `/api/gallery/media/${mediaFileId}/moderate/`,
    data
  )
  return res.data
}

// ── Comments ───────────────────────────────────────────────────────────────────

export const getComments = async (params = {}) => {
  const res = await apiClient.get('/api/gallery/comments/', { params })
  return res.data?.results ?? res.data ?? []
}

export const addComment = async (data) => {
  const res = await apiClient.post('/api/gallery/comments/', data)
  return res.data
}

export const deleteComment = async (id) => {
  await apiClient.delete(`/api/gallery/comments/${id}/`)
}

// ── Tags ───────────────────────────────────────────────────────────────────────

export const getTags = async () => {
  const res = await apiClient.get('/api/gallery/tags/')
  return res.data?.results ?? res.data ?? []
}

// ── Collections ────────────────────────────────────────────────────────────────

export const getCollections = async () => {
  const res = await apiClient.get('/api/gallery/collections/')
  return res.data?.results ?? res.data ?? []
}

export const createCollection = async (data) => {
  const res = await apiClient.post('/api/gallery/collections/', data)
  return res.data
}

// ── Media Stats ────────────────────────────────────────────────────────────────

export const getMediaStats = async () => {
  const res = await apiClient.get('/api/gallery/stats/')
  return res.data
}
