'use client';

import { useState, useEffect, useRef } from 'react';
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
      router.push('/sys2025');
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
    router.push('/sys2025');
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

    return (
      <KnotVisualizationCanvas 
        knots={validKnots}
        sessionIndex={sessionIndex}
        width={800}
        height={384}
      />
    );
  };

  // Canvas-based knot visualization component (exact same approach as placeknots page)
  const KnotVisualizationCanvas = ({ knots, sessionIndex, width = 800, height = 384 }: {
    knots: ProcessedKnot[];
    sessionIndex: number;
    width?: number;
    height?: number;
  }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || knots.length === 0) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Sort knots by their order first (for consistent processing)
      const sortedKnots = [...knots].sort((a, b) => a.order - b.order);
      
      if (sortedKnots.length === 0) return;

      // Sort knots by their spatial order along the trajectory (not placement order)
      // This creates a path that follows the original trajectory more closely
      const createTrajectoryOrderedPath = (knots: ProcessedKnot[]): ProcessedKnot[] => {
        if (knots.length <= 1) return knots;
        
        const orderedPath: ProcessedKnot[] = [];
        const remaining = [...knots];
        
        // Start with the knot that has the smallest x-coordinate (leftmost)
        // This gives us a consistent starting point
        let currentKnot = remaining.reduce((min, knot) => 
          knot.x < min.x ? knot : min
        );
        
        orderedPath.push(currentKnot);
        remaining.splice(remaining.indexOf(currentKnot), 1);
        
        // Build path by always choosing the nearest remaining knot
        while (remaining.length > 0) {
          let nearestKnot = remaining[0];
          let minDistance = Infinity;
          
          // Find the nearest unvisited knot
          for (const knot of remaining) {
            const dx = knot.x - currentKnot.x;
            const dy = knot.y - currentKnot.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minDistance) {
              minDistance = distance;
              nearestKnot = knot;
            }
          }
          
          orderedPath.push(nearestKnot);
          remaining.splice(remaining.indexOf(nearestKnot), 1);
          currentKnot = nearestKnot;
        }
        
        return orderedPath;
      };

      // Create trajectory-ordered path for drawing connections
      const trajectoryOrderedKnots = createTrajectoryOrderedPath(sortedKnots);

      // Calculate bounds for scaling - match main chart domain exactly
      // Use knot positions and apply the same domain logic as perfected KnotVisualization
      const xValues = sortedKnots.map((k: ProcessedKnot) => k.x);
      const yValues = sortedKnots.map((k: ProcessedKnot) => k.y);
      
      // Match the main chart domain: 'dataMin - 0.5' to 'dataMax + 0.5'
      const dataMinX = Math.min(...xValues);
      const dataMaxX = Math.max(...xValues);
      const dataMinY = Math.min(...yValues);
      const dataMaxY = Math.max(...yValues);
      
      const minX = dataMinX - 0.5;
      const maxX = dataMaxX + 0.5;
      const minY = dataMinY - 0.5;
      const maxY = dataMaxY + 0.5;

      // Match Recharts margins exactly
      const marginTop = 20;
      const marginRight = 30; 
      const marginBottom = 80;
      const marginLeft = 80;
      
      // Calculate drawable area (same as Recharts does)
      const drawWidth = width - marginLeft - marginRight;
      const drawHeight = height - marginTop - marginBottom;

      // Calculate ranges
      const xRange = maxX - minX || 1;
      const yRange = maxY - minY || 1;
      
      // Use independent scaling for X and Y axes like Recharts does
      // Apply fine-tuning to match Recharts' exact coordinate calculations
      const scaleX = (drawWidth / xRange) * 1.09; // Slightly more X-axis scaling
      const scaleY = (drawHeight / yRange) * 0.91; // Slightly less Y-axis scaling

      // Calculate scaled points for all knots (for drawing individual knots)
      const scaledPoints = sortedKnots.map((knot: ProcessedKnot) => ({
        x: marginLeft + (knot.x - minX) * scaleX,
        y: marginTop + (maxY - knot.y) * scaleY, // Flip Y axis to match chart orientation
        originalKnot: knot
      }));

      // Calculate scaled points for trajectory-ordered knots (for drawing connections)
      const trajectoryScaledPoints = trajectoryOrderedKnots.map((knot: ProcessedKnot) => ({
        x: marginLeft + (knot.x - minX) * scaleX,
        y: marginTop + (maxY - knot.y) * scaleY, // Flip Y axis to match chart orientation
        originalKnot: knot
      }));

      // Get session color
      const sessionColor = getSessionColor(sessionIndex);

      // Draw connecting lines following trajectory order (spatial proximity)
      if (trajectoryScaledPoints.length > 1) {
        ctx.beginPath();
        ctx.moveTo(trajectoryScaledPoints[0].x, trajectoryScaledPoints[0].y);
        for (let i = 1; i < trajectoryScaledPoints.length; i++) {
          ctx.lineTo(trajectoryScaledPoints[i].x, trajectoryScaledPoints[i].y);
        }
        ctx.strokeStyle = sessionColor;
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.stroke();
      }

      // Draw knot points (using original order for consistent appearance)
      scaledPoints.forEach((point, index) => {
        const knot = point.originalKnot;
        
        ctx.beginPath();
        ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI);
        ctx.fillStyle = sessionColor;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.stroke();

        // Draw order number on knot
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(knot.order.toString(), point.x, point.y);
      });

    }, [knots, sessionIndex, width, height]);

    return (
      <div className="flex flex-col items-center space-y-4">
        <div className="w-full max-w-4xl">
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="border border-gray-300 rounded-lg bg-white w-full"
            style={{ maxWidth: '100%', height: 'auto', aspectRatio: `${width}/${height}` }}
          />
        </div>
        <div className="text-sm text-gray-600 text-center">
          <p>
            <span 
              className="inline-block w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: getSessionColor(sessionIndex) }}
            ></span>
            Knots (Order: {knots.map((k: ProcessedKnot) => k.order).join(' → ')})
            <span 
              className="inline-block w-4 h-0.5 mr-2 ml-4" 
              style={{ backgroundColor: getSessionColor(sessionIndex) }}
            ></span>
            Connection Line
          </p>
          <p className="mt-2">Knots connected by spatial proximity to follow original trajectory path.</p>
        </div>
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
              <Link href="/sys2025/tracks">
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