import axios from "axios";

const BASE_URL = "/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface UserAuthRequest {
  username: string;
  password: string;
  displayName?: string;
}

export interface UserLoginResponse {
  success: boolean;
  message: string;
  username?: string;
  displayName?: string;
  completedCount?: number;
  totalTrajectories?: number;
  currentIndex?: number;
  hasProgress?: boolean;
  lastSavedAt?: string;
}

export interface UserProgressResponse {
  success: boolean;
  message?: string;
  username?: string;
  displayName?: string;
  sessionData?: string;
  completedCount?: number;
  totalTrajectories?: number;
  currentIndex?: number;
  lastSavedAt?: string;
}

export interface SaveProgressRequest {
  username: string;
  sessionData: string;
  completedCount: number;
  currentIndex: number;
}

export const userAPI = {
  // Register a new user
  register: async (request: UserAuthRequest): Promise<UserLoginResponse> => {
    const response = await api.post("/user/register", request);
    return response.data;
  },

  // Login user
  login: async (request: UserAuthRequest): Promise<UserLoginResponse> => {
    const response = await api.post("/user/login", request);
    return response.data;
  },

  // Check if username exists
  checkUsername: async (username: string): Promise<{ exists: boolean }> => {
    const response = await api.get(`/user/exists?username=${encodeURIComponent(username)}`);
    return response.data;
  },

  // Get user progress
  getProgress: async (username: string): Promise<UserProgressResponse> => {
    const response = await api.get(`/user/progress?username=${encodeURIComponent(username)}`);
    return response.data;
  },

  // Save user progress
  saveProgress: async (request: SaveProgressRequest): Promise<{ success: boolean; message: string }> => {
    const response = await api.post("/user/progress", request);
    return response.data;
  },

  // Reset user progress
  resetProgress: async (username: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/user/progress?username=${encodeURIComponent(username)}`);
    return response.data;
  },

  // Logout user (clears backend session data)
  logout: async (username: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post("/user/logout", { username });
    return response.data;
  },
};

// Local storage helpers for session management
export const userSession = {
  // Save user session to localStorage
  saveSession: (username: string, displayName: string) => {
    localStorage.setItem("annotationUser", JSON.stringify({ username, displayName }));
  },

  // Get user session from localStorage
  getSession: (): { username: string; displayName: string } | null => {
    const session = localStorage.getItem("annotationUser");
    if (session) {
      try {
        return JSON.parse(session);
      } catch {
        return null;
      }
    }
    return null;
  },

  // Clear user session
  clearSession: () => {
    localStorage.removeItem("annotationUser");
  },

  // Save annotation progress to localStorage (for offline/temp storage)
  saveLocalProgress: (username: string, data: any) => {
    localStorage.setItem(`annotation-progress-${username}`, JSON.stringify(data));
  },

  // Get annotation progress from localStorage
  getLocalProgress: (username: string): any | null => {
    const data = localStorage.getItem(`annotation-progress-${username}`);
    if (data) {
      try {
        return JSON.parse(data);
      } catch {
        return null;
      }
    }
    return null;
  },

  // Clear local progress
  clearLocalProgress: (username: string) => {
    localStorage.removeItem(`annotation-progress-${username}`);
  },
};
