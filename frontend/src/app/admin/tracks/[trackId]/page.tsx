'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { adminAPI, KnotAnnotation } from '@/lib/api';
import Link from 'next/link';

interface ProcessedKnot {
  x: number;
  y: number;
  order: number;
  sessionId: string;
}

interface SessionAnnotation {
  sessionId: string;
  knots: ProcessedKnot[];
  createdAt: string;
}

export default function TrackDetailPage() {
  const [sessionAnnotations, setSessionAnnotations] = useState<SessionAnnotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [hoveredKnot, setHoveredKnot] = useState<ProcessedKnot | null>(null);
  const params = useParams();
  const router = useRouter();
  const trackId = parseInt(params.trackId as string);

  useEffect(() => {
    // Check if admin is logged in
    const isLoggedIn = localStorage.getItem('adminLoggedIn');
    const username = localStorage.getItem('adminUsername');
    
    if (!isLoggedIn) {
      router.push('/admin');
      return;
    }
    
    setAdminUsername(username || '');
    if (trackId) {
      fetchTrackData();
    }
  }, [router, trackId]);

  const fetchTrackData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch all annotations for this track
      const allAnnotations = await adminAPI.getAllKnotAnnotations();
      const trackAnnotations = allAnnotations.filter(annotation => annotation.trackId === trackId);
      
      // Group annotations by session
      const sessionMap = new Map<string, KnotAnnotation[]>();
      trackAnnotations.forEach(annotation => {
        if (!sessionMap.has(annotation.sessionId)) {
          sessionMap.set(annotation.sessionId, []);
        }
        sessionMap.get(annotation.sessionId)!.push(annotation);
      });
      
      // Process sessions
      const processedSessions: SessionAnnotation[] = Array.from(sessionMap.entries()).map(([sessionId, annotations]) => {
        // Sort knots by their relative order
        const sortedKnots = annotations.sort((a, b) => a.relativeOrder - b.relativeOrder);
        
        const knots: ProcessedKnot[] = sortedKnots.map(annotation => ({
          x: annotation.x,
          y: annotation.y,
          order: annotation.relativeOrder,
          sessionId: annotation.sessionId
        }));
        
        // Get the creation time of the first annotation in this session
        const createdAt = annotations[0].createdAt;
        
        return {
          sessionId,
          knots,
          createdAt
        };
      });
      
      // Sort sessions by creation time (newest first)
      processedSessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setSessionAnnotations(processedSessions);
      
    } catch (err: any) {
      setError('Failed to fetch track data. Please try again.');
      console.error('Error fetching track data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminUsername');
    router.push('/admin');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getSessionColor = (sessionIndex: number) => {
    const colors = [
      '#3B82F6', // Blue
      '#EF4444', // Red
      '#10B981', // Green
      '#F59E0B', // Yellow
      '#8B5CF6', // Purple
      '#F97316', // Orange
      '#06B6D4', // Cyan
      '#84CC16', // Lime
    ];
    return colors[sessionIndex % colors.length];
  };

  const renderKnotVisualization = (session: SessionAnnotation, sessionIndex: number) => {
    // Filter valid knots
    const validKnots = session.knots.filter(knot => 
      !isNaN(knot.x) && !isNaN(knot.y) && isFinite(knot.x) && isFinite(knot.y)
    );

    if (validKnots.length === 0) {
      return (
        <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
          <p className="text-gray-500">No valid knots found for this session</p>
        </div>
      );
    }

    const sessionColor = getSessionColor(sessionIndex);

    return (
      <div className="h-96 w-full relative">
        <div className="absolute inset-0">
          <svg 
            width="100%" 
            height="100%" 
            className="border border-gray-200 rounded-lg bg-white"
            viewBox="0 0 800 600"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Define grid pattern */}
            <defs>
              <pattern id={`grid-${sessionIndex}`} width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f3f4f6" strokeWidth="0.5" strokeDasharray="2,2"/>
              </pattern>
            </defs>
            
            {/* Calculate bounds and scaling */}
            {(() => {
              const xValues = validKnots.map(k => k.x);
              const yValues = validKnots.map(k => k.y);
              const minX = Math.min(...xValues);
              const maxX = Math.max(...xValues);
              const minY = Math.min(...yValues);
              const maxY = Math.max(...yValues);
              
              // Add padding similar to placeknots page (dataMin - 0.5, dataMax + 0.5)
              const xPadding = Math.max((maxX - minX) * 0.1, 0.5);
              const yPadding = Math.max((maxY - minY) * 0.1, 0.5);
              const viewMinX = minX - xPadding;
              const viewMaxX = maxX + xPadding;
              const viewMinY = minY - yPadding;
              const viewMaxY = maxY + yPadding;
              
              const width = viewMaxX - viewMinX;
              const height = viewMaxY - viewMinY;
              
              const svgWidth = 800;
              const svgHeight = 600;
              const margin = { top: 40, right: 40, bottom: 80, left: 80 }; // Similar to placeknots margins
              
              const chartWidth = svgWidth - margin.left - margin.right;
              const chartHeight = svgHeight - margin.top - margin.bottom;
              
              const scaleX = chartWidth / width;
              const scaleY = chartHeight / height;
              
              return (
                <>
                  {/* Grid background */}
                  <rect 
                    x={margin.left} 
                    y={margin.top} 
                    width={chartWidth} 
                    height={chartHeight} 
                    fill={`url(#grid-${sessionIndex})`} 
                  />
                  
                  {/* Chart border */}
                  <rect 
                    x={margin.left} 
                    y={margin.top} 
                    width={chartWidth} 
                    height={chartHeight} 
                    fill="none" 
                    stroke="#d1d5db" 
                    strokeWidth="1"
                  />
                  
                  {/* X-axis ticks and labels */}
                  {(() => {
                    const tickCount = 5;
                    const ticks = [];
                    for (let i = 0; i <= tickCount; i++) {
                      const value = viewMinX + (width * i) / tickCount;
                      const x = margin.left + (chartWidth * i) / tickCount;
                      ticks.push(
                        <g key={`x-tick-${i}`}>
                          <line x1={x} y1={margin.top + chartHeight} x2={x} y2={margin.top + chartHeight + 5} stroke="#6b7280" strokeWidth="1"/>
                          <text x={x} y={margin.top + chartHeight + 20} textAnchor="middle" className="text-xs fill-gray-600">
                            {value.toFixed(2)}
                          </text>
                        </g>
                      );
                    }
                    return ticks;
                  })()}
                  
                  {/* Y-axis ticks and labels */}
                  {(() => {
                    const tickCount = 5;
                    const ticks = [];
                    for (let i = 0; i <= tickCount; i++) {
                      const value = viewMinY + (height * i) / tickCount;
                      const y = margin.top + chartHeight - (chartHeight * i) / tickCount; // Flip Y axis
                      ticks.push(
                        <g key={`y-tick-${i}`}>
                          <line x1={margin.left - 5} y1={y} x2={margin.left} y2={y} stroke="#6b7280" strokeWidth="1"/>
                          <text x={margin.left - 10} y={y + 4} textAnchor="end" className="text-xs fill-gray-600">
                            {value.toFixed(2)}
                          </text>
                        </g>
                      );
                    }
                    return ticks;
                  })()}
                  
                  {/* Axis labels */}
                  <text x={margin.left + chartWidth / 2} y={svgHeight - 20} textAnchor="middle" className="text-sm fill-gray-700 font-medium">
                    Local X
                  </text>
                  <text x={20} y={margin.top + chartHeight / 2} textAnchor="middle" className="text-sm fill-gray-700 font-medium" transform={`rotate(-90 20 ${margin.top + chartHeight / 2})`}>
                    Local Y
                  </text>
                  
                  {/* Knots */}
                  {validKnots.map((knot, index) => {
                    const x = margin.left + ((knot.x - viewMinX) / width) * chartWidth;
                    const y = margin.top + chartHeight - ((knot.y - viewMinY) / height) * chartHeight; // Flip Y axis
                    
                    return (
                      <circle
                        key={`knot-${index}`}
                        cx={x}
                        cy={y}
                        r="10"
                        fill={sessionColor}
                        stroke="white"
                        strokeWidth="3"
                        className="cursor-pointer hover:opacity-80 transition-all duration-200"
                        onMouseEnter={() => setHoveredKnot(knot)}
                        onMouseLeave={() => setHoveredKnot(null)}
                      />
                    );
                  })}
                  
                  {/* Knot order labels */}
                  {validKnots.map((knot, index) => {
                    const x = margin.left + ((knot.x - viewMinX) / width) * chartWidth;
                    const y = margin.top + chartHeight - ((knot.y - viewMinY) / height) * chartHeight;
                    
                    return (
                      <text
                        key={`label-${index}`}
                        x={x}
                        y={y + 4}
                        textAnchor="middle"
                        className="text-sm font-bold fill-white pointer-events-none"
                      >
                        {knot.order}
                      </text>
                    );
                  })}
                  
                  {/* Corner coordinate labels */}
                  <text x={margin.left + 5} y={margin.top + 15} className="text-xs fill-gray-500">
                    ({viewMinX.toFixed(2)}, {viewMaxY.toFixed(2)})
                  </text>
                  <text x={margin.left + chartWidth - 5} y={margin.top + chartHeight - 5} textAnchor="end" className="text-xs fill-gray-500">
                    ({viewMaxX.toFixed(2)}, {viewMinY.toFixed(2)})
                  </text>
                </>
              );
            })()}
          </svg>
        </div>
        
        {/* Hover tooltip */}
        {hoveredKnot && (
          <div className="absolute top-4 right-4 bg-black text-white p-3 rounded shadow-lg text-sm z-10">
            <div>Order: {hoveredKnot.order}</div>
            <div>X: {hoveredKnot.x.toFixed(4)}</div>
            <div>Y: {hoveredKnot.y.toFixed(4)}</div>
            <div>Session: {hoveredKnot.sessionId.slice(-8)}...</div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading track data...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Track {trackId} - Knot Annotations</h1>
              <p className="text-sm text-gray-600">Welcome, {adminUsername}</p>
            </div>
            <div className="flex space-x-4">
              <Link href="/admin/tracks">
                <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                  ← Back to Tracks
                </button>
              </Link>
              <button
                onClick={fetchTrackData}
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

          {/* Track Information */}
          <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
                        Track ID
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {trackId}
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
                        Total Sessions
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {sessionAnnotations.length}
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
                      <span className="text-white font-medium">K</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Knots
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {sessionAnnotations.reduce((total, session) => total + session.knots.length, 0)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Session Visualizations */}
          {sessionAnnotations.length > 0 ? (
            <div className="space-y-8">
              {sessionAnnotations.map((session, sessionIndex) => (
                <div key={session.sessionId} className="bg-white shadow rounded-lg p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Session {sessionIndex + 1}
                      <span 
                        className="ml-3 inline-block w-4 h-4 rounded-full" 
                        style={{ backgroundColor: getSessionColor(sessionIndex) }}
                      ></span>
                    </h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Session ID: {session.sessionId}</div>
                      <div>Created: {formatDate(session.createdAt)}</div>
                      <div>Knots: {session.knots.length}</div>
                      <div>Order: {session.knots.map(k => k.order).join(' → ')}</div>
                    </div>
                  </div>
                  
                  {renderKnotVisualization(session, sessionIndex)}
                  
                  {/* Knot Details */}
                  <div className="mt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Knot Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {session.knots.map((knot, index) => (
                        <div 
                          key={index} 
                          className="bg-gray-50 p-3 rounded-lg border-l-4"
                          style={{ borderLeftColor: getSessionColor(sessionIndex) }}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-semibold text-sm" style={{ color: getSessionColor(sessionIndex) }}>
                                Knot {knot.order}
                              </p>
                              <p className="text-xs" style={{ color: getSessionColor(sessionIndex) }}>
                                X: {knot.x.toFixed(4)}
                              </p>
                              <p className="text-xs" style={{ color: getSessionColor(sessionIndex) }}>
                                Y: {knot.y.toFixed(4)}
                              </p>
                            </div>
                            <div 
                              className="w-4 h-4 rounded-full border-2 border-white"
                              style={{ backgroundColor: getSessionColor(sessionIndex) }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <p className="text-gray-500">No annotations found for Track {trackId}.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
