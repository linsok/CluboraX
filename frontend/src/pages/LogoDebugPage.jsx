import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../api/client'

export default function LogoDebugPage() {
  const { data: clubs = [], isLoading, error } = useQuery({
    queryKey: ['debug-clubs'],
    queryFn: async () => {
      const cacheBust = Math.floor(Date.now() / 1000)
      const res = await apiClient.get(`/api/clubs/?ordering=-created_at&t=${cacheBust}`)
      return res.data?.results || res.data || []
    },
    staleTime: 0,
    refetchInterval: 5000,
  })

  if (isLoading) return <div className="p-8">Loading...</div>
  if (error) return <div className="p-8 text-red-600">Error: {error.message}</div>

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen font-mono text-sm">
      <h1 className="text-2xl mb-6">🔍 Logo Debug Page</h1>
      
      {clubs.slice(0, 5).map(club => (
        <div key={club.id} className="mb-6 p-4 border border-gray-700 rounded bg-gray-800">
          <h2 className="text-lg font-bold mb-2">{club.name}</h2>
          
          <div className="space-y-1 ml-4">
            <p>ID: <span className="text-cyan-400">{club.id}</span></p>
            <p>logo: <span className="text-yellow-400">{club.logo || 'null'}</span></p>
            <p>logo_url: <span className="text-yellow-400">{club.logo_url || 'null'}</span></p>
            <p>Status: <span className="text-green-400">{club.status}</span></p>
          </div>

          {club.logo_url && (
            <div className="mt-4 p-2 border border-gray-600 rounded bg-gray-700">
              <p className="text-gray-300 mb-2">Preview:</p>
              <img 
                src={club.logo_url} 
                alt={club.name}
                className="h-24 w-24 object-cover rounded"
                onError={(e) => {
                  e.target.className = 'h-24 w-24 object-cover rounded border-2 border-red-500'
                  e.target.alt = '❌ Failed to load'
                }}
              />
            </div>
          )}
        </div>
      ))}

      <div className="mt-8 p-4 bg-blue-900 border border-blue-600 rounded">
        <p className="text-blue-200">
          <strong>Last refresh:</strong> {new Date().toLocaleTimeString()}
        </p>
        <p className="text-blue-300 text-xs mt-2">
          This page auto-refreshes every 5 seconds with cache-bust parameter
        </p>
      </div>
    </div>
  )
}
