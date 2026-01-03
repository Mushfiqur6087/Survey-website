"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AnnotationInterface, { TrajectoryWithKnots } from "@/components/AnnotationInterface";
import { userAPI, userSession } from "@/lib/userApi";

interface ProgressData {
  trajectories: TrajectoryWithKnots[];
  currentIndex: number;
  knotPlacementOrder: [string, number][];
}

export default function AnnotateAllAnnotate() {
  const router = useRouter();
  const [username, setUsername] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [initialProgress, setInitialProgress] = useState<ProgressData | null>(null);

  useEffect(() => {
    const session = userSession.getSession();
    if (!session) {
      router.push("/annotate-all");
      return;
    }

    setUsername(session.username);
    loadProgress(session.username);
  }, [router]);

  const loadProgress = async (user: string) => {
    try {
      const response = await userAPI.getProgress(user);
      if (response.success && response.sessionData) {
        try {
          const parsed = JSON.parse(response.sessionData);
          setInitialProgress({
            trajectories: parsed.trajectories || [],
            currentIndex: parsed.currentIndex || 0,
            knotPlacementOrder: parsed.knotPlacementOrder || [],
          });
        } catch (err) {
          console.error("Failed to parse session data:", err);
        }
      }
    } catch (err) {
      console.error("Failed to load progress:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProgress = async (data: {
    trajectories: TrajectoryWithKnots[];
    currentIndex: number;
    completedCount: number;
    knotPlacementOrder: [string, number][];
  }) => {
    const sessionData = JSON.stringify({
      trajectories: data.trajectories,
      currentIndex: data.currentIndex,
      knotPlacementOrder: data.knotPlacementOrder,
    });

    await userAPI.saveProgress({
      username,
      sessionData,
      completedCount: data.completedCount,
      currentIndex: data.currentIndex,
    });

    // Also save to localStorage as backup
    userSession.saveLocalProgress(username, {
      trajectories: data.trajectories,
      currentIndex: data.currentIndex,
      knotPlacementOrder: data.knotPlacementOrder,
    });
  };

  const handleComplete = (sessionId: string) => {
    console.log("Completed all annotations with session:", sessionId);
    // Clear local progress
    userSession.clearLocalProgress(username);
    router.push("/annotate-all/dashboard");
  };

  const handleCancel = () => {
    router.push("/annotate-all/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your progress...</p>
        </div>
      </div>
    );
  }

  return (
    <AnnotationInterface
      mode="all"
      sessionPrefix={`annotate-all-${username}`}
      title="Annotate All Trajectories"
      description={`Annotating all 237 trajectories • Logged in as: ${username}`}
      showTutorial={true}
      showBackButton={false}
      username={username}
      enableSaveProgress={true}
      initialProgress={initialProgress}
      onSaveProgress={handleSaveProgress}
      onComplete={handleComplete}
      onCancel={handleCancel}
    />
  );
}
