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
export const declineApplication = (projectId, applicationId) => API.put(`/projects/${projectId}/decline-application`, { applicationId });
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

// Admin
export const seedAdmin = (data) => API.post('/seed-admin', data);
export const getAdminStats = () => API.get('/admin/stats');
export const getAdminUsers = (params) => API.get('/admin/users', { params });
export const toggleUserActive = (id) => API.put(`/admin/users/${id}/toggle-active`);
export const deleteUser = (id) => API.delete(`/admin/users/${id}`);
export const getAdminEngineers = (params) => API.get('/admin/engineers', { params });
export const verifyEngineer = (id, status) => API.put(`/admin/engineers/${id}/verify`, { status });
export const getAdminProjects = (params) => API.get('/admin/projects', { params });
export const deleteProject = (id) => API.delete(`/admin/projects/${id}`);

// Voice to Project
export const voiceToProject = (text) => API.post('/projects/voice-to-project', { text });

// AI Analysis
export const getRiskAnalysis = (projectId) => API.get(`/projects/${projectId}/risk-analysis`);
export const getMaterialBreakdown = (projectId) => API.get(`/projects/${projectId}/material-breakdown`);
export const getProjectTimeline = (projectId, regenerate = false) => API.get(`/projects/${projectId}/timeline${regenerate ? '?regenerate=true' : ''}`);

// Milestones & Progress
export const updateMilestoneStatus = (projectId, milestoneId, status, comment) => API.put(`/projects/${projectId}/milestones/${milestoneId}/status`, { status, comment });
export const completeProject = (projectId) => API.put(`/projects/${projectId}/complete`);
export const rateProject = (projectId, rating, review) => API.post(`/projects/${projectId}/rate`, { rating, review });

// Invite Engineer
export const inviteEngineer = (projectId, engineerId, message) => API.post(`/projects/${projectId}/invite-engineer`, { engineerId, message });

// Messaging & Rate Negotiation
export const getMessages = (projectId) => API.get(`/projects/${projectId}/messages`);
export const sendMessage = (projectId, text) => API.post(`/projects/${projectId}/messages`, { text });
export const proposeRate = (projectId, amount, rateType) => API.post(`/projects/${projectId}/propose-rate`, { amount, rateType });
export const acceptRate = (projectId) => API.post(`/projects/${projectId}/accept-rate`);

// Escrow
export const fundEscrow = (projectId, paymentMethod) => API.post(`/projects/${projectId}/fund-escrow`, { paymentMethod });
export const getEscrow = (projectId) => API.get(`/projects/${projectId}/escrow`);

// Deliverables
export const getDeliverables = (projectId) => API.get(`/projects/${projectId}/deliverables`);
export const uploadDeliverable = (projectId, formData) => API.post(`/projects/${projectId}/deliverables`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteDeliverable = (projectId, deliverableId) => API.delete(`/projects/${projectId}/deliverables/${deliverableId}`);

// AI Chatbot
export const askAI = (question, projectContext) => API.post('/projects/ask-ai', { question, projectContext });

export default API;
