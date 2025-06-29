import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api';

export interface TrajectoryData {
  id: number;
  sceneId: number;
  uniqueTrackId: number;
  localX: number;
  localY: number;
}

export interface KnotData {
  x: number;
  y: number;
  relativeOrder: number;
}

export interface TrajectoryAnnotation {
  trackId: number;
  totalKnots: number;
  knots: KnotData[];
}

export interface AnnotationSubmission {
  sessionId: string;
  trajectories: TrajectoryAnnotation[];
}

export interface KnotAnnotation {
  id: number;
  sessionId: string;
  trackId: number;
  totalKnots: number;
  x: number;
  y: number;
  relativeOrder: number;
  createdAt: string;
}

export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface AdminLoginResponse {
  success: boolean;
  message: string;
  username?: string;
  token?: string;
}

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const trajectoryAPI = {
  // Health check
  checkHealth: async (): Promise<string> => {
    const response = await api.get('/health');
    return response.data;
  },

  // Get all trajectories
  getAllTrajectories: async (): Promise<TrajectoryData[]> => {
    const response = await api.get('/trajectories');
    return response.data;
  },

  // Get all unique track IDs
  getUniqueTrackIds: async (): Promise<number[]> => {
    const response = await api.get('/trajectories/unique-track-ids');
    return response.data;
  },

  // Get trajectory data by track ID
  getTrajectoryByTrackId: async (trackId: number): Promise<TrajectoryData[]> => {
    const response = await api.get(`/trajectories/track/${trackId}`);
    return response.data;
  },

  // Get trajectory data by multiple track IDs
  getTrajectoryByTrackIds: async (trackIds: number[]): Promise<TrajectoryData[]> => {
    const response = await api.post('/trajectories/tracks', trackIds);
    return response.data;
  },

  // Get random trajectories for annotation
  getRandomTrajectories: async (count: number = 5): Promise<number[]> => {
    const response = await api.get(`/trajectories/random/${count}`);
    return response.data;
  },

  // Submit knot annotation data
  submitAnnotations: async (submission: AnnotationSubmission): Promise<any> => {
    const response = await api.post('/annotations/submit', submission);
    return response.data;
  },
  

  // Get annotations by session ID
  getAnnotationsBySessionId: async (sessionId: string): Promise<any[]> => {
    const response = await api.get(`/annotations/session/${sessionId}`);
    return response.data;
  },

  // Get all annotations
  getAllAnnotations: async (): Promise<any[]> => {
    const response = await api.get('/annotations');
    return response.data;
  },
};

export const adminAPI = {
  // Admin login
  login: async (credentials: AdminLoginRequest): Promise<AdminLoginResponse> => {
    const response = await api.post('/admin/login', credentials);
    if (response.data.token) {
      localStorage.setItem('adminToken', response.data.token);
      api.defaults.headers.common['X-Admin-Token'] = response.data.token;
    }
    return response.data;
  },
  // Set token for future requests
  setToken: (token: string) => {
    localStorage.setItem('adminToken', token);
    api.defaults.headers.common['X-Admin-Token'] = token;
  },
  // Remove token
  clearToken: () => {
    localStorage.removeItem('adminToken');
    delete api.defaults.headers.common['X-Admin-Token'];
  },
  // Get all knot annotations for admin dashboard
  getAllKnotAnnotations: async (): Promise<KnotAnnotation[]> => {
    const response = await api.get('/annotations');
    return response.data;
  },
};
