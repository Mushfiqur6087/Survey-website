'use client';

import { useState, useEffect } from 'react';
import { trajectoryAPI } from '@/lib/api';
import Link from 'next/link';

export default function Home() {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [healthMessage, setHealthMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Check backend connection on component mount
  useEffect(() => {
    checkBackendConnection();
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
      <div className="max-w-6xl mx-auto relative">
        

        {/* Header */}
        <header className="text-center mb-4 relative">
          <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-2xl shadow-2xl p-8 pb-3 overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-white/10 to-transparent rounded-full transform -translate-x-20 -translate-y-20"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-white/10 to-transparent rounded-full transform translate-x-16 translate-y-16"></div>
            
            <div className="relative z-10">
              <h1 className="text-5xl font-bold text-white mb-6 drop-shadow-lg">
                <span className="bg-gradient-to-r from-yellow-200 to-white bg-clip-text text-transparent">
                  Trajectory Annotation Website
                </span>
              </h1>
              <p className="text-blue-100 text-lg mb-4 max-w-3xl mx-auto">
                Advanced platform for pedestrian trajectory analysis and human annotation research
              </p>
              {/* <ConnectionStatusBadge /> */}
              {/* {healthMessage && (
                <div className="mt-4 bg-green-500/20 backdrop-blur-sm border border-green-400/30 rounded-lg p-3 inline-block">
                  <p className="text-green-100 font-medium">{healthMessage}</p>
                </div>
              )} */}
            </div>
          </div>
        </header>

        {/* Research Purpose Section */}
        <div className="relative bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 rounded-2xl shadow-xl p-6 mb-8 overflow-hidden">
          {/* Background decoration */}
          {/* <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full opacity-20 transform translate-x-16 -translate-y-16"></div> */}
          {/* <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-200 to-blue-200 rounded-full opacity-20 transform -translate-x-12 translate-y-12"></div> */}
          
          <div className="relative z-10">
            <div className="flex items-center mb-4">
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

        {/* Main Content - Overview Video/GIF Section */}
          <div className="mb-8">
            <div className="relative bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl shadow-xl p-8 overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center mb-6">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full p-3 mr-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Platform Overview
                  </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                  {/* Video/GIF Section */}
                  <div className="relative lg:col-span-2">
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/30 shadow-lg">
                      <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                        <img
                          src="/gifs/output.gif"
                          alt="Platform Overview"
                          className="object-contain w-full h-full rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Key Features */}
                  <div className="space-y-4">
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="bg-green-500 rounded-full p-1">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <h3 className="font-semibold text-gray-800">Real-time Annotation</h3>
                      </div>
                      <p className="text-sm text-gray-600">Annotate pedestrian trajectories with precision using our intuitive tools</p>
                    </div>

                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="bg-blue-500 rounded-full p-1">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <h3 className="font-semibold text-gray-800">Pattern Analysis</h3>
                      </div>
                      <p className="text-sm text-gray-600">Compare and analyze trajectory patterns across different scenarios</p>
                    </div>

                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="bg-purple-500 rounded-full p-1">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                          </svg>
                        </div>
                        <h3 className="font-semibold text-gray-800">Knot Placement</h3>
                      </div>
                      <p className="text-sm text-gray-600">Place strategic knots to mark significant trajectory points</p>
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

        {/* Floating Dashed Arrow Infographic */}
        {connectionStatus === 'connected' && (
        <div className="absolute right-4 z-50 scale-150">
          <div className="relative">
            {/* Dashed Arrow */}
            <svg
              width="120"
              height="80"
              viewBox="0 0 120 80"
              className="drop-shadow-lg"
            >
              {/* Dashed line path - mirrored from right to left */}
              <path
                d="M 120 5 Q 50 10 10 70"
                stroke="#3B82F6"
                strokeWidth="3"
                strokeDasharray="8,4"
                fill="none"
                className="animate-pulse"
              />
              {/* Arrow head - positioned at the left end */}
              <polygon
                points="1,65 25,85 1,80"
                fill="#3B82F6"
                className="animate-pulse"
              />
            </svg>

            {/* Click Here Badge */}
            <div className="absolute -top-6 -right-20 rotate-30 bg-white/90 backdrop-blur-sm text-blue-600 px-3 py-1 rounded-full text-sm font-bold shadow-lg border-2 border-blue-200 animate-pulse">
              CLICK HERE!
            </div>
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link href="/knot-comparison">
                  <div className="group relative bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl p-6 text-center hover:from-orange-500 hover:to-orange-700 transition-all duration-300 transform hover:scale-105 hover:shadow-xl cursor-pointer">
                    {/* Tooltip */}
                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xl rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-10">
                      coming soon
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-800"></div>
                    </div>

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
      </div>
    </div>
  );
}
