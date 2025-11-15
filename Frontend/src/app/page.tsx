'use client';

import { useState, useEffect } from 'react';
import { trajectoryAPI } from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowRight,
  CheckCircle,
  Lightbulb,
  Target,
  Zap,
  BarChart3,
  Users,
  Play,
  AlertTriangle,
  Sparkles
} from 'lucide-react';

export default function Home() {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  useEffect(() => {
    checkBackendConnection();
  }, []);

  const checkBackendConnection = async () => {
    try {
      await trajectoryAPI.checkHealth();
      setConnectionStatus('connected');
    } catch (err) {
      console.error('Backend connection failed:', err);
      setConnectionStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b bg-white/50 backdrop-blur-sm">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Status Badge */}
          <div className="flex justify-center mb-6">
            <Badge
              variant={connectionStatus === 'connected' ? 'default' : connectionStatus === 'error' ? 'destructive' : 'secondary'}
              className="animate-fade-in"
            >
              {connectionStatus === 'checking' && '⏳ Connecting to System...'}
              {connectionStatus === 'connected' && '✓ System Online'}
              {connectionStatus === 'error' && '⚠ Connection Issue'}
            </Badge>
          </div>

          {/* Hero Content */}
          <div className="text-center space-y-6 animate-fade-in">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">
                Trajectory Annotation
              </span>
              <br />
              <span className="text-gray-900">Research Platform</span>
            </h1>

            <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Advanced platform for pedestrian trajectory analysis and human annotation research
            </p>

            {connectionStatus === 'connected' && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
                <Link href="/placeknots">
                  <Button size="lg" className="text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <Play className="mr-2 h-5 w-5" />
                    Start Annotation
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/sys2025">
                  <Button variant="outline" size="lg" className="text-lg px-8 py-6 rounded-full">
                    View Dashboard
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Research Purpose Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Research Purpose
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Understanding the challenge, our approach, and the potential impact
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* The Challenge */}
          <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-red-400 to-orange-500 flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-xl">The Challenge</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base leading-relaxed">
                Autonomous vehicle safety relies on testing against a wide range of pedestrian behaviors, from common crossing patterns to rare and unpredictable movements. Current simulation models and clustering methods often fall short because they miss subtle but important variations and lack a universally accepted benchmark for evaluating trajectory quality.
              </CardDescription>
            </CardContent>
          </Card>

          {/* Our Solution */}
          <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center mb-4">
                <Lightbulb className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-xl">Our Solution</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base leading-relaxed">
                Our research work addresses this gap by gathering human annotations on pedestrian trajectories, allowing us to understand how people naturally perceive and group different movement patterns. These insights will help us group trajectories into meaningful patterns that capture both typical and unusual behaviors.
              </CardDescription>
            </CardContent>
          </Card>

          {/* The Impact */}
          <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-xl">The Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base leading-relaxed">
                By using human judgment alongside data-driven methods, we can make simulations more realistic and better prepared for real-world situations, ultimately improving autonomous vehicle safety and reliability.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Platform Overview */}
      <div className="bg-white/50 backdrop-blur-sm py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Platform Overview
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Intuitive tools for precise trajectory annotation and analysis
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Video/GIF Section */}
            <Card className="border-none shadow-xl overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <img
                    src="/gifs/output.gif"
                    alt="Platform Overview"
                    className="object-contain w-full h-full"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Key Features */}
            <div className="space-y-4">
              <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <CardTitle className="text-lg">Real-time Annotation</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Annotate pedestrian trajectories with precision using our intuitive tools
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                    </div>
                    <CardTitle className="text-lg">Pattern Analysis</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Compare and analyze trajectory patterns across different scenarios
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Target className="h-5 w-5 text-purple-600" />
                    </div>
                    <CardTitle className="text-lg">Knot Placement</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Place strategic knots to mark significant trajectory points
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      {connectionStatus === 'connected' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 border-none shadow-2xl overflow-hidden">
            <CardContent className="py-16 px-8 text-center relative">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />

              <div className="relative z-10">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  Ready to Contribute?
                </h2>
                <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                  Join our research and help advance autonomous vehicle safety through trajectory annotation
                </p>
                <Link href="/placeknots">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    Begin Annotation Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Connection Error */}
      {connectionStatus === 'error' && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card className="border-destructive shadow-xl">
            <CardHeader>
              <CardTitle className="text-destructive">Backend Connection Required</CardTitle>
              <CardDescription>Unable to connect to the annotation server</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground space-y-2">
                <p>To use this platform, ensure the backend server is running:</p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Navigate to the Backend directory</li>
                  <li>Run: <code className="bg-muted px-2 py-1 rounded">./mvnw spring-boot:run</code></li>
                  <li>Wait for the server to start on port 8080</li>
                </ol>
              </div>
              <Button onClick={checkBackendConnection} className="w-full">
                Retry Connection
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Collaboration Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="border-none shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl">Collaboration</CardTitle>
            </div>
            <CardDescription className="text-base">
              This project is a joint collaboration between Bangladesh University of Engineering and Technology (BUET),
              California Polytechnic State University (Cal Poly), and the University of California, Santa Cruz (UCSC)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Separator className="my-4" />
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-gray-700">
                  <strong>Dr. Golam Md Muktadir, PHD</strong>, University of California, Santa Cruz
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-gray-700">
                  <strong>Dr. A. B. M. Alim Al Islam, Professor</strong>, Bangladesh University of Engineering and Technology (BUET)
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-gray-700">
                  <strong>Dr. Fahim Khan, Assistant Professor</strong>, Computer Science and Software Engineering, California Polytechnic State University
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2024 Trajectory Annotation Research Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
