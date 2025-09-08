'use client';

import { useState, useEffect } from 'react';
import { trajectoryAPI, TrajectoryData } from '@/lib/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Link from 'next/link';

export default function Home() {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [healthMessage, setHealthMessage] = useState<string>('');
  const [uniqueTrackIds, setUniqueTrackIds] = useState<number[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);
  const [trajectoryData, setTrajectoryData] = useState<TrajectoryData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Check backend connection on component mount
  useEffect(() => {
    checkBackendConnection();
    loadUniqueTrackIds();
  }, []);

  const checkBackendConnection = async () => {
    try {
      const health = await trajectoryAPI.checkHealth();
      setHealthMessage(health);
      setConnectionStatus('connected');
    } catch (err) {
      console.error('Backend connection failed:', err);
      setConnectionStatus('error');
      setError('Failed to connect to backend. Make sure the Spring Boot server is running on port 8080.');
    }
  };

  const loadUniqueTrackIds = async () => {
    try {
      const trackIds = await trajectoryAPI.getUniqueTrackIds();
      setUniqueTrackIds(trackIds);
    } catch (err) {
      console.error('Failed to load track IDs:', err);
    }
  };

  const loadTrajectoryData = async (trackId: number) => {
    setLoading(true);
    setError('');
    try {
      const data = await trajectoryAPI.getTrajectoryByTrackId(trackId);
      // Sort data by sceneId to ensure proper trajectory order
      const sortedData = data.sort((a, b) => a.sceneId - b.sceneId);
      setTrajectoryData(sortedData);
      setSelectedTrackId(trackId);
    } catch (err) {
      console.error('Failed to load trajectory data:', err);
      setError('Failed to load trajectory data');
    } finally {
      setLoading(false);
    }
  };

  const ConnectionStatusBadge = () => {
    const statusConfig = {
      checking: { color: 'bg-yellow-500', text: 'Checking Connection...' },
      connected: { color: 'bg-green-500', text: 'Connected to Backend' },
      error: { color: 'bg-red-500', text: 'Backend Connection Failed' }
    };

    const config = statusConfig[connectionStatus];

    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-white text-sm ${config.color}`}>
        <div className={`w-2 h-2 rounded-full bg-white mr-2 ${connectionStatus === 'checking' ? 'animate-pulse' : ''}`}></div>
        {config.text}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8 relative">
          <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-2xl shadow-2xl p-8 overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-white/10 to-transparent rounded-full transform -translate-x-20 -translate-y-20"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-white/10 to-transparent rounded-full transform translate-x-16 translate-y-16"></div>
            
            <div className="relative z-10">
              <h1 className="text-5xl font-bold text-white mb-6 drop-shadow-lg">
                <span className="bg-gradient-to-r from-yellow-200 to-white bg-clip-text text-transparent">
                  Trajectory Annotation Website
                </span>
              </h1>
              <p className="text-blue-100 text-lg mb-4 max-w-2xl mx-auto">
                Advanced platform for pedestrian trajectory analysis and human annotation research
              </p>
              <ConnectionStatusBadge />
              {healthMessage && (
                <div className="mt-4 bg-green-500/20 backdrop-blur-sm border border-green-400/30 rounded-lg p-3 inline-block">
                  <p className="text-green-100 font-medium">{healthMessage}</p>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Research Purpose Section */}
        <div className="relative bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 rounded-2xl shadow-xl p-8 mb-8 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full opacity-20 transform translate-x-16 -translate-y-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-200 to-blue-200 rounded-full opacity-20 transform -translate-x-12 translate-y-12"></div>
          
          <div className="relative z-10">
            <div className="flex items-center mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-3 mr-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Research Purpose
              </h2>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/30 shadow-lg">
                <div className="flex items-start space-x-4">
                  <div className="bg-gradient-to-r from-red-400 to-orange-500 rounded-full p-2 mt-1">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">The Challenge</h3>
                    <p className="text-gray-700 leading-relaxed">
                      Autonomous vehicle safety relies on testing against a wide range of pedestrian behaviors, from common crossing patterns to rare and unpredictable movements. Current simulation models and clustering methods often fall short because they miss subtle but important variations and lack a universally accepted benchmark for evaluating trajectory quality.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/30 shadow-lg">
                <div className="flex items-start space-x-4">
                  <div className="bg-gradient-to-r from-green-400 to-blue-500 rounded-full p-2 mt-1">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Our Solution</h3>
                    <p className="text-gray-700 leading-relaxed">
                      Our research work addresses this gap by gathering human annotations on pedestrian trajectories, allowing us to understand how people naturally perceive and group different movement patterns. These insights will help us group trajectories into meaningful patterns that capture both typical and unusual behaviors.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/30 shadow-lg">
                <div className="flex items-start space-x-4">
                  <div className="bg-gradient-to-r from-purple-400 to-pink-500 rounded-full p-2 mt-1">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">The Impact</h3>
                    <p className="text-gray-700 leading-relaxed">
                      By using human judgment alongside data-driven methods, we can make simulations more realistic and better prepared for real-world situations, ultimately improving autonomous vehicle safety and reliability.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Main Content */}
        {connectionStatus === 'connected' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Track Selection Panel */}
            <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-xl p-6 border border-blue-200/50">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-full opacity-30 transform translate-x-10 -translate-y-10"></div>
              <div className="relative z-10">
                <div className="flex items-center mb-4">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full p-2 mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Select Track ID</h2>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto bg-white/50 backdrop-blur-sm rounded-lg p-3 border border-white/30">
                  {uniqueTrackIds.map((trackId) => (
                    <button
                      key={trackId}
                      onClick={() => loadTrajectoryData(trackId)}
                      disabled={loading}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02] ${
                        selectedTrackId === trackId
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                          : 'bg-white/70 hover:bg-white/90 text-gray-700 shadow-sm hover:shadow-md'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span className="font-medium">Track ID: {trackId}</span>
                    </button>
                  ))}
                </div>
                <div className="mt-4 bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-white/30">
                  <p className="text-sm text-gray-600 font-medium">
                    📊 Total Tracks: <span className="text-blue-600 font-bold">{uniqueTrackIds.length}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Trajectory Data Panel */}
            <div className="lg:col-span-2 relative bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl shadow-xl p-6 border border-purple-200/50">
              <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full opacity-30 transform -translate-x-12 -translate-y-12"></div>
              <div className="relative z-10">
                <div className="flex items-center mb-4">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-full p-2 mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Trajectory Graph
                    {selectedTrackId && (
                      <span className="text-blue-600 ml-2">(Track ID: {selectedTrackId})</span>
                    )}
                  </h2>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-8 bg-white/50 backdrop-blur-sm rounded-lg border border-white/30">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
                    <span className="ml-3 text-gray-600 font-medium">Loading trajectory data...</span>
                  </div>
                ) : trajectoryData.length > 0 ? (
                  <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/30">
                    <div className="mb-4 flex justify-between items-center">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                        📈 Data Points: {trajectoryData.length}
                      </div>
                      <div className="bg-gradient-to-r from-gray-100 to-gray-200 p-3 rounded-lg border border-gray-300/50">
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                          <div><strong>X Range:</strong> {Math.min(...trajectoryData.map(d => d.localX)).toFixed(3)} to {Math.max(...trajectoryData.map(d => d.localX)).toFixed(3)}</div>
                          <div><strong>Y Range:</strong> {Math.min(...trajectoryData.map(d => d.localY)).toFixed(3)} to {Math.max(...trajectoryData.map(d => d.localY)).toFixed(3)}</div>
                        </div>
                      </div>
                    </div>
                    <div className="h-96 w-full bg-white rounded-lg p-2 shadow-inner border border-gray-200">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={trajectoryData}
                          margin={{
                            top: 20,
                            right: 30,
                            bottom: 80,
                            left: 80,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                          <XAxis 
                            type="number"
                            dataKey="localX"
                            domain={['dataMin - 0.5', 'dataMax + 0.5']}
                            tickFormatter={(value) => value.toFixed(2)}
                            label={{ value: 'Local X', position: 'insideBottomLeft', offset: -15, style: { fill: '#3B82F6', fontWeight: 'bold' } }}
                            stroke="#6366f1"
                          />
                          <YAxis 
                            type="number"
                            dataKey="localY"
                            domain={['dataMin - 0.5', 'dataMax + 0.5']}
                            tickFormatter={(value) => value.toFixed(2)}
                            label={{ value: 'Local Y', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#3B82F6', fontWeight: 'bold' } }}
                            stroke="#6366f1"
                          />
                          <Tooltip 
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-gradient-to-br from-white to-blue-50 p-4 border border-blue-200 rounded-xl shadow-xl backdrop-blur-sm">
                                    <p className="font-bold text-gray-800 mb-1">{`🎯 Scene ID: ${data.sceneId}`}</p>
                                    <p className="text-blue-600 font-medium">{`📍 X: ${Number(data.localX).toFixed(4)}`}</p>
                                    <p className="text-red-600 font-medium">{`📍 Y: ${Number(data.localY).toFixed(4)}`}</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend wrapperStyle={{ color: '#3B82F6', fontWeight: 'bold' }} />
                          <Line 
                            type="linear"
                            dataKey="localY"
                            stroke="url(#trajectoryGradient)"
                            strokeWidth={4}
                            dot={false}
                            activeDot={{ r: 8, fill: '#3B82F6', stroke: '#ffffff', strokeWidth: 3, filter: 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.5))' }}
                            name="🚶 Trajectory Path"
                            connectNulls={false}
                          />
                          <defs>
                            <linearGradient id="trajectoryGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#DC2626" />
                              <stop offset="50%" stopColor="#7C3AED" />
                              <stop offset="100%" stopColor="#2563EB" />
                            </linearGradient>
                          </defs>
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white/50 backdrop-blur-sm rounded-lg border border-white/30">
                    <div className="text-6xl mb-4">📊</div>
                    <p className="text-gray-500 text-lg font-medium">Select a track ID to view trajectory graph</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Backend Instructions */}
        {connectionStatus === 'error' && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Backend Connection Issue</h2>
            <div className="space-y-3 text-gray-600">
              <p>To connect the frontend to your backend, please ensure:</p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Your Spring Boot backend is running on port 8080</li>
                <li>Navigate to your Backend directory</li>
                <li>Run: <code className="bg-gray-100 px-2 py-1 rounded">./mvnw spring-boot:run</code></li>
                <li>Or run: <code className="bg-gray-100 px-2 py-1 rounded">mvn spring-boot:run</code></li>
              </ol>
              <button
                onClick={checkBackendConnection}
                className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
              >
                Retry Connection
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {connectionStatus === 'connected' && (
          <div className="mt-8">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-center text-gray-800 mb-6">
                Explore Our Research Tools
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link href="/admin">
                  <div className="group relative bg-gradient-to-br from-red-400 to-red-600 rounded-xl p-6 text-center hover:from-red-500 hover:to-red-700 transition-all duration-300 transform hover:scale-105 hover:shadow-xl cursor-pointer">
                    <div className="bg-white/20 rounded-full p-3 w-16 h-16 mx-auto mb-4 group-hover:bg-white/30 transition-colors">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <h4 className="text-xl font-bold text-white mb-2">Admin Portal</h4>
                    <p className="text-red-100 text-sm">Manage data and system settings</p>
                  </div>
                </Link>
                
                <Link href="/knot-comparison">
                  <div className="group relative bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl p-6 text-center hover:from-orange-500 hover:to-orange-700 transition-all duration-300 transform hover:scale-105 hover:shadow-xl cursor-pointer">
                    <div className="bg-white/20 rounded-full p-3 w-16 h-16 mx-auto mb-4 group-hover:bg-white/30 transition-colors">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h4 className="text-xl font-bold text-white mb-2">Knot Comparison</h4>
                    <p className="text-orange-100 text-sm">Compare trajectory annotations</p>
                  </div>
                </Link>
                
                <Link href="/placeknots">
                  <div className="group relative bg-gradient-to-br from-green-400 to-green-600 rounded-xl p-6 text-center hover:from-green-500 hover:to-green-700 transition-all duration-300 transform hover:scale-105 hover:shadow-xl cursor-pointer">
                    <div className="bg-white/20 rounded-full p-3 w-16 h-16 mx-auto mb-4 group-hover:bg-white/30 transition-colors">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                      </svg>
                    </div>
                    <h4 className="text-xl font-bold text-white mb-2">Place Knots</h4>
                    <p className="text-green-100 text-sm">Annotate trajectory patterns</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Collaboration Section */}
        {connectionStatus === 'connected' && (
          <div className="mt-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Collaboration</h3>
              <p className="text-gray-700 mb-4">
                This project is a joint collaboration between Bangladesh University of Engineering and Technology (BUET), California Polytechnic State University (Cal Poly), and the University of California, Santa Cruz (UCSC), with contributions from:
              </p>
              <div className="space-y-2 text-gray-700">
                <p>• <strong>Dr. Golam Md Muktadir, PHD</strong>, University of California, Santa Cruz</p>
                <p>• <strong>Dr. A. B. M. Alim Al Islam, Professor</strong>, Bangladesh University of Engineering and Technology (BUET)</p>
                <p>• <strong>Dr. Fahim Khan, Assistant Professor</strong>, Computer Science and Software Engineering, California Polytechnic State University</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
