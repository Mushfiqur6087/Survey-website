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
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Survey Website - Trajectory Graph Viewer</h1>
          <ConnectionStatusBadge />
          {healthMessage && (
            <p className="text-green-600 mt-2 font-medium">{healthMessage}</p>
          )}
        </header>

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
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Track ID</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {uniqueTrackIds.map((trackId) => (
                  <button
                    key={trackId}
                    onClick={() => loadTrajectoryData(trackId)}
                    disabled={loading}
                    className={`w-full text-left px-4 py-2 rounded transition-colors ${
                      selectedTrackId === trackId
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Track ID: {trackId}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Total Tracks: {uniqueTrackIds.length}
              </p>
            </div>

            {/* Trajectory Data Panel */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Trajectory Graph
                {selectedTrackId && (
                  <span className="text-blue-600 ml-2">(Track ID: {selectedTrackId})</span>
                )}
              </h2>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                  <span className="ml-3 text-gray-600">Loading trajectory data...</span>
                </div>
              ) : trajectoryData.length > 0 ? (
                <div>
                  <div className="mb-4 flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      Data Points: {trajectoryData.length}
                    </div>
                    <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                      <div className="grid grid-cols-2 gap-2">
                        <div>X Range: {Math.min(...trajectoryData.map(d => d.localX)).toFixed(3)} to {Math.max(...trajectoryData.map(d => d.localX)).toFixed(3)}</div>
                        <div>Y Range: {Math.min(...trajectoryData.map(d => d.localY)).toFixed(3)} to {Math.max(...trajectoryData.map(d => d.localY)).toFixed(3)}</div>
                      </div>
                    </div>
                  </div>
                  <div className="h-96 w-full">
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
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          type="number"
                          dataKey="localX"
                          domain={['dataMin - 0.5', 'dataMax + 0.5']}
                          tickFormatter={(value) => value.toFixed(2)}
                          label={{ value: 'Local X', position: 'insideBottomLeft', offset: -15, style: { fill: '#3B82F6' } }}
                        />
                        <YAxis 
                          type="number"
                          dataKey="localY"
                          domain={['dataMin - 0.5', 'dataMax + 0.5']}
                          tickFormatter={(value) => value.toFixed(2)}
                          label={{ value: 'Local Y', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#3B82F6' } }}
                        />
                        <Tooltip 
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
                                  <p className="font-semibold">{`Scene ID: ${data.sceneId}`}</p>
                                  <p className="text-blue-600">{`X Coordinate: ${Number(data.localX).toFixed(4)}`}</p>
                                  <p className="text-red-600">{`Y Coordinate: ${Number(data.localY).toFixed(4)}`}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend wrapperStyle={{ color: '#3B82F6' }} />
                        <Line 
                          type="linear"
                          dataKey="localY"
                          stroke="#DC2626"
                          strokeWidth={3}
                          dot={false}
                          activeDot={{ r: 6, fill: '#3B82F6', stroke: '#ffffff', strokeWidth: 2 }}
                          name="Trajectory Path"
                          connectNulls={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Select a track ID to view trajectory graph
                </div>
              )}
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
          <div className="mt-8 text-center">
            <div className="flex justify-center space-x-4">
              <Link href="/admin">
                <button className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full font-semibold transition-colors">
                  Admin Login
                </button>
              </Link>
              <Link href="/knot-comparison">
                <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full font-semibold transition-colors">
                  Knot Comparison
                </button>
              </Link>
              <Link href="/placeknots">
                <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full font-semibold transition-colors">
                  Place Knots
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
