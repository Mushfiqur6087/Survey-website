"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  trajectoryAPI,
  TrajectoryData,
  AnnotationSubmission,
  TrajectoryAnnotation,
  KnotData,
} from "@/lib/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";
import SubmissionPasswordModal from "@/components/SubmissionPasswordModal";
import Image from "next/image";

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
 * Optimized for performance with memoization and efficient rendering
 */
function KnotVisualization({
  knots,
  knotPlacementOrder,
  trajectoryData,
  width = 800,
  height = 384,
}: KnotVisualizationProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const animationFrameRef = React.useRef<number | null>(null);

  // Memoize expensive calculations
  const { scaledPoints, trajectoryScaledPoints, bounds } = useMemo(() => {
    if (knots.length === 0) {
      return { scaledPoints: [], trajectoryScaledPoints: [], bounds: null };
    }

    // Calculate bounds for scaling - match main chart domain exactly
    const trajectoryXValues = trajectoryData.map((point) => point.localX);
    const trajectoryYValues = trajectoryData.map((point) => point.localY);

    const dataMinX = Math.min(...trajectoryXValues);
    const dataMaxX = Math.max(...trajectoryXValues);
    const dataMinY = Math.min(...trajectoryYValues);
    const dataMaxY = Math.max(...trajectoryYValues);

    const minX = dataMinX - 0.5;
    const maxX = dataMaxX + 0.5;
    const minY = dataMinY - 0.5;
    const maxY = dataMaxY + 0.5;

    // Scale margins proportionally for smaller canvases
    const isSmallCanvas = width < 400 || height < 200;
    const marginScale = isSmallCanvas ? 0.15 : 1;

    const marginTop = 20 * marginScale;
    const marginRight = 30 * marginScale;
    const marginBottom = 80 * marginScale;
    const marginLeft = 80 * marginScale;

    const drawWidth = width - marginLeft - marginRight;
    const drawHeight = height - marginTop - marginBottom;

    const xRange = maxX - minX || 1;
    const yRange = maxY - minY || 1;

    const scaleX = (drawWidth / xRange) * 1.09;
    const scaleY = (drawHeight / yRange) * 0.91;

    const bounds = {
      minX,
      maxX,
      minY,
      maxY,
      scaleX,
      scaleY,
      marginLeft,
      marginTop,
    };

    // Pre-calculate trajectory distances for efficient ordering
    const trajectoryDistances = new Map<string, number>();
    knots.forEach((knot) => {
      let minDistance = Infinity;
      let closestIndex = 0;

      trajectoryData.forEach((point, index) => {
        const distance = Math.sqrt(
          Math.pow(point.localX - knot.x, 2) +
            Math.pow(point.localY - knot.y, 2),
        );
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = index;
        }
      });

      trajectoryDistances.set(knot.id, closestIndex);
    });

    // Sort knots by their position along the trajectory (optimized)
    const sortedKnots = [...knots].sort((knotA, knotB) => {
      const indexA = trajectoryDistances.get(knotA.id) || 0;
      const indexB = trajectoryDistances.get(knotB.id) || 0;
      return indexA - indexB;
    });

    // NEW APPROACH: Follow trajectory path order, not spatial proximity
    const createTrajectoryFollowingPath = (
      knots: KnotAnnotation[],
    ): KnotAnnotation[] => {
      if (knots.length <= 1) return knots;

      // Find each knot's closest position index along the trajectory
      const knotsWithTrajectoryIndex = knots.map((knot) => {
        let minDistance = Infinity;
        let closestIndex = 0;

        trajectoryData.forEach((point, index) => {
          const distance = Math.sqrt(
            Math.pow(point.localX - knot.x, 2) +
              Math.pow(point.localY - knot.y, 2),
          );
          if (distance < minDistance) {
            minDistance = distance;
            closestIndex = index;
          }
        });

        return { knot, trajectoryIndex: closestIndex };
      });

      // Sort knots by their trajectory index (following the original path)
      const trajectoryOrderedKnots = knotsWithTrajectoryIndex
        .sort((a, b) => a.trajectoryIndex - b.trajectoryIndex)
        .map((item) => item.knot);

      return trajectoryOrderedKnots;
    };

    const trajectoryOrderedKnots = createTrajectoryFollowingPath(sortedKnots);

    const scaledPoints = sortedKnots.map((knot) => ({
      x: marginLeft + (knot.x - minX) * scaleX,
      y: marginTop + (maxY - knot.y) * scaleY,
      originalKnot: knot,
    }));

    const trajectoryScaledPoints = trajectoryOrderedKnots.map((knot) => ({
      x: marginLeft + (knot.x - minX) * scaleX,
      y: marginTop + (maxY - knot.y) * scaleY,
      originalKnot: knot,
    }));

    return { scaledPoints, trajectoryScaledPoints, bounds };
  }, [knots, trajectoryData, width, height]);

  // Optimized canvas drawing with requestAnimationFrame
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || scaledPoints.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas efficiently
    ctx.clearRect(0, 0, width, height);

    // Scale visual elements for smaller canvases
    const isSmallCanvas = width < 400 || height < 200;
    const visualScale = isSmallCanvas ? 0.4 : 1;

    // Draw connecting lines following trajectory path order
    if (trajectoryScaledPoints.length > 1) {
      ctx.beginPath();
      ctx.moveTo(trajectoryScaledPoints[0].x, trajectoryScaledPoints[0].y);
      for (let i = 1; i < trajectoryScaledPoints.length; i++) {
        ctx.lineTo(trajectoryScaledPoints[i].x, trajectoryScaledPoints[i].y);
      }
      ctx.strokeStyle = "#3B82F6"; // Blue connecting lines
      ctx.lineWidth = 3 * visualScale;
      ctx.setLineDash([]);
      ctx.stroke();
    }

    // Draw knot points with trajectory order indicators
    scaledPoints.forEach((point, index) => {
      const knot = point.originalKnot;
      const isStartOrEnd =
        knot.id.startsWith("start-knot") || knot.id.startsWith("end-knot");

      // Draw knot circle
      ctx.beginPath();
      ctx.arc(point.x, point.y, isStartOrEnd ? 8 * visualScale : 6 * visualScale, 0, 2 * Math.PI);
      ctx.fillStyle = isStartOrEnd ? "#EF4444" : "#10B981"; // Red for start/end, Green for manual
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2 * visualScale;
      ctx.setLineDash([]);
      ctx.stroke();

      // Add small number to show trajectory order (optional) - skip for small canvas
      if (!isSmallCanvas && !isStartOrEnd && trajectoryScaledPoints.length > 2) {
        const trajectoryIndex = trajectoryScaledPoints.findIndex(
          (tp) => tp.originalKnot.id === knot.id,
        );
        if (trajectoryIndex >= 0) {
          ctx.fillStyle = "#ffffff";
          ctx.font = "10px Arial";
          ctx.textAlign = "center";
          ctx.fillText((trajectoryIndex + 1).toString(), point.x, point.y + 3);
        }
      }
    });
  }, [scaledPoints, trajectoryScaledPoints, width, height]);

  // Use requestAnimationFrame for smooth updates
  React.useEffect(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(drawCanvas);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [drawCanvas]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="border border-gray-300 rounded-lg bg-white"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        display: 'block',
      }}
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
  const [error, setError] = useState<string>("");
  const [trajectories, setTrajectories] = useState<TrajectoryWithKnots[]>([]);
  const [currentTrajectoryIndex, setCurrentTrajectoryIndex] = useState(0);
  const [annotationMode, setAnnotationMode] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [knotPlacementOrder, setKnotPlacementOrder] = useState<
    Map<string, number>
  >(new Map());
  const previewSectionRef = useRef<HTMLDivElement>(null);

  // Password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingAnnotationData, setPendingAnnotationData] =
    useState<AnnotationSubmission | null>(null);
  const [passwordError, setPasswordError] = useState<string>("");
  const [isValidatingPassword, setIsValidatingPassword] = useState(false);

  // Tutorial modal state
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentTutorialStep, setCurrentTutorialStep] = useState(0);

  // Tutorial steps data
  const tutorialSteps = [
    {
      title: "Welcome to the Trajectory Annotation Tool",
      content: (
        <div className="space-y-4">
          <p className="text-lg text-gray-800">
            This tool helps researchers understand how humans perceive and
            simplify complex movement patterns.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">
              What you'll be doing:
            </h4>
            <p className="text-blue-700">
              You'll analyze 10 trajectory curves and place strategic points
              (called "knots") to capture their essential shape and
              characteristics.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Understanding Knots and Splines",
      content: (
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">
              🔗 What are Knots?
            </h4>
            <p className="text-green-700">
              Knots are strategic points placed on a curve that capture its most
              important features - like sharp turns, peaks, valleys, or
              direction changes.
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-semibold text-purple-800 mb-2">
              📈 What are Splines?
            </h4>
            <p className="text-purple-700">
              A spline is a smooth curve that connects multiple points. In our
              case, we use straight line segments to connect your knots,
              creating a simplified version of the original trajectory.
            </p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <h4 className="font-semibold text-orange-800 mb-2">🎯 The Goal</h4>
            <p className="text-orange-700">
              Place knots so that when connected by straight lines, they create
              a simplified path that still captures the essential shape and
              movement pattern of the original trajectory.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "How to Place Knots",
      content: (
        <div className="space-y-6">
          <h4 className="font-semibold mb-3 text-gray-800">
            Step-by-step process:
          </h4>

          {/* Step 1: Knot Count Selection */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start space-x-3 mb-3">
              <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                1
              </span>
              <div className="flex-1">
                <h5 className="font-semibold text-blue-800 mb-2">
                  Choose Knot Count
                </h5>
                <p className="text-blue-700">
                  Select 3, 4, or 5 additional knots to place (start and end
                  points are automatic).
                </p>
              </div>
            </div>
            <div className="mt-4">
              <img
                src="/tutorial/knot-placement/1-knot-count-selection.png"
                alt="Knot count selection interface showing 3, 4, 5 additional knots buttons"
                className="w-full max-w-2xl mx-auto rounded-lg border border-gray-300 shadow-sm"
              />
              <p className="text-sm text-blue-600 text-center mt-2">
                Click on &quot;3 Additional Knots&quot;, &quot;4 Additional
                Knots&quot;, or &quot;5 Additional Knots&quot; buttons
              </p>
            </div>
          </div>

          {/* Step 2: Click on Curve */}
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-start space-x-3 mb-3">
              <span className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                2
              </span>
              <div className="flex-1">
                <h5 className="font-semibold text-green-800 mb-2">
                  Click on the Curve
                </h5>
                <p className="text-green-700">
                  Click directly on the red trajectory line where you want to
                  place a knot. The interface will show you hover points and
                  coordinates.
                </p>
              </div>
            </div>
            <div className="mt-4">
              <img
                src="/tutorial/knot-placement/2-click-on-curve.png"
                alt="Trajectory chart showing how to click on the red curve to place knots"
                className="w-full max-w-2xl mx-auto rounded-lg border border-gray-300 shadow-sm"
              />
              <p className="text-sm text-green-600 text-center mt-2">
                Hover over the red curve and click at strategic points. Blue
                dots show interactive hover points.
              </p>
            </div>
          </div>

          {/* Step 3: Strategic Placement */}
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-start space-x-3">
              <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                3
              </span>
              <div className="flex-1">
                <h5 className="font-semibold text-purple-800 mb-2">
                  Strategic Placement Tips
                </h5>
                <ul className="text-purple-700 space-y-1">
                  <li>
                    • Focus on <strong>sharp turns</strong> and direction
                    changes
                  </li>
                  <li>
                    • Place knots at <strong>peaks and valleys</strong>
                  </li>
                  <li>
                    • Choose points that capture the{" "}
                    <strong>essential shape</strong>
                  </li>
                  <li>• Avoid placing knots too close together</li>
                  <li>• Think: "What points would recreate this path?"</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Step 4: Check Visualization */}
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-start space-x-3 mb-3">
              <span className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                4
              </span>
              <div className="flex-1">
                <h5 className="font-semibold text-orange-800 mb-2">
                  Check Your Knot Drawing
                </h5>
                <p className="text-orange-700">
                  See how your knots connect in the visualization section. This
                  shows your simplified trajectory.
                </p>
              </div>
            </div>
            <div className="mt-4">
              <img
                src="/tutorial/knot-placement/3-knot-drawing.png"
                alt="Your Knot Drawing visualization showing connected knots with blue lines"
                className="w-full max-w-2xl mx-auto rounded-lg border border-gray-300 shadow-sm"
              />
              <p className="text-sm text-orange-600 text-center mt-2">
                Blue lines connect your knots in trajectory order. This is your
                simplified version of the curve.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Color Coding and Visual Elements",
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold mb-3 text-gray-800">
            Understanding the interface:
          </h4>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <p className="text-gray-800">
                <strong>Red curve:</strong> Original trajectory path with all
                data points
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
              <p className="text-gray-800">
                <strong>Red dots:</strong> Automatic start and end knots (fixed,
                cannot be removed)
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              <p className="text-gray-800">
                <strong>Green dots:</strong> Your manually placed knots
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-1 bg-blue-500"></div>
              <p className="text-gray-800">
                <strong>Blue lines:</strong> Connections between knots in
                trajectory order
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              <p className="text-gray-800">
                <strong>Blue highlight:</strong> Interactive hover points on the
                curve
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Available Tools and Controls",
      content: (
        <div className="space-y-6">
          <h4 className="font-semibold mb-3 text-gray-800">
            Control buttons and features:
          </h4>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="font-semibold text-gray-800 mb-2">
                🔢 Knot Count Buttons (3, 4, 5)
              </h5>
              <p className="text-gray-700">
                Change how many additional knots you want to place. When you
                reduce the count, excess knots are removed from the end
                automatically.
              </p>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <h5 className="font-semibold text-red-800 mb-2">
                🗑️ Remove Last Knot
              </h5>
              <p className="text-red-700">
                Undo your most recent knot placement. This removes the last
                manually placed knot (not start/end points).
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h5 className="font-semibold text-blue-800 mb-2">
                ❌ Individual Remove
              </h5>
              <p className="text-blue-700">
                Click "Remove" next to any knot in the knots list to delete it
                specifically. This gives you precise control over which knots to
                remove.
              </p>
            </div>
          </div>

          {/* Placed Knots Section */}
          <div className="bg-indigo-50 p-4 rounded-lg">
            <h5 className="font-semibold text-indigo-800 mb-3">
              📋 Placed Knots Management
            </h5>
            <p className="text-indigo-700 mb-4">
              View and manage all your placed knots with detailed coordinates
              and easy removal options.
            </p>
            <div className="mt-4">
              <img
                src="/tutorial/knot-placement/4-placed-knots-list.png"
                alt="Placed knots list showing knot details and remove buttons"
                className="w-full max-w-2xl mx-auto rounded-lg border border-gray-300 shadow-sm"
              />
              <p className="text-sm text-indigo-600 text-center mt-2">
                Each knot shows its coordinates and type. Red sections are fixed
                start/end points, gray sections are your additional knots.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h5 className="font-semibold text-green-800 mb-2">
                📊 Progress Tracking
              </h5>
              <p className="text-green-700">
                Colored dots show your completion status across all 10
                trajectories:
              </p>
              <ul className="mt-2 space-y-1 text-green-600">
                <li>
                  •{" "}
                  <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                  Current trajectory
                </li>
                <li>
                  •{" "}
                  <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                  Completed trajectories
                </li>
                <li>
                  •{" "}
                  <span className="inline-block w-3 h-3 bg-gray-300 rounded-full mr-2"></span>
                  Pending trajectories
                </li>
              </ul>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h5 className="font-semibold text-purple-800 mb-2">
                ⬅️➡️ Navigation
              </h5>
              <p className="text-purple-700">
                Move between trajectories using Previous/Next buttons. You can
                only proceed after completing the current trajectory with the
                required number of knots.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Complete Workflow Overview",
      content: (
        <div className="space-y-6">
          <h4 className="font-semibold mb-3 text-gray-800">
            Visual Guide to the Complete Process:
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Workflow Step 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                  1
                </span>
                <h5 className="font-semibold text-blue-800">
                  Select Knot Count
                </h5>
              </div>
              <img
                src="/tutorial/knot-placement/1-knot-count-selection.png"
                alt="Step 1: Knot count selection"
                className="w-full rounded-lg border border-blue-200 shadow-sm mb-2"
              />
              <p className="text-sm text-blue-700">
                Choose 3, 4, or 5 additional knots
              </p>
            </div>

            {/* Workflow Step 2 */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <span className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                  2
                </span>
                <h5 className="font-semibold text-green-800">Place Knots</h5>
              </div>
              <img
                src="/tutorial/knot-placement/2-click-on-curve.png"
                alt="Step 2: Click on curve to place knots"
                className="w-full rounded-lg border border-green-200 shadow-sm mb-2"
              />
              <p className="text-sm text-green-700">
                Click on the red curve at strategic points
              </p>
            </div>

            {/* Workflow Step 3 */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <span className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                  3
                </span>
                <h5 className="font-semibold text-orange-800">
                  View Visualization
                </h5>
              </div>
              <img
                src="/tutorial/knot-placement/3-knot-drawing.png"
                alt="Step 3: Knot drawing visualization"
                className="w-full rounded-lg border border-orange-200 shadow-sm mb-2"
              />
              <p className="text-sm text-orange-700">
                Check how your knots connect
              </p>
            </div>

            {/* Workflow Step 4 */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                  4
                </span>
                <h5 className="font-semibold text-purple-800">Manage Knots</h5>
              </div>
              <img
                src="/tutorial/knot-placement/4-placed-knots-list.png"
                alt="Step 4: Placed knots management"
                className="w-full rounded-lg border border-purple-200 shadow-sm mb-2"
              />
              <p className="text-sm text-purple-700">
                Review and remove knots if needed
              </p>
            </div>
          </div>

          {/* Key Points */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h5 className="font-semibold text-yellow-800 mb-3">
              🔑 Key Points to Remember:
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <ul className="space-y-2 text-yellow-700">
                <li>
                  • Start and end points are{" "}
                  <strong>automatically placed</strong>
                </li>
                <li>
                  • You only place the <strong>additional knots</strong> (3, 4,
                  or 5)
                </li>
                <li>
                  • Focus on <strong>significant curve features</strong>
                </li>
                <li>
                  • Use the visualization to <strong>check your work</strong>
                </li>
              </ul>
              <ul className="space-y-2 text-yellow-700">
                <li>
                  • You can <strong>change knot count</strong> without losing
                  work
                </li>
                <li>
                  • <strong>Remove knots</strong> individually or the last one
                </li>
                <li>
                  • Complete all <strong>10 trajectories</strong> to submit
                </li>
                <li>
                  • Need the <strong>submission password</strong> to finish
                </li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Completion and Submission",
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold mb-3 text-gray-800">Final steps:</h4>
          <div className="space-y-3">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h5 className="font-semibold text-yellow-800 mb-2">
                📋 Complete all trajectories:
              </h5>
              <p className="text-yellow-700">
                You must place the required number of knots on all 10
                trajectories before you can submit.
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h5 className="font-semibold text-red-800 mb-2">
                🔐 Password required:
              </h5>
              <p className="text-red-700">
                You'll need the submission password provided to you to complete
                the annotation process.
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h5 className="font-semibold text-green-800 mb-2">
                ✅ Automatic submission:
              </h5>
              <p className="text-green-700">
                Once you enter the correct password, your annotations will be
                automatically saved and you'll be redirected to the home page.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Tips for Success",
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold mb-3 text-gray-800">Best practices:</h4>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <span className="text-green-500 text-xl">💡</span>
              <p className="text-gray-800">
                <strong>Focus on key features:</strong> Place knots at the most
                distinctive parts of the trajectory - sharp turns, peaks,
                valleys
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-blue-500 text-xl">🎯</span>
              <p className="text-gray-800">
                <strong>Think about shape:</strong> Ask yourself "What points
                would I need to roughly recreate this path?"
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-purple-500 text-xl">👀</span>
              <p className="text-gray-800">
                <strong>Use the visualization:</strong> Check the "Your Knot
                Drawing" to see how well your knots capture the original shape
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-orange-500 text-xl">⚡</span>
              <p className="text-gray-800">
                <strong>Don't overthink:</strong> Trust your intuition about
                what points seem most important
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-red-500 text-xl">🔄</span>
              <p className="text-gray-800">
                <strong>Experiment:</strong> You can remove and replace knots
                until you're satisfied
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const openTutorial = () => {
    setShowTutorial(true);
    setCurrentTutorialStep(0);
  };

  const closeTutorial = () => {
    setShowTutorial(false);
    setCurrentTutorialStep(0);
  };

  const startAnnotatingFromTutorial = () => {
    setShowTutorial(false);
    setCurrentTutorialStep(0);
    setAnnotationMode(true);
    setCurrentTrajectoryIndex(0);
  };

  const nextTutorialStep = () => {
    if (currentTutorialStep < tutorialSteps.length - 1) {
      setCurrentTutorialStep((prev) => prev + 1);
    }
  };

  const prevTutorialStep = () => {
    if (currentTutorialStep > 0) {
      setCurrentTutorialStep((prev) => prev - 1);
    }
  };

  useEffect(() => {
    // Generate a unique session ID when component mounts
    const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
    loadRandomTrajectories();
  }, []);

  const loadRandomTrajectories = async () => {
    setLoading(true);
    setError("");
    try {
      // Get 10 random track IDs
      const allTrackIds = await trajectoryAPI.getUniqueTrackIds();
      const shuffled = allTrackIds.sort(() => 0.5 - Math.random());
      const selectedTrackIds = shuffled.slice(0, 10);

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
          },
        ];

        return {
          trackId,
          data: sortedData,
          knots: initialKnots,
          selectedKnotCount: 3, // Default to 3 additional knots (plus start and end = 5 total)
        };
      });

      const loadedTrajectories = await Promise.all(trajectoryPromises);
      setTrajectories(loadedTrajectories);
    } catch (err) {
      console.error("Failed to load random trajectories:", err);
      setError("Failed to load trajectories for annotation");
    } finally {
      setLoading(false);
    }
  };

  const startAnnotation = () => {
    setAnnotationMode(true);
    setCurrentTrajectoryIndex(0);
  };

  const handleKnotCountChange = useCallback(
    (count: number) => {
      setTrajectories((prev) =>
        prev.map((traj, index) => {
          if (index === currentTrajectoryIndex) {
            // Get current manual knots (excluding start and end)
            const manualKnots = traj.knots.filter(
              (knot) =>
                !knot.id.startsWith("start-knot") &&
                !knot.id.startsWith("end-knot"),
            );
            const startKnot = traj.knots.find((knot) =>
              knot.id.startsWith("start-knot"),
            );
            const endKnot = traj.knots.find((knot) =>
              knot.id.startsWith("end-knot"),
            );

            let adjustedManualKnots = [...manualKnots];

            // If reducing knot count, remove excess knots from the end
            if (manualKnots.length > count) {
              adjustedManualKnots = manualKnots.slice(0, count);

              // Clean up the removed knots from the placement order map
              setKnotPlacementOrder((prev) => {
                const newOrderMap = new Map(prev);
                manualKnots.slice(count).forEach((knot) => {
                  newOrderMap.delete(knot.id);
                });

                // Re-rank remaining manual knots to maintain sequential order (0, 1, 2, etc.)
                adjustedManualKnots.forEach((knot, index) => {
                  newOrderMap.set(knot.id, index);
                });

                return newOrderMap;
              });
            }
            // If increasing knot count, keep all existing knots (no change needed)

            // Combine adjusted manual knots with start and end knots
            const preservedKnots = [
              ...adjustedManualKnots,
              ...(startKnot ? [startKnot] : []),
              ...(endKnot ? [endKnot] : []),
            ];

            return {
              ...traj,
              selectedKnotCount: count,
              knots: preservedKnots,
            };
          }
          return traj;
        }),
      );
    },
    [currentTrajectoryIndex],
  );

  const handleChartClick = useCallback(
    (event: any) => {
      if (!annotationMode) return;

      const currentTrajectory = trajectories[currentTrajectoryIndex];
      // Calculate total allowed knots (selected count + 2 for start and end)
      const totalAllowedKnots = currentTrajectory.selectedKnotCount + 2;

      if (currentTrajectory.knots.length >= totalAllowedKnots) {
        alert(
          `You can only place ${currentTrajectory.selectedKnotCount} additional knots on this curve (plus start and end points).`,
        );
        return;
      }

      if (event && event.activePayload && event.activePayload[0]) {
        const data = event.activePayload[0].payload;

        // Get the next rank for manual knots (starts from 0)
        const manualKnots = Array.from(knotPlacementOrder.entries()).filter(
          ([id, _]) =>
            !id.startsWith("start-knot") && !id.startsWith("end-knot"),
        );
        const nextRank = manualKnots.length; // 0, 1, 2, etc.

        const newKnot: KnotAnnotation = {
          x: data.localX,
          y: data.localY,
          id: `knot-${Date.now()}`,
          order: nextRank,
        };

        // Batch state updates to prevent multiple re-renders
        setKnotPlacementOrder((prev) =>
          new Map(prev).set(newKnot.id, nextRank),
        );
        setTrajectories((prev) =>
          prev.map((traj, index) =>
            index === currentTrajectoryIndex
              ? { ...traj, knots: [...traj.knots, newKnot] }
              : traj,
          ),
        );
      }
    },
    [annotationMode, trajectories, currentTrajectoryIndex, knotPlacementOrder],
  );

  const removeKnot = useCallback(
    (knotId: string) => {
      // Prevent removing start and end knots
      if (knotId.startsWith("start-knot") || knotId.startsWith("end-knot")) {
        alert(
          "Cannot remove start or end knots. They are automatically placed.",
        );
        return;
      }

      // Remove from order tracking and re-rank efficiently
      setKnotPlacementOrder((prev) => {
        const newMap = new Map(prev);
        newMap.delete(knotId);

        // Re-rank remaining manual knots to maintain sequential order (0, 1, 2, etc.)
        const remainingManualKnots = Array.from(newMap.entries()).filter(
          ([id, _]) =>
            !id.startsWith("start-knot") && !id.startsWith("end-knot"),
        );

        // Sort by current rank and reassign sequential ranks starting from 0
        remainingManualKnots
          .sort(([, rankA], [, rankB]) => rankA - rankB)
          .forEach(([id, _], index) => {
            newMap.set(id, index);
          });

        return newMap;
      });

      setTrajectories((prev) =>
        prev.map((traj, index) =>
          index === currentTrajectoryIndex
            ? {
                ...traj,
                knots: traj.knots.filter((knot) => knot.id !== knotId),
              }
            : traj,
        ),
      );
    },
    [currentTrajectoryIndex],
  );

  const removeLastKnot = useCallback(() => {
    setTrajectories((prev) =>
      prev.map((traj, index) => {
        if (index === currentTrajectoryIndex) {
          // Find the last knot that is not a start or end knot
          const knotsToRemove = traj.knots.filter(
            (knot) =>
              !knot.id.startsWith("start-knot") &&
              !knot.id.startsWith("end-knot"),
          );

          if (knotsToRemove.length === 0) {
            return traj; // No removable knots
          }

          // Remove the last manually placed knot
          const lastRemovableKnot = knotsToRemove[knotsToRemove.length - 1];

          // Remove from order tracking and re-rank remaining manual knots
          setKnotPlacementOrder((prev) => {
            const newMap = new Map(prev);
            newMap.delete(lastRemovableKnot.id);

            // Re-rank remaining manual knots to maintain sequential order (0, 1, 2, etc.)
            const remainingManualKnots = Array.from(newMap.entries()).filter(
              ([id, _]) =>
                !id.startsWith("start-knot") && !id.startsWith("end-knot"),
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
            knots: traj.knots.filter(
              (knot) => knot.id !== lastRemovableKnot.id,
            ),
          };
        }
        return traj;
      }),
    );
  }, [currentTrajectoryIndex]);

  const nextTrajectory = () => {
    if (currentTrajectoryIndex < trajectories.length - 1) {
      setCurrentTrajectoryIndex((prev) => prev + 1);
    }
  };

  const previousTrajectory = () => {
    if (currentTrajectoryIndex > 0) {
      setCurrentTrajectoryIndex((prev) => prev - 1);
    }
  };

  const finishAnnotation = async () => {
    // Check if all trajectories have the required number of knots (selected + 2 for start/end)
    const allComplete = trajectories.every(
      (traj) => traj.knots.length === traj.selectedKnotCount + 2,
    );

    if (!allComplete) {
      alert(
        "Please complete annotation for all trajectories before finishing.",
      );
      return;
    }

    // Collect and package knot placement data for all trajectories
    const annotationData = collectKnotPlacementData();

    // Store the annotation data and show password modal
    setPendingAnnotationData(annotationData);
    setPasswordError("");
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = async (password: string) => {
    if (!pendingAnnotationData) return;

    try {
      setIsValidatingPassword(true);
      setPasswordError("");

      // Validate password first
      const passwordValidation =
        await trajectoryAPI.validateSubmissionPassword(password);

      if (!passwordValidation.valid) {
        setPasswordError("Invalid password. Please try again.");
        return;
      }

      // Password is valid, submit annotations
      setLoading(true);
      setShowPasswordModal(false);

      // Add password to annotation data
      const annotationDataWithPassword = {
        ...pendingAnnotationData,
        password: password,
      };

      console.log("Submitting annotation data:", annotationDataWithPassword);

      const result = await trajectoryAPI.submitAnnotations(
        annotationDataWithPassword,
      );

      console.log("Annotation submission successful:", result);

      // Show success message and redirect to home
      alert(
        "Annotation completed successfully! You will now be redirected to the home page.",
      );

      // Reset state and redirect to home page
      setAnnotationMode(false);
      router.push("/");
    } catch (error) {
      console.error("Failed to submit annotations:", error);
      if (error instanceof Error && error.message.includes("password")) {
        setPasswordError("Invalid password. Please try again.");
      } else {
        setShowPasswordModal(false);
        alert("Failed to submit annotations. Please try again.");
      }
    } finally {
      setLoading(false);
      setIsValidatingPassword(false);
    }
  };

  const handlePasswordCancel = () => {
    setShowPasswordModal(false);
    setPendingAnnotationData(null);
    setPasswordError("");
  };

  /**
   * Collects and packages user's knot placement data for all trajectories
   * Records trackId, totalKnots, coordinates, and relativeOrder for each knot
   */
  const collectKnotPlacementData = (): AnnotationSubmission => {
    const trajectoryAnnotations: TrajectoryAnnotation[] = trajectories.map(
      (trajectory) => {
        // Separate manual knots and start/end knots
        const manualKnots = trajectory.knots.filter(
          (knot) =>
            !knot.id.startsWith("start-knot") &&
            !knot.id.startsWith("end-knot"),
        );
        const startKnot = trajectory.knots.find((knot) =>
          knot.id.startsWith("start-knot"),
        );
        const endKnot = trajectory.knots.find((knot) =>
          knot.id.startsWith("end-knot"),
        );

        // Sort manual knots by their rank (0, 1, 2, etc.)
        const sortedManualKnots = manualKnots
          .map((knot) => ({
            ...knot,
            order: knotPlacementOrder.get(knot.id) || 0,
          }))
          .sort((a, b) => a.order - b.order);

        // Create final knot list: manual knots first, then start and end knots
        const finalKnots = [
          ...sortedManualKnots,
          ...(startKnot ? [startKnot] : []),
          ...(endKnot ? [endKnot] : []),
        ];

        // Convert to the format expected by backend API
        const knotData: KnotData[] = finalKnots.map((knot, index) => ({
          x: knot.x,
          y: knot.y,
          relativeOrder: index + 1, // 1-based ordering for backend
        }));

        return {
          trackId: trajectory.trackId,
          totalKnots: trajectory.knots.length, // Total knots including start and end
          knots: knotData,
        };
      },
    );

    return {
      sessionId: sessionId,
      trajectories: trajectoryAnnotations,
    };
  };

  const currentTrajectory = trajectories[currentTrajectoryIndex];

  const isCurrentTrajectoryComplete = useMemo(() => {
    return (
      currentTrajectory &&
      currentTrajectory.knots.length === currentTrajectory.selectedKnotCount + 2
    );
  }, [currentTrajectory]);

  const areAllTrajectoriesComplete = useMemo(() => {
    return trajectories.every(
      (traj) => traj.knots.length === traj.selectedKnotCount + 2,
    );
  }, [trajectories]);

  const scrollToPreview = () => {
    if (previewSectionRef.current) {
      previewSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Place Knots - Annotation Tool
          </h1>
          <p className="text-gray-600">
            Annotate trajectory curves by placing knots at important points
          </p>
        </header>

        {/* Back button */}
        <div className="mb-6">
          <Link href="/">
            <button className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors cursor-pointer">
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
            <p className="text-gray-600">
              Loading random trajectories for annotation...
            </p>
          </div>
        ) : trajectories.length > 0 ? (
          <div className="space-y-6">
            {/* Instructions */}
            {!annotationMode ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Instructions
                  </h2>
                  <div className="relative">
                    {/* Animated Arrow pointing to Tutorial button */}
                    <div className="absolute -left-16 top-1/2 transform -translate-y-1/2 z-10 pointer-events-none">
                      <svg
                        width="50"
                        height="20"
                        viewBox="0 0 50 20"
                        className="drop-shadow-lg animate-[wiggle_1s_ease-in-out_infinite]"
                      >
                        {/* Arrow line */}
                        <path
                          d="M 5 10 L 35 10"
                          stroke="#10B981"
                          strokeWidth="3"
                          strokeDasharray="4,2"
                          fill="none"
                        />
                        {/* Arrow head */}
                        <polygon points="35,6 45,10 35,14" fill="#10B981" />
                      </svg>
                    </div>
                    <button
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer"
                      onClick={openTutorial}
                    >
                      Tutorial
                    </button>
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-gray-800 font-bold">
                    If you do not understand what this website is about, click
                    the Tutorial button above.
                  </p>
                </div>
                <div className="space-y-3 text-gray-600">
                  <p>• You will be shown 10 random trajectory curves</p>
                  <p>
                    • For each curve, select the number of additional knots to
                    place (3, 4, or 5)
                  </p>
                  <p>
                    • Start and end points are automatically placed as fixed
                    knots
                  </p>
                  <p>
                    • Click on the curve to place your additional knots at
                    points so that the placed points match the original
                    trajectories
                  </p>
                  <p>
                    •{" "}
                    <span className="text-purple-600 font-medium">
                      A visualization will show your knots connected in
                      trajectory order with straight line segments
                    </span>
                  </p>
                  <p>• Use the "Remove Last Knot" button to undo placements</p>
                  <p>• You must complete all curves to proceed</p>
                  <p>
                    •{" "}
                    <span className="text-red-600 font-semibold">
                      In order to submit, you must use the password given to you
                    </span>
                  </p>
                </div>
                <div className="mt-6">
                  <button
                    onClick={startAnnotation}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors cursor-pointer"
                  >
                    Start Annotation
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Header with Tutorial - Always visible */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-800">
                        Place Knots - Annotation Tool
                      </h1>
                      <p className="text-gray-600">
                        Annotate trajectory curves by placing knots at important
                        points
                      </p>
                    </div>
                    <div className="relative">
                      {/* Animated Arrow pointing to Tutorial button */}
                      <div className="absolute -left-16 top-1/2 transform -translate-y-1/2 z-10 pointer-events-none">
                        <svg
                          width="50"
                          height="20"
                          viewBox="0 0 50 20"
                          className="drop-shadow-lg animate-[wiggle_1s_ease-in-out_infinite]"
                        >
                          {/* Arrow line */}
                          <path
                            d="M 5 10 L 35 10"
                            stroke="#10B981"
                            strokeWidth="3"
                            strokeDasharray="4,2"
                            fill="none"
                          />
                          {/* Arrow head */}
                          <polygon points="35,6 45,10 35,14" fill="#10B981" />
                        </svg>
                      </div>
                      <button
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer"
                        onClick={openTutorial}
                      >
                        Tutorial
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress indicator */}
                <div className="bg-white rounded-lg shadow-md p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">
                      Trajectory {currentTrajectoryIndex + 1} of{" "}
                      {trajectories.length}
                      <span className="text-blue-600 ml-2">
                        (Track ID: {currentTrajectory?.trackId})
                      </span>
                    </h2>
                    <div className="flex space-x-2">
                      {trajectories.map((_, index) => (
                        <div
                          key={index}
                          className={`w-3 h-3 rounded-full ${
                            index === currentTrajectoryIndex
                              ? "bg-blue-500"
                              : index < currentTrajectoryIndex
                                ? "bg-green-500"
                                : "bg-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>Overall Progress</span>
                      <span>
                        {Math.round(
                          (currentTrajectoryIndex / trajectories.length) * 100,
                        )}
                        % Complete
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${(currentTrajectoryIndex / trajectories.length) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Completed: {currentTrajectoryIndex}</span>
                      <span>
                        Remaining:{" "}
                        {trajectories.length - currentTrajectoryIndex}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Knot count selection */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Select Number of Additional Knots
                  </h3>
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-4">
                      {[3, 4, 5].map((count) => (
                        <button
                          key={count}
                          onClick={() => handleKnotCountChange(count)}
                          className={`px-4 py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
                            currentTrajectory?.selectedKnotCount === count
                              ? "bg-blue-500 text-white"
                              : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                          }`}
                        >
                          {count} Additional Knots
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={removeLastKnot}
                      disabled={
                        !currentTrajectory?.knots.length ||
                        currentTrajectory?.knots.length <= 2
                      }
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                        currentTrajectory?.knots.length &&
                        currentTrajectory?.knots.length > 2
                          ? "bg-red-500 hover:bg-red-600 text-white cursor-pointer"
                          : "bg-gray-300 cursor-not-allowed text-gray-500"
                      }`}
                    >
                      Remove Last Knot
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Additional knots placed:{" "}
                    {Math.max(0, (currentTrajectory?.knots.length || 0) - 2)} /{" "}
                    {currentTrajectory?.selectedKnotCount || 3}
                    <br />
                    Total knots: {currentTrajectory?.knots.length || 0}{" "}
                    (including start and end points)
                  </p>
                </div>

                {/* Trajectory chart with side navigation */}
                <div className="relative flex items-center gap-4">
                  {/* Navigation button - Previous (Left) */}
                  <button
                    onClick={previousTrajectory}
                    disabled={currentTrajectoryIndex === 0}
                    className="flex-shrink-0 bg-white/70 backdrop-blur-sm hover:bg-white/90 disabled:bg-gray-200/50 disabled:cursor-not-allowed text-gray-700 disabled:text-gray-400 p-3 rounded-full shadow-lg transition-all cursor-pointer"
                    title="Previous trajectory"
                  >
                    <span className="text-2xl font-bold">&lt;</span>
                  </button>

                  {/* Trajectory chart container */}
                  <div className="flex-1 bg-white rounded-lg shadow-md p-6 relative">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      {isCurrentTrajectoryComplete
                        ? "Trajectory Complete - All knots placed!"
                        : "Click on the curve to place additional knots"}
                    </h3>

                    {/* Small preview thumbnail - top right */}
                    {currentTrajectory && currentTrajectory.knots.length > 0 && (
                      <div
                        onClick={scrollToPreview}
                        className="absolute top-4 right-4 z-10 cursor-pointer hover:opacity-80 transition-opacity"
                        title="Click to scroll to full preview"
                      >
                      <div className="bg-white border-2 border-gray-400 rounded-lg shadow-xl p-1 hover:border-blue-500 transition-colors">
                        <KnotVisualization
                          knots={currentTrajectory.knots}
                          knotPlacementOrder={knotPlacementOrder}
                          trajectoryData={currentTrajectory.data}
                          width={240}
                          height={145}
                        />
                        <p className="text-xs text-gray-600 text-center mt-1 font-semibold">👇 Click to view full preview</p>
                      </div>
                    </div>
                  )}

                  {currentTrajectory && (
                    <div className="h-156 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={currentTrajectory.data}
                          margin={{ top: 20, right: 30, bottom: 80, left: 80 }}
                          onClick={
                            isCurrentTrajectoryComplete
                              ? undefined
                              : handleChartClick
                          }
                          style={{
                            cursor: isCurrentTrajectoryComplete
                              ? "not-allowed"
                              : "pointer",
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            type="number"
                            dataKey="localX"
                            domain={["dataMin - 0.5", "dataMax + 0.5"]}
                            tickFormatter={(value) => value.toFixed(2)}
                            label={{
                              value: "Local X",
                              position: "insideBottomLeft",
                              offset: -15,
                            }}
                          />
                          <YAxis
                            type="number"
                            dataKey="localY"
                            domain={["dataMin - 0.5", "dataMax + 0.5"]}
                            tickFormatter={(value) => value.toFixed(2)}
                            label={{
                              value: "Local Y",
                              angle: -90,
                              position: "insideLeft",
                            }}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
                                    <p className="text-blue-600">
                                      X: {Number(data.localX).toFixed(4)}
                                    </p>
                                    <p className="text-red-600">
                                      Y: {Number(data.localY).toFixed(4)}
                                    </p>
                                    <p
                                      className={`text-sm ${isCurrentTrajectoryComplete ? "text-gray-500" : "text-green-600"}`}
                                    >
                                      {isCurrentTrajectoryComplete
                                        ? "All knots placed"
                                        : "Click to place knot"}
                                    </p>
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
                            activeDot={{ r: 6, fill: "#3B82F6" }}
                            name="Trajectory Path"
                          />
                          {/* Render knots as dots */}
                          {currentTrajectory.knots.map((knot, index) => {
                            const isStartOrEnd =
                              knot.id.startsWith("start-knot") ||
                              knot.id.startsWith("end-knot");
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

                  {/* Navigation button - Next (Right) */}
                  <button
                    onClick={nextTrajectory}
                    disabled={
                      !isCurrentTrajectoryComplete ||
                      currentTrajectoryIndex === trajectories.length - 1
                    }
                    className="flex-shrink-0 bg-white/70 backdrop-blur-sm hover:bg-white/90 disabled:bg-gray-200/50 disabled:cursor-not-allowed text-gray-700 disabled:text-gray-400 p-3 rounded-full shadow-lg transition-all cursor-pointer"
                    title="Next trajectory"
                  >
                    <span className="text-2xl font-bold">&gt;</span>
                  </button>
                </div>

                {/* Knot Drawing Visualization */}
                {currentTrajectory && currentTrajectory.knots.length > 0 && (
                  <div ref={previewSectionRef} className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Your Knot Drawing
                    </h3>
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-full max-w-4xl">
                        <KnotVisualization
                          knots={currentTrajectory.knots}
                          knotPlacementOrder={knotPlacementOrder}
                          trajectoryData={currentTrajectory.data}
                          width={800}
                          height={484}
                        />
                      </div>
                      <div className="text-sm text-gray-600 text-center">
                        <p>
                          <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                          Start/End Points
                          <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2 ml-4"></span>
                          Placed Knots
                          <span className="inline-block w-4 h-0.5 bg-blue-500 mr-2 ml-4"></span>
                          Connection Line
                        </p>
                        <p className="mt-2">
                          This shows the sequence of knots you've placed,
                          connected by spatial proximity to follow the original
                          trajectory path.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Knots list */}
                {currentTrajectory?.knots.length > 0 && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-blue-600 mb-4">
                      Placed Knots
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {currentTrajectory.knots.map((knot, index) => {
                        const isStartKnot = knot.id.startsWith("start-knot");
                        const isEndKnot = knot.id.startsWith("end-knot");
                        const isStartOrEnd = isStartKnot || isEndKnot;

                        // Calculate the manual knot number (excluding start and end)
                        const manualKnotIndex =
                          currentTrajectory.knots
                            .filter(
                              (k) =>
                                !k.id.startsWith("start-knot") &&
                                !k.id.startsWith("end-knot"),
                            )
                            .findIndex((k) => k.id === knot.id) + 1;

                        return (
                          <div
                            key={knot.id}
                            className={`p-3 rounded-lg ${isStartOrEnd ? "bg-red-50 border border-red-200" : "bg-gray-50"}`}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-semibold text-blue-600">
                                  {isStartKnot
                                    ? "Start Point"
                                    : isEndKnot
                                      ? "End Point"
                                      : `Additional Knot ${manualKnotIndex}`}
                                  {isStartOrEnd && (
                                    <span className="text-blue-500 text-xs ml-1">
                                      (Fixed)
                                    </span>
                                  )}
                                </p>
                                <p className="text-sm text-blue-500">
                                  X: {knot.x.toFixed(4)}, Y: {knot.y.toFixed(4)}
                                </p>
                              </div>
                              {!isStartOrEnd && (
                                <button
                                  onClick={() => removeKnot(knot.id)}
                                  className="text-blue-500 hover:text-blue-700 text-sm cursor-pointer"
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
                      className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded transition-colors cursor-pointer"
                    >
                      ← Previous
                    </button>

                    <div className="text-center">
                      <p className="text-sm text-gray-600">
                        {isCurrentTrajectoryComplete
                          ? "Trajectory complete! You can proceed."
                          : `Place ${currentTrajectory?.selectedKnotCount + 2 - (currentTrajectory?.knots.length || 0)} more knot(s) to complete this trajectory.`}
                      </p>
                    </div>

                    {currentTrajectoryIndex === trajectories.length - 1 ? (
                      <button
                        onClick={finishAnnotation}
                        disabled={!areAllTrajectoriesComplete || loading}
                        className={`px-6 py-2 rounded transition-colors font-semibold ${
                          areAllTrajectoriesComplete && !loading
                            ? "bg-green-500 hover:bg-green-600 text-white cursor-pointer"
                            : "bg-gray-300 cursor-not-allowed text-gray-500"
                        }`}
                      >
                        {loading
                          ? "Submitting..."
                          : areAllTrajectoriesComplete
                            ? "Submit Annotations"
                            : "Complete All Trajectories"}
                      </button>
                    ) : (
                      <button
                        onClick={nextTrajectory}
                        disabled={
                          !isCurrentTrajectoryComplete ||
                          currentTrajectoryIndex === trajectories.length - 1
                        }
                        className={`px-4 py-2 rounded transition-colors ${
                          isCurrentTrajectoryComplete
                            ? "bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"
                            : "bg-gray-300 cursor-not-allowed text-gray-500"
                        }`}
                      >
                        {isCurrentTrajectoryComplete
                          ? "Next →"
                          : "Complete Current Trajectory"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500">
              No trajectories loaded. Click the button above to load random
              trajectories.
            </p>
            <button
              onClick={loadRandomTrajectories}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors cursor-pointer"
            >
              Load Random Trajectories
            </button>
          </div>
        )}
      </div>

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 bg-opacity-95 flex items-center justify-center z-50 p-8">
          <div className="bg-white rounded-lg shadow-md max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-white p-6 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {tutorialSteps[currentTutorialStep].title}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Step {currentTutorialStep + 1} of {tutorialSteps.length}
                  </p>
                </div>
                <button
                  onClick={closeTutorial}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                >
                  ×
                </button>
              </div>
              {/* Progress bar */}
              <div className="bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 rounded-full h-2 transition-all duration-300"
                  style={{
                    width: `${((currentTutorialStep + 1) / tutorialSteps.length) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-196 bg-white">
              {tutorialSteps[currentTutorialStep].content}
            </div>

            {/* Footer */}
            <div className="bg-white px-6 py-4 border-t border-gray-200 flex justify-between items-center">
              <div className="flex space-x-3">
                <button
                  onClick={prevTutorialStep}
                  disabled={currentTutorialStep === 0}
                  className={`px-4 py-2 rounded transition-colors font-medium ${
                    currentTutorialStep === 0
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-gray-500 hover:bg-gray-600 text-white"
                  }`}
                >
                  ← Previous
                </button>

                <Link href="/">
                  <button className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded font-medium transition-colors">
                    🏠 Back to Home
                  </button>
                </Link>
              </div>

              <span className="text-gray-600 font-medium">
                {currentTutorialStep + 1} / {tutorialSteps.length}
              </span>

              {currentTutorialStep === tutorialSteps.length - 1 ? (
                <button
                  onClick={startAnnotatingFromTutorial}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded font-medium transition-colors"
                >
                  Start Annotating! 🚀
                </button>
              ) : (
                <button
                  onClick={nextTutorialStep}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-medium transition-colors"
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submission Password Modal */}
      <SubmissionPasswordModal
        isOpen={showPasswordModal}
        onSubmit={handlePasswordSubmit}
        onCancel={handlePasswordCancel}
        isValidating={isValidatingPassword}
        error={passwordError}
      />
    </div>
  );
}
