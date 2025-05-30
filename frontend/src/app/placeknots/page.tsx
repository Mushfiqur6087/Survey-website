'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { trajectoryAPI, TrajectoryData } from '@/lib/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';

interface KnotAnnotation {
  x: number;
  y: number;
  id: string;
}

interface TrajectoryWithKnots {
  trackId: number;
  data: TrajectoryData[];
  knots: KnotAnnotation[];
  selectedKnotCount: number;
}

export default function PlaceKnots() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [trajectories, setTrajectories] = useState<TrajectoryWithKnots[]>([]);
  const [currentTrajectoryIndex, setCurrentTrajectoryIndex] = useState(0);
  const [annotationMode, setAnnotationMode] = useState(false);

  useEffect(() => {
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
        return {
          trackId,
          data: sortedData,
          knots: [],
          selectedKnotCount: 3 // Default to 3 knots
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
      prev.map((traj, index) => 
        index === currentTrajectoryIndex 
          ? { ...traj, selectedKnotCount: count, knots: [] } // Reset knots when count changes
          : traj
      )
    );
  };

  const handleChartClick = (event: any) => {
    if (!annotationMode) return;
    
    const currentTrajectory = trajectories[currentTrajectoryIndex];
    if (currentTrajectory.knots.length >= currentTrajectory.selectedKnotCount) {
      alert(`You can only place ${currentTrajectory.selectedKnotCount} knots on this curve.`);
      return;
    }

    if (event && event.activePayload && event.activePayload[0]) {
      const data = event.activePayload[0].payload;
      const newKnot: KnotAnnotation = {
        x: data.localX,
        y: data.localY,
        id: `knot-${Date.now()}`
      };

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
      prev.map((traj, index) => 
        index === currentTrajectoryIndex 
          ? { ...traj, knots: traj.knots.slice(0, -1) }
          : traj
      )
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

  const finishAnnotation = () => {
    // Check if all trajectories have the required number of knots
    const allComplete = trajectories.every(traj => 
      traj.knots.length === traj.selectedKnotCount
    );
    
    if (!allComplete) {
      alert('Please complete annotation for all trajectories before finishing.');
      return;
    }
    
    // Here you would typically save the annotations to the backend
    console.log('Annotations completed:', trajectories);
    alert('Annotation completed! Check console for results.');
    setAnnotationMode(false);
  };

  const isCurrentTrajectoryComplete = () => {
    return currentTrajectory && currentTrajectory.knots.length === currentTrajectory.selectedKnotCount;
  };

  const areAllTrajectoriesComplete = () => {
    return trajectories.every(traj => traj.knots.length === traj.selectedKnotCount);
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
            {!annotationMode ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Instructions</h2>
                <div className="space-y-3 text-gray-600">
                  <p>• You will be shown 5 random trajectory curves</p>
                  <p>• For each curve, select the number of knots (3, 4, or 5)</p>
                  <p>• Click on the curve to place knots at important points</p>
                  <p>• Use the "Remove Last Knot" button to undo placements</p>
                  <p>• You must select fixed knots for all curves to proceed</p>
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
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Number of Knots</h3>
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
                          {count} Knots
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
                    Knots placed: {currentTrajectory?.knots.length || 0} / {currentTrajectory?.selectedKnotCount || 3}
                  </p>
                </div>

                {/* Trajectory chart */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Click on the curve to place knots
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
                          {currentTrajectory.knots.map((knot, index) => (
                            <ReferenceDot
                              key={knot.id}
                              x={knot.x}
                              y={knot.y}
                              r={8}
                              fill="#10B981"
                              stroke="#ffffff"
                              strokeWidth={2}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Knots list */}
                {currentTrajectory?.knots.length > 0 && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Placed Knots</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {currentTrajectory.knots.map((knot, index) => (
                        <div key={knot.id} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-semibold">Knot {index + 1}</p>
                              <p className="text-sm text-gray-600">
                                X: {knot.x.toFixed(4)}, Y: {knot.y.toFixed(4)}
                              </p>
                            </div>
                            <button
                              onClick={() => removeKnot(knot.id)}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
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
                          : `Place ${currentTrajectory?.selectedKnotCount - (currentTrajectory?.knots.length || 0)} more knot(s) to complete this trajectory.`
                        }
                      </p>
                    </div>

                    {currentTrajectoryIndex === trajectories.length - 1 ? (
                      <button
                        onClick={finishAnnotation}
                        disabled={!areAllTrajectoriesComplete()}
                        className={`px-6 py-2 rounded transition-colors font-semibold ${
                          areAllTrajectoriesComplete()
                            ? 'bg-green-500 hover:bg-green-600 text-white'
                            : 'bg-gray-300 cursor-not-allowed text-gray-500'
                        }`}
                      >
                        {areAllTrajectoriesComplete() ? 'Finish Annotation' : 'Complete All Trajectories'}
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
