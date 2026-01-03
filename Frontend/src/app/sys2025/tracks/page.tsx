'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { trajectoryAPI, adminAPI, KnotAnnotation } from '@/lib/api';
import Link from 'next/link';

interface TrackSummary {
  trackId: number;
  annotationCount: number;
  sessionCount: number;
  lastAnnotated: string;
}

export default function TracksPage() {
  const [tracks, setTracks] = useState<TrackSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check if admin is logged in
    const isLoggedIn = localStorage.getItem('adminLoggedIn');
    const username = localStorage.getItem('adminUsername');
    
    if (!isLoggedIn) {
      router.push('/sys2025');
      return;
    }
    
    setAdminUsername(username || '');
    fetchTracksData();
  }, [router]);

  const fetchTracksData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get all annotations to analyze track data
      const annotations = await adminAPI.getAllKnotAnnotations();
      
      // Process annotations to get track summaries
      const trackMap = new Map<number, KnotAnnotation[]>();
      
      annotations.forEach(annotation => {
        if (!trackMap.has(annotation.trackId)) {
          trackMap.set(annotation.trackId, []);
        }
        trackMap.get(annotation.trackId)!.push(annotation);
      });
      
      // Create track summaries
      const trackSummaries: TrackSummary[] = Array.from(trackMap.entries()).map(([trackId, trackAnnotations]) => {
        const uniqueSessions = new Set(trackAnnotations.map(a => a.sessionId));
        const lastAnnotation = trackAnnotations.reduce((latest, current) => {
          return new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest;
        });
        
        return {
          trackId,
          annotationCount: trackAnnotations.length,
          sessionCount: uniqueSessions.size,
          lastAnnotated: lastAnnotation.createdAt
        };
      });
      
      // Sort by track ID
      trackSummaries.sort((a, b) => a.trackId - b.trackId);
      setTracks(trackSummaries);
      
    } catch (err: any) {
      setError('Failed to fetch tracks data. Please try again.');
      console.error('Error fetching tracks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminUsername');
    router.push('/sys2025');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tracks data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Track Analytics</h1>
              <p className="text-sm text-gray-600">Welcome, {adminUsername}</p>
            </div>
            <div className="flex space-x-4">
              <Link href="/sys2025/dashboard">
                <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                  ← Back to Dashboard
                </button>
              </Link>
              <button
                onClick={fetchTracksData}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Refresh Data
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Summary Statistics */}
          <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-medium">T</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Tracks
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {tracks.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-medium">A</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Annotations
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {tracks.reduce((sum, track) => sum + track.annotationCount, 0)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-medium">S</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Avg Annotations/Track
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {tracks.length > 0 ? (tracks.reduce((sum, track) => sum + track.annotationCount, 0) / tracks.length).toFixed(1) : '0'}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-medium">M</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Most Annotated
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {tracks.length > 0 ? Math.max(...tracks.map(t => t.annotationCount)) : '0'}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                All Tracks with Annotations
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Click on any track to view its annotated trajectories and visualizations
              </p>
            </div>

            {tracks.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No tracks with annotations found.</p>
              </div>
            ) : (
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Track ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Annotations
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unique Sessions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Annotated
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tracks.map((track) => (
                      <tr key={track.trackId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Track {track.trackId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {track.annotationCount} annotations
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {track.sessionCount} sessions
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(track.lastAnnotated)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link href={`/sys2025/tracks/${track.trackId}`}>
                            <button className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-md transition-colors">
                              View Details →
                            </button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
