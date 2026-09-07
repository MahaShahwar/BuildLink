import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyProjects } from '../services/api';
import './MyProjects.css';

const MyProjects = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await getMyProjects();
        if (res.data.success) setProjects(res.data.data);
      } catch { setProjects([]); }
    };
    fetchProjects();
  }, []);

  const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter);

  const getStatusColor = (status) => {
    const colors = {
      draft: '#94a3b8', posted: '#3b82f6', matched: '#8b5cf6',
      in_progress: '#f59e0b', review: '#f97316', completed: '#10b981',
      cancelled: '#ef4444',
    };
    return colors[status] || '#94a3b8';
  };

  const getStatusLabel = (status) => {
    const labels = {
      draft: 'Draft', posted: 'Open', matched: 'Matched',
      in_progress: 'In Progress', review: 'Under Review', completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  };

  const formatPKR = (n) => n ? `PKR ${new Intl.NumberFormat('en-PK').format(n)}` : 'N/A';

  return (
    <div className="my-projects">
      <div className="my-projects__container">
        <div className="my-projects__header">
          <div>
            <h1>My Projects</h1>
            <p>{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
          </div>
          {user?.role === 'customer' && (
            <Link to="/projects/new" className="btn-form btn-form--primary">
              + New Project
            </Link>
          )}
        </div>

        {/* Filter tabs */}
        <div className="my-projects__tabs">
          {[
            { value: 'all', label: 'All' },
            { value: 'posted', label: 'Open' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'completed', label: 'Completed' },
            { value: 'draft', label: 'Drafts' },
          ].map(t => (
            <button
              key={t.value}
              className={`my-projects__tab ${filter === t.value ? 'active' : ''}`}
              onClick={() => setFilter(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="my-projects__empty">
            <div className="my-projects__empty-icon">📋</div>
            <h3>No projects {filter !== 'all' ? `with status "${filter}"` : 'yet'}</h3>
            <p>Create a new project to get started with AI-powered construction planning.</p>
            {user?.role === 'customer' && (
              <Link to="/projects/new" className="btn-form btn-form--primary" style={{ marginTop: '16px' }}>
                🚀 Start a Project
              </Link>
            )}
          </div>
        ) : (
          <div className="my-projects__list">
            {filtered.map((project) => (
              <div key={project._id} className="my-projects__card" onClick={() => navigate(`/projects/${project._id}`)} style={{ cursor: 'pointer' }}>
                <div className="my-projects__card-top">
                  <div className="my-projects__card-icon">
                    {project.projectType === 'residential' ? '🏠' : project.projectType === 'commercial' ? '🏢' : '🏗️'}
                  </div>
                  <div className="my-projects__card-info">
                    <h3>{project.title || 'Untitled Project'}</h3>
                    <p>
                      {project.projectType?.charAt(0).toUpperCase() + project.projectType?.slice(1)}
                      {project.location?.city && ` • ${project.location.city}`}
                    </p>
                  </div>
                  <span className="my-projects__card-status" style={{ '--status-color': getStatusColor(project.status) }}>
                    {getStatusLabel(project.status)}
                  </span>
                </div>

                {project.description && (
                  <p className="my-projects__card-desc">{project.description.slice(0, 150)}...</p>
                )}

                <div className="my-projects__card-meta">
                  {project.estimatedCost && (
                    <span className="my-projects__card-cost">
                      💰 {formatPKR(project.estimatedCost.min)} — {formatPKR(project.estimatedCost.max)}
                    </span>
                  )}
                  {(project.requirements?.floors ?? project.nlpParsedRequirements?.floors) > 0 && <span>🏢 {project.requirements?.floors ?? project.nlpParsedRequirements?.floors} floors</span>}
                  {(project.requirements?.rooms ?? project.nlpParsedRequirements?.bedrooms) > 0 && <span>🛏️ {project.requirements?.rooms ?? project.nlpParsedRequirements?.bedrooms} rooms</span>}
                  {(project.requirements?.style || project.nlpParsedRequirements?.style) ? <span>✨ {project.requirements?.style || project.nlpParsedRequirements?.style}</span> : null}
                  <span>📅 {new Date(project.createdAt).toLocaleDateString()}</span>
                  {project.applications?.length > 0 && (
                    <span className="my-projects__card-apps">📩 {project.applications.length} application{project.applications.length !== 1 ? 's' : ''}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyProjects;
