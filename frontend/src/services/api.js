import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('buildlink_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const registerUser = (data) => API.post('/auth/register', data);
export const registerEngineer = (data) => API.post('/auth/register/engineer', data);
export const loginUser = (data) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');

// Engineers
export const getEngineers = (params) => API.get('/engineers', { params });
export const getEngineer = (id) => API.get(`/engineers/${id}`);
export const getMyEngineerProfile = () => API.get('/engineers/me');
export const updateEngineerProfile = (data) => API.put('/engineers/profile', data);

// Projects
export const createProject = (data) => API.post('/projects', data);
export const getMyProjects = () => API.get('/projects/my');
export const getProject = (id) => API.get(`/projects/${id}`);
export const updateProjectStatus = (id, status) => API.put(`/projects/${id}/status`, { status });
export const selectEngineer = (projectId, applicationId) => API.put(`/projects/${projectId}/select-engineer`, { applicationId });
export const getCostEstimate = (data) => API.post('/projects/estimate', data);
export const getMatchedEngineers = (projectId) => API.get(`/projects/${projectId}/match-engineers`);

// Engineer Dashboard
export const getEngineerStats = () => API.get('/engineer/stats');
export const getAvailableProjects = (params) => API.get('/engineer/available-projects', { params });
export const getEngineerRequests = () => API.get('/engineer/my-requests');
export const getActiveProjects = () => API.get('/engineer/active-projects');
export const applyToProject = (projectId, data) => API.post(`/engineer/apply/${projectId}`, data);
export const respondToProject = (projectId, data) => API.put(`/engineer/respond/${projectId}`, data);
export const submitMilestone = (projectId, index, data) => API.put(`/engineer/submit-milestone/${projectId}/${index}`, data);

// Floor Plans
export const generateFloorPlan = (data) => API.post('/floorplan/generate', data);
export const generateProjectFloorPlan = (projectId, data) => API.post(`/floorplan/project/${projectId}/generate`, data);
export const amendProjectFloorPlan = (projectId, amendment) => API.post(`/floorplan/project/${projectId}/amend`, { amendment });
export const getProjectFloorPlan = (projectId) => API.get(`/floorplan/project/${projectId}`);

export default API;
