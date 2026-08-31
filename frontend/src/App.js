import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import EngineerSignup from './pages/EngineerSignup';
import CustomerSignup from './pages/CustomerSignup';
import Dashboard from './pages/Dashboard';
import CreateProject from './pages/CreateProject';
import MyProjects from './pages/MyProjects';
import FindEngineers from './pages/FindEngineers';
import BrowseProjects from './pages/BrowseProjects';
import MyRequests from './pages/MyRequests';
import EngineerProfile from './pages/EngineerProfile';
import ProjectDetail from './pages/ProjectDetail';
import FloorPlanDesigner from './pages/FloorPlanDesigner';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup/engineer" element={<EngineerSignup />} />
          <Route path="/signup/customer" element={<CustomerSignup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects/new" element={<CreateProject />} />
          <Route path="/my-projects" element={<MyProjects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/find-engineers" element={<FindEngineers />} />
          <Route path="/browse-projects" element={<BrowseProjects />} />
          <Route path="/my-requests" element={<MyRequests />} />
          <Route path="/engineer-profile" element={<EngineerProfile />} />
          <Route path="/design" element={<FloorPlanDesigner />} />
          <Route path="/projects/:projectId/design" element={<FloorPlanDesigner />} />
        </Routes>
        <ToastContainer position="top-right" autoClose={3000} theme="colored" />
      </Router>
    </AuthProvider>
  );
}

export default App;
