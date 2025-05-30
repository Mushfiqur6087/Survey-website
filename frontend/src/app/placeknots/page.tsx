'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { trajectoryAPI, TrajectoryData, AnnotationSubmission, TrajectoryAnnotation, KnotData } from '@/lib/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';

interface Point {
  x: number;
  y: number;
}

interface KnotVisualizationProps {
  knots: KnotAnnotation[];
  knotPlacementOrder: Map<string, number>;
  trajectoryData: TrajectoryData[];
  width?: number;
  height?: number;
}

/**
 * Canvas-based visualization of placed knots connected by lines
 */
function KnotVisualization({ knots, knotPlacementOrder, trajectoryData, width = 400, height = 300 }: KnotVisualizationProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || knots.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Sort knots by their position along the trajectory
    const sortedKnots = [...knots].sort((knotA, knotB) => {
      // Find the closest trajectory points for each knot
      const findClosestTrajectoryIndex = (knot: KnotAnnotation) => {
        let minDistance = Infinity;
        let closestIndex = 0;
        
        trajectoryData.forEach((point, index) => {
          const distance = Math.sqrt(
            Math.pow(point.localX - knot.x, 2) + Math.pow(point.localY - knot.y, 2)
          );
          if (distance < minDistance) {
            minDistance = distance;
            closestIndex = index;
          }
        });
        
        return closestIndex;
      };
      
      const indexA = findClosestTrajectoryIndex(knotA);
      const indexB = findClosestTrajectoryIndex(knotB);
      
      return indexA - indexB;
    });

    if (sortedKnots.length === 0) return;

    // Calculate bounds for scaling - maintain same proportions as original chart
    const xValues = sortedKnots.map(k => k.x);
    const yValues = sortedKnots.map(k => k.y);
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);

    // Add padding
    const padding = 40;
    const drawWidth = width - 2 * padding;
    const drawHeight = height - 2 * padding;

    // Use separate scales for X and Y to maintain original chart proportions
    const xRange = maxX - minX || 1;
    const yRange = maxY - minY || 1;
    
    const scaleX = drawWidth / xRange;
    const scaleY = drawHeight / yRange;

    const scaledPoints = sortedKnots.map(knot => ({
      x: padding + (knot.x - minX) * scaleX,
      y: padding + (maxY - knot.y) * scaleY, // Flip Y axis to match chart orientation
      originalKnot: knot
    }));

    // Draw connecting lines in trajectory order
    if (scaledPoints.length > 1) {
      ctx.beginPath();
      ctx.moveTo(scaledPoints[0].x, scaledPoints[0].y);
      for (let i = 1; i < scaledPoints.length; i++) {
        ctx.lineTo(scaledPoints[i].x, scaledPoints[i].y);
      }
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.stroke();
    }

    // Draw knot points
    scaledPoints.forEach((point, index) => {
      const knot = point.originalKnot;
      const isStartOrEnd = knot.id.startsWith('start-knot') || knot.id.startsWith('end-knot');
      
      ctx.beginPath();
      ctx.arc(point.x, point.y, isStartOrEnd ? 8 : 6, 0, 2 * Math.PI);
      ctx.fillStyle = isStartOrEnd ? '#EF4444' : '#10B981';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.stroke();
    });

  }, [knots, knotPlacementOrder, trajectoryData, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="border border-gray-300 rounded-lg bg-white"
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  );
}

interface KnotAnnotation {
  x: number;
  y: number;
  id: string;
  order?: number; // Track the order in which knots were placed
}

interface TrajectoryWithKnots {
  trackId: number;
  data: TrajectoryData[];
  knots: KnotAnnotation[];
  selectedKnotCount: number;
}

export default function PlaceKnots() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [trajectories, setTrajectories] = useState<TrajectoryWithKnots[]>([]);
  const [currentTrajectoryIndex, setCurrentTrajectoryIndex] = useState(0);
  const [annotationMode, setAnnotationMode] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [knotPlacementOrder, setKnotPlacementOrder] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    // Generate a unique session ID when component mounts
    const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
    loadRandomTrajectories();
  }, []);

  const loadRandomTrajectories = async () => {
    setLoading(true);
    setError('');
    try {
      // Get 5 random track IDs
      const allTrackIds = await trajectoryAPI.getUniqueTrackIds();
      const shuffled = allTrackIds.sort(() => 0.5 - Math.random());
      const selectedTrackIds = shuffled.slice(0, 5);

      // Load trajectory data for each track
      const trajectoryPromises = selectedTrackIds.map(async (trackId) => {
        const data = await trajectoryAPI.getTrajectoryByTrackId(trackId);
        const sortedData = data.sort((a, b) => a.sceneId - b.sceneId);
        
        // Automatically place knots at start and end points
        const startPoint = sortedData[0];
        const endPoint = sortedData[sortedData.length - 1];
        const initialKnots: KnotAnnotation[] = [
          {
            x: startPoint.localX,
            y: startPoint.localY,
            id: `start-knot-${trackId}`,
            // No order assigned - will get final ranks
          },
          {
            x: endPoint.localX,
            y: endPoint.localY,
            id: `end-knot-${trackId}`,
            // No order assigned - will get final ranks
          }
        ];
        
        return {
          trackId,
          data: sortedData,
          knots: initialKnots,
          selectedKnotCount: 3 // Default to 3 additional knots (plus start and end = 5 total)
        };
      });

      const loadedTrajectories = await Promise.all(trajectoryPromises);
      setTrajectories(loadedTrajectories);
    } catch (err) {
      console.error('Failed to load random trajectories:', err);
      setError('Failed to load trajectories for annotation');
    } finally {
      setLoading(false);
    }
  };

  const startAnnotation = () => {
    setAnnotationMode(true);
    setCurrentTrajectoryIndex(0);
  };

  const handleKnotCountChange = (count: number) => {
    setTrajectories(prev => 
      prev.map((traj, index) => {
        if (index === currentTrajectoryIndex) {
          // Keep the start and end knots, remove only the middle knots
          const startKnot = traj.knots.find(knot => knot.id.startsWith('start-knot'));
          const endKnot = traj.knots.find(knot => knot.id.startsWith('end-knot'));
          const preservedKnots = [startKnot, endKnot].filter(knot => knot !== undefined) as KnotAnnotation[];
          
          // Reset knot placement order for this trajectory
          const newOrderMap = new Map(knotPlacementOrder);
          traj.knots.forEach(knot => {
            if (!knot.id.startsWith('start-knot') && !knot.id.startsWith('end-knot')) {
              newOrderMap.delete(knot.id);
            }
          });
          setKnotPlacementOrder(newOrderMap);
          
          return { 
            ...traj, 
            selectedKnotCount: count, 
            knots: preservedKnots 
          };
        }
        return traj;
      })
    );
  };

  const handleChartClick = (event: any) => {
    if (!annotationMode) return;
    
    const currentTrajectory = trajectories[currentTrajectoryIndex];
    // Calculate total allowed knots (selected count + 2 for start and end)
    const totalAllowedKnots = currentTrajectory.selectedKnotCount + 2;
    
    if (currentTrajectory.knots.length >= totalAllowedKnots) {
      alert(`You can only place ${currentTrajectory.selectedKnotCount} additional knots on this curve (plus start and end points).`);
      return;
    }

    if (event && event.activePayload && event.activePayload[0]) {
      const data = event.activePayload[0].payload;
      
      // Get the next rank for manual knots (starts from 0)
      const manualKnots = Array.from(knotPlacementOrder.entries()).filter(
        ([id, _]) => !id.startsWith('start-knot') && !id.startsWith('end-knot')
      );
      const nextRank = manualKnots.length; // 0, 1, 2, etc.
      
      const newKnot: KnotAnnotation = {
        x: data.localX,
        y: data.localY,
        id: `knot-${Date.now()}`,
        order: nextRank
      };

      // Update the knot placement order map
      setKnotPlacementOrder(prev => new Map(prev).set(newKnot.id, nextRank));

      setTrajectories(prev => 
        prev.map((traj, index) => 
          index === currentTrajectoryIndex 
            ? { ...traj, knots: [...traj.knots, newKnot] }
            : traj
        )
      );
    }
  };

  const removeKnot = (knotId: string) => {
    // Prevent removing start and end knots
    if (knotId.startsWith('start-knot') || knotId.startsWith('end-knot')) {
      alert('Cannot remove start or end knots. They are automatically placed.');
      return;
    }
    
    // Remove from order tracking
    setKnotPlacementOrder(prev => {
      const newMap = new Map(prev);
      newMap.delete(knotId);
      
      // Re-rank remaining manual knots to maintain sequential order (0, 1, 2, etc.)
      const remainingManualKnots = Array.from(newMap.entries()).filter(
        ([id, _]) => !id.startsWith('start-knot') && !id.startsWith('end-knot')
      );
      
      // Sort by current rank and reassign sequential ranks starting from 0
      remainingManualKnots
        .sort(([, rankA], [, rankB]) => rankA - rankB)
        .forEach(([id, _], index) => {
          newMap.set(id, index);
        });
      
      return newMap;
    });
    
    setTrajectories(prev => 
      prev.map((traj, index) => 
        index === currentTrajectoryIndex 
          ? { ...traj, knots: traj.knots.filter(knot => knot.id !== knotId) }
          : traj
      )
    );
  };

  const removeLastKnot = () => {
    setTrajectories(prev => 
      prev.map((traj, index) => {
        if (index === currentTrajectoryIndex) {
          // Find the last knot that is not a start or end knot
          const knotsToRemove = traj.knots.filter(knot => 
            !knot.id.startsWith('start-knot') && !knot.id.startsWith('end-knot')
          );
          
          if (knotsToRemove.length === 0) {
            return traj; // No removable knots
          }
          
          // Remove the last manually placed knot
          const lastRemovableKnot = knotsToRemove[knotsToRemove.length - 1];
          
          // Remove from order tracking and re-rank remaining manual knots
          setKnotPlacementOrder(prev => {
            const newMap = new Map(prev);
            newMap.delete(lastRemovableKnot.id);
            
            // Re-rank remaining manual knots to maintain sequential order (0, 1, 2, etc.)
            const remainingManualKnots = Array.from(newMap.entries()).filter(
              ([id, _]) => !id.startsWith('start-knot') && !id.startsWith('end-knot')
            );
            
            // Sort by current rank and reassign sequential ranks starting from 0
            remainingManualKnots
              .sort(([, rankA], [, rankB]) => rankA - rankB)
              .forEach(([id, _], index) => {
                newMap.set(id, index);
              });
            
            return newMap;
          });
          
          return { 
            ...traj, 
            knots: traj.knots.filter(knot => knot.id !== lastRemovableKnot.id) 
          };
        }
        return traj;
      })
    );
  };

  const nextTrajectory = () => {
    if (currentTrajectoryIndex < trajectories.length - 1) {
      setCurrentTrajectoryIndex(prev => prev + 1);
    }
  };

  const previousTrajectory = () => {
    if (currentTrajectoryIndex > 0) {
      setCurrentTrajectoryIndex(prev => prev - 1);
    }
  };

  const finishAnnotation = async () => {
    // Check if all trajectories have the required number of knots (selected + 2 for start/end)
    const allComplete = trajectories.every(traj => 
      traj.knots.length === traj.selectedKnotCount + 2
    );
    
    if (!allComplete) {
      alert('Please complete annotation for all trajectories before finishing.');
      return;
    }
    
    try {
      setLoading(true);
      
      // Collect and package knot placement data for all trajectories
      const annotationData = collectKnotPlacementData();
      
      console.log('Submitting annotation data:', annotationData);
      
      // Submit all annotation data as a single JSON payload to backend API
      const result = await trajectoryAPI.submitAnnotations(annotationData);
      
      console.log('Annotation submission successful:', result);
      
      // Show success message and redirect to home
      alert('Annotation completed successfully! You will now be redirected to the home page.');
      
      // Reset state and redirect to home page
      setAnnotationMode(false);
      router.push('/');
      
    } catch (error) {
      console.error('Failed to submit annotations:', error);
      alert('Failed to submit annotations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Collects and packages user's knot placement data for all trajectories
   * Records trackId, totalKnots, coordinates, and relativeOrder for each knot
   */
  const collectKnotPlacementData = (): AnnotationSubmission => {
    const trajectoryAnnotations: TrajectoryAnnotation[] = trajectories.map(trajectory => {
      // Separate manual knots and start/end knots
      const manualKnots = trajectory.knots.filter(knot => 
        !knot.id.startsWith('start-knot') && !knot.id.startsWith('end-knot')
      );
      const startKnot = trajectory.knots.find(knot => knot.id.startsWith('start-knot'));
      const endKnot = trajectory.knots.find(knot => knot.id.startsWith('end-knot'));
      
      // Sort manual knots by their rank (0, 1, 2, etc.)
      const sortedManualKnots = manualKnots
        .map(knot => ({
          ...knot,
          order: knotPlacementOrder.get(knot.id) || 0
        }))
        .sort((a, b) => a.order - b.order);
      
      // Create final knot list: manual knots first, then start and end knots
      const finalKnots = [
        ...sortedManualKnots,
        ...(startKnot ? [startKnot] : []),
        ...(endKnot ? [endKnot] : [])
      ];

      // Convert to the format expected by backend API
      const knotData: KnotData[] = finalKnots.map((knot, index) => ({
        x: knot.x,
        y: knot.y,
        relativeOrder: index + 1 // 1-based ordering for backend
      }));

      return {
        trackId: trajectory.trackId,
        totalKnots: trajectory.knots.length, // Total knots including start and end
        knots: knotData
      };
    });

    return {
      sessionId: sessionId,
      trajectories: trajectoryAnnotations
    };
  };

  const isCurrentTrajectoryComplete = () => {
    return currentTrajectory && currentTrajectory.knots.length === currentTrajectory.selectedKnotCount + 2;
  };

  const areAllTrajectoriesComplete = () => {
    return trajectories.every(traj => traj.knots.length === traj.selectedKnotCount + 2);
  };

  const currentTrajectory = trajectories[currentTrajectoryIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Place Knots - Annotation Tool</h1>
          <p className="text-gray-600">Annotate trajectory curves by placing knots at important points</p>
        </header>

        {/* Back button */}
        <div className="mb-6">
          <Link href="/">
            <button className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors">
              ← Back to Home
            </button>
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading random trajectories for annotation...</p>
          </div>
        ) : trajectories.length > 0 ? (
          <div className="space-y-6">
            {/* Instructions */}
            {!annotationMode ? (                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Instructions</h2>
                  <div className="space-y-3 text-gray-600">
                    <p>• You will be shown 5 random trajectory curves</p>
                    <p>• For each curve, select the number of additional knots to place (3, 4, or 5)</p>
                    <p>• Start and end points are automatically placed as fixed knots</p>
                    <p>• Click on the curve to place your additional knots at points so that the placed points match the original trajectories</p>
                    <p>• <span className="text-purple-600 font-medium">A visualization will show your knot drawing in real-time</span></p>
                    <p>• Use the "Remove Last Knot" button to undo placements</p>
                    <p>• You must complete all curves to proceed</p>
                  </div>
                <div className="mt-6">
                  <button
                    onClick={startAnnotation}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Start Annotation
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Progress indicator */}
                <div className="bg-white rounded-lg shadow-md p-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-800">
                      Trajectory {currentTrajectoryIndex + 1} of {trajectories.length}
                      <span className="text-blue-600 ml-2">(Track ID: {currentTrajectory?.trackId})</span>
                    </h2>
                    <div className="flex space-x-2">
                      {trajectories.map((_, index) => (
                        <div
                          key={index}
                          className={`w-3 h-3 rounded-full ${
                            index === currentTrajectoryIndex
                              ? 'bg-blue-500'
                              : index < currentTrajectoryIndex
                              ? 'bg-green-500'
                              : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Knot count selection */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Number of Additional Knots</h3>
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-4">
                      {[3, 4, 5].map(count => (
                        <button
                          key={count}
                          onClick={() => handleKnotCountChange(count)}
                          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                            currentTrajectory?.selectedKnotCount === count
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                          }`}
                        >
                          {count} Additional Knots
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={removeLastKnot}
                      disabled={!currentTrajectory?.knots.length}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                        currentTrajectory?.knots.length
                          ? 'bg-red-500 hover:bg-red-600 text-white'
                          : 'bg-gray-300 cursor-not-allowed text-gray-500'
                      }`}
                    >
                      Remove Last Knot
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Additional knots placed: {Math.max(0, (currentTrajectory?.knots.length || 0) - 2)} / {currentTrajectory?.selectedKnotCount || 3}
                    <br />
                    Total knots: {currentTrajectory?.knots.length || 0} (including start and end points)
                  </p>
                </div>

                {/* Trajectory chart */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Click on the curve to place additional knots
                  </h3>
                  {currentTrajectory && (
                    <div className="h-96 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={currentTrajectory.data}
                          margin={{ top: 20, right: 30, bottom: 80, left: 80 }}
                          onClick={handleChartClick}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            type="number"
                            dataKey="localX"
                            domain={['dataMin - 0.5', 'dataMax + 0.5']}
                            tickFormatter={(value) => value.toFixed(2)}
                            label={{ value: 'Local X', position: 'insideBottomLeft', offset: -15 }}
                          />
                          <YAxis 
                            type="number"
                            dataKey="localY"
                            domain={['dataMin - 0.5', 'dataMax + 0.5']}
                            tickFormatter={(value) => value.toFixed(2)}
                            label={{ value: 'Local Y', angle: -90, position: 'insideLeft' }}
                          />
                          <Tooltip 
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
                                    <p className="font-semibold">Scene ID: {data.sceneId}</p>
                                    <p className="text-blue-600">X: {Number(data.localX).toFixed(4)}</p>
                                    <p className="text-red-600">Y: {Number(data.localY).toFixed(4)}</p>
                                    <p className="text-green-600 text-sm">Click to place knot</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Line 
                            type="linear"
                            dataKey="localY"
                            stroke="#DC2626"
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 6, fill: '#3B82F6' }}
                            name="Trajectory Path"
                          />
                          {/* Render knots as dots */}
                          {currentTrajectory.knots.map((knot, index) => {
                            const isStartOrEnd = knot.id.startsWith('start-knot') || knot.id.startsWith('end-knot');
                            return (
                              <ReferenceDot
                                key={knot.id}
                                x={knot.x}
                                y={knot.y}
                                r={isStartOrEnd ? 10 : 8}
                                fill={isStartOrEnd ? "#EF4444" : "#10B981"}
                                stroke="#ffffff"
                                strokeWidth={2}
                              />
                            );
                          })}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Knot Drawing Visualization */}
                {currentTrajectory && currentTrajectory.knots.length > 0 && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Your Knot Drawing
                    </h3>
                    <div className="flex flex-col items-center space-y-4">
                      <KnotVisualization 
                        knots={currentTrajectory.knots}
                        knotPlacementOrder={knotPlacementOrder}
                        trajectoryData={currentTrajectory.data}
                        width={500}
                        height={350}
                      />
                      <div className="text-sm text-gray-600 text-center">
                        <p>
                          <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                          Start/End Points
                          <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2 ml-4"></span>
                          Placed Knots
                          <span className="inline-block w-4 h-0.5 bg-blue-500 mr-2 ml-4"></span>
                          Connection Line
                        </p>
                        <p className="mt-2">This shows the sequence of knots you've placed, connected in order.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Knots list */}
                {currentTrajectory?.knots.length > 0 && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-blue-600 mb-4">Placed Knots</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {currentTrajectory.knots.map((knot, index) => {
                        const isStartKnot = knot.id.startsWith('start-knot');
                        const isEndKnot = knot.id.startsWith('end-knot');
                        const isStartOrEnd = isStartKnot || isEndKnot;
                        
                        // Calculate the manual knot number (excluding start and end)
                        const manualKnotIndex = currentTrajectory.knots
                          .filter(k => !k.id.startsWith('start-knot') && !k.id.startsWith('end-knot'))
                          .findIndex(k => k.id === knot.id) + 1;
                        
                        return (
                          <div key={knot.id} className={`p-3 rounded-lg ${isStartOrEnd ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-semibold text-blue-600">
                                  {isStartKnot ? 'Start Point' : isEndKnot ? 'End Point' : `Additional Knot ${manualKnotIndex}`}
                                  {isStartOrEnd && <span className="text-blue-500 text-xs ml-1">(Fixed)</span>}
                                </p>
                                <p className="text-sm text-blue-500">
                                  X: {knot.x.toFixed(4)}, Y: {knot.y.toFixed(4)}
                                </p>
                              </div>
                              {!isStartOrEnd && (
                                <button
                                  onClick={() => removeKnot(knot.id)}
                                  className="text-blue-500 hover:text-blue-700 text-sm"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Navigation buttons */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-center">
                    <button
                      onClick={previousTrajectory}
                      disabled={currentTrajectoryIndex === 0}
                      className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded transition-colors"
                    >
                      ← Previous
                    </button>
                    
                    <div className="text-center">
                      <p className="text-sm text-gray-600">
                        {isCurrentTrajectoryComplete() 
                          ? 'Trajectory complete! You can proceed.' 
                          : `Place ${(currentTrajectory?.selectedKnotCount + 2) - (currentTrajectory?.knots.length || 0)} more knot(s) to complete this trajectory.`
                        }
                      </p>
                    </div>

                    {currentTrajectoryIndex === trajectories.length - 1 ? (
                      <button
                        onClick={finishAnnotation}
                        disabled={!areAllTrajectoriesComplete() || loading}
                        className={`px-6 py-2 rounded transition-colors font-semibold ${
                          areAllTrajectoriesComplete() && !loading
                            ? 'bg-green-500 hover:bg-green-600 text-white'
                            : 'bg-gray-300 cursor-not-allowed text-gray-500'
                        }`}
                      >
                        {loading 
                          ? 'Submitting...' 
                          : areAllTrajectoriesComplete() 
                            ? 'Submit Annotations' 
                            : 'Complete All Trajectories'
                        }
                      </button>
                    ) : (
                      <button
                        onClick={nextTrajectory}
                        disabled={!isCurrentTrajectoryComplete() || currentTrajectoryIndex === trajectories.length - 1}
                        className={`px-4 py-2 rounded transition-colors ${
                          isCurrentTrajectoryComplete()
                            ? 'bg-blue-500 hover:bg-blue-600 text-white'
                            : 'bg-gray-300 cursor-not-allowed text-gray-500'
                        }`}
                      >
                        {isCurrentTrajectoryComplete() ? 'Next →' : 'Complete Current Trajectory'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500">No trajectories loaded. Click the button above to load random trajectories.</p>
            <button
              onClick={loadRandomTrajectories}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
            >
              Load Random Trajectories
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
