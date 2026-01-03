"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { userAPI, userSession } from "@/lib/userApi";

interface UserInfo {
  username: string;
  displayName: string;
}

interface ProgressInfo {
  completedCount: number;
  totalTrajectories: number;
  currentIndex: number;
  hasProgress: boolean;
  lastSavedAt: string | null;
}

export default function AnnotateAllDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [progress, setProgress] = useState<ProgressInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const session = userSession.getSession();
    if (!session) {
      router.push("/annotate-all");
      return;
    }

    setUser(session);
    loadProgress(session.username);
  }, [router]);

  const loadProgress = async (username: string) => {
    try {
      const response = await userAPI.getProgress(username);
      if (response.success) {
        setProgress({
          completedCount: response.completedCount || 0,
          totalTrajectories: response.totalTrajectories || 237,
          currentIndex: response.currentIndex || 0,
          hasProgress: !!response.sessionData,
          lastSavedAt: response.lastSavedAt || null,
        });
      }
    } catch (err) {
      console.error("Failed to load progress:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!user) return;

    try {
      // Call backend to clear session data
      await userAPI.logout(user.username);
      // Clear all localStorage
      userSession.clearSession();
      userSession.clearLocalProgress(user.username);
      // Also clear the annotation state
      localStorage.removeItem(`annotate-all-${user.username}-state`);
      router.push("/annotate-all");
    } catch (err) {
      console.error("Logout error:", err);
      // Still clear frontend session even if backend fails
      userSession.clearSession();
      userSession.clearLocalProgress(user.username);
      localStorage.removeItem(`annotate-all-${user.username}-state`);
      router.push("/annotate-all");
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const progressPercentage = progress
    ? Math.round((progress.completedCount / progress.totalTrajectories) * 100)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <Link href="/">
            <button className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors cursor-pointer">
              ← Back to Home
            </button>
          </Link>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors cursor-pointer"
          >
            Logout
          </button>
        </div>

        {/* Welcome Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Welcome back, {user?.displayName || user?.username}!
          </h1>
          <p className="text-gray-600">
            Logged in as: <span className="font-medium">{user?.username}</span>
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Progress Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Your Progress
          </h2>

          {/* Progress Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">
                {progress?.completedCount || 0}
              </p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-gray-600">
                {(progress?.totalTrajectories || 237) -
                  (progress?.completedCount || 0)}
              </p>
              <p className="text-sm text-gray-600">Remaining</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-green-600">
                {progressPercentage}%
              </p>
              <p className="text-sm text-gray-600">Complete</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Overall Progress</span>
              <span>
                {progress?.completedCount || 0} /{" "}
                {progress?.totalTrajectories || 237}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Last Saved */}
          <p className="text-sm text-gray-500">
            Last saved: {formatDate(progress?.lastSavedAt || null)}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-4">
            <Link href="/annotate-all/annotate">
              <button className={`w-full py-4 ${progress?.hasProgress ? 'bg-blue-500 hover:bg-blue-600' : 'bg-green-500 hover:bg-green-600'} text-white rounded-lg font-semibold text-lg transition-colors cursor-pointer`}>
                {progress?.hasProgress
                  ? `Continue from Trajectory ${(progress?.currentIndex || 0) + 1}`
                  : 'Start Annotating'
                }
              </button>
            </Link>
          </div>

          {/* Info */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              <strong>Remember:</strong> Click "Save Progress" regularly to save
              your work. Your progress is only saved when you click the save
              button.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
