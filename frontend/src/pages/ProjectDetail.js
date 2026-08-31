import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { getProject, updateProjectStatus, selectEngineer } from '../services/api';
import './ProjectDetail.css';

const ProjectDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  const fetchProject = async () => {
    setLoading(true);
    try {
      const res = await getProject(id);
      if (res.data.success) setProject(res.data.data);
    } catch { toast.error('Failed to load project'); }
    setLoading(false);
  };

  useEffect(() => { fetchProject(); }, [id]);

  const handlePostDraft = async () => {
    setActing('post');
    try {
      const res = await updateProjectStatus(id, 'posted');
      if (res.data.success) { toast.success('🚀 Project posted!'); fetchProject(); }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    setActing(null);
  };

  const handleSelectEngineer = async (applicationId) => {
    setActing(applicationId);
    try {
      const res = await selectEngineer(id, applicationId);
      if (res.data.success) { toast.success('✅ Engineer selected!'); fetchProject(); }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    setActing(null);
  };

  const formatPKR = (n) => n ? `PKR ${new Intl.NumberFormat('en-PK').format(n)}` : 'N/A';

  const statusConfig = {
    draft: { color: '#94a3b8', label: 'Draft', icon: '📝' },
    posted: { color: '#3b82f6', label: 'Open for Applications', icon: '📢' },
    matched: { color: '#8b5cf6', label: 'Matched', icon: '🤝' },
    in_progress: { color: '#f59e0b', label: 'In Progress', icon: '🔨' },
    review: { color: '#f97316', label: 'Under Review', icon: '🔍' },
    completed: { color: '#10b981', label: 'Completed', icon: '✅' },
    cancelled: { color: '#ef4444', label: 'Cancelled', icon: '❌' },
  };

  if (loading) return <div className="project-detail"><div className="project-detail__loading"><span className="spinner"></span> Loading...</div></div>;
  if (!project) return <div className="project-detail"><div className="project-detail__loading">Project not found</div></div>;

  const sc = statusConfig[project.status] || statusConfig.draft;
  const isOwner = user && (user.id === project.customer?._id || user._id === project.customer?._id);
  const applications = project.applications || [];
  const pendingApps = applications.filter(a => a.status === 'pending');
  const acceptedApp = applications.find(a => a.status === 'accepted');

  return (
    <div className="project-detail">
      <div className="project-detail__container">
        {/* Back button */}
        <button className="project-detail__back" onClick={() => navigate(-1)}>← Back</button>

        {/* Status Banner */}
        <div className="pd-status-banner" style={{ '--status-color': sc.color }}>
          <span className="pd-status-banner__icon">{sc.icon}</span>
          <span className="pd-status-banner__label">{sc.label}</span>
          {project.status === 'draft' && isOwner && (
            <button className="pd-status-banner__action" onClick={handlePostDraft} disabled={acting === 'post'}>
              {acting === 'post' ? 'Posting...' : '🚀 Post Project'}
            </button>
          )}
        </div>

        {/* Project Info */}
        <div className="pd-card">
          <div className="pd-card__top">
            <span className="pd-card__type">
              {project.projectType === 'residential' ? '🏠' : project.projectType === 'commercial' ? '🏢' : '🏗️'}
              {project.projectType?.charAt(0).toUpperCase() + project.projectType?.slice(1)}
            </span>
            <span className="pd-card__date">Created {new Date(project.createdAt).toLocaleDateString()}</span>
          </div>
          <h1 className="pd-card__title">{project.title}</h1>
          <p className="pd-card__desc">{project.description}</p>

          <div className="pd-card__tags">
            {project.location?.city && <span className="tag">📍 {project.location.city}</span>}
            {project.nlpParsedRequirements?.floors && <span className="tag">🏢 {project.nlpParsedRequirements.floors} floors</span>}
            {project.nlpParsedRequirements?.bedrooms && <span className="tag">🛏️ {project.nlpParsedRequirements.bedrooms} beds</span>}
            {project.nlpParsedRequirements?.bathrooms && <span className="tag">🛁 {project.nlpParsedRequirements.bathrooms} baths</span>}
            {project.nlpParsedRequirements?.style && <span className="tag">✨ {project.nlpParsedRequirements.style}</span>}
            {project.nlpParsedRequirements?.specialFeatures?.map(f => (
              <span key={f} className="tag tag--accent">⭐ {f}</span>
            ))}
          </div>
        </div>

        {/* Budget & Cost */}
        <div className="pd-grid">
          <div className="pd-card pd-card--sm">
            <h3>💰 Budget</h3>
            <p className="pd-card__amount">{formatPKR(project.budget?.min)} — {formatPKR(project.budget?.max)}</p>
          </div>
          {project.estimatedCost && (
            <div className="pd-card pd-card--sm">
              <h3>🤖 AI Estimate</h3>
              <p className="pd-card__amount">{formatPKR(project.estimatedCost.min)} — {formatPKR(project.estimatedCost.max)}</p>
              {project.estimatedCost.confidence && (
                <p className="pd-card__sub">Confidence: {Math.round(project.estimatedCost.confidence * 100)}%</p>
              )}
            </div>
          )}
        </div>

        {/* AI Cost Breakdown */}
        {project.estimatedCost?.breakdown && (
          <div className="pd-card">
            <h3>📊 Cost Breakdown</h3>
            <div className="pd-breakdown">
              {Object.entries(project.estimatedCost.breakdown).map(([key, val]) => val ? (
                <div key={key} className="pd-breakdown__item">
                  <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                  <span>{formatPKR(val)}</span>
                </div>
              ) : null)}
            </div>
          </div>
        )}

        {/* Assigned Engineer */}
        {acceptedApp && (
          <div className="pd-card pd-card--success">
            <h3>✅ Assigned Engineer</h3>
            <div className="pd-engineer">
              <div className="pd-engineer__avatar">
                {acceptedApp.engineer?.user?.firstName?.charAt(0) || '?'}
              </div>
              <div className="pd-engineer__info">
                <strong>{acceptedApp.engineer?.user?.firstName} {acceptedApp.engineer?.user?.lastName}</strong>
                <span>{acceptedApp.engineer?.specialization?.replace(/_/g, ' ')}</span>
                <span>📍 {acceptedApp.engineer?.city} • ⭐ {acceptedApp.engineer?.rating || 0} • {acceptedApp.engineer?.yearsOfExperience || 0} yrs exp</span>
              </div>
            </div>
            {acceptedApp.coverLetter && <p className="pd-engineer__letter">"{acceptedApp.coverLetter}"</p>}
            <div className="pd-engineer__proposal">
              {acceptedApp.proposedBudget && <span>💰 Proposed: {formatPKR(acceptedApp.proposedBudget)}</span>}
              {acceptedApp.proposedTimeline && <span>📅 Timeline: {acceptedApp.proposedTimeline} days</span>}
            </div>
          </div>
        )}

        {/* Applications from Engineers */}
        {isOwner && applications.length > 0 && !acceptedApp && (
          <div className="pd-card">
            <h3>📩 Engineer Applications ({applications.length})</h3>
            <div className="pd-applications">
              {applications.map(app => (
                <div key={app._id} className="pd-application">
                  <div className="pd-application__header">
                    <div className="pd-engineer">
                      <div className="pd-engineer__avatar">
                        {app.engineer?.user?.firstName?.charAt(0) || '?'}
                      </div>
                      <div className="pd-engineer__info">
                        <strong>{app.engineer?.user?.firstName} {app.engineer?.user?.lastName}</strong>
                        <span>{app.engineer?.specialization?.replace(/_/g, ' ')}</span>
                        <span>📍 {app.engineer?.city} • ⭐ {app.engineer?.rating || 0} • {app.engineer?.yearsOfExperience || 0} yrs exp</span>
                      </div>
                    </div>
                    <span className={`pd-application__status pd-application__status--${app.status}`}>
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </span>
                  </div>

                  {app.coverLetter && <p className="pd-application__letter">"{app.coverLetter}"</p>}

                  <div className="pd-application__proposal">
                    {app.proposedBudget && <span>💰 {formatPKR(app.proposedBudget)}</span>}
                    {app.proposedTimeline && <span>📅 {app.proposedTimeline} days</span>}
                    <span>🕐 Applied {new Date(app.appliedAt).toLocaleDateString()}</span>
                  </div>

                  {app.status === 'pending' && isOwner && (
                    <button className="pd-application__select"
                      disabled={acting === app._id}
                      onClick={() => handleSelectEngineer(app._id)}>
                      {acting === app._id ? 'Selecting...' : '✅ Select This Engineer'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Floor Plan */}
        {isOwner && (
          <div className="pd-card">
            <h3>🏗️ Floor Plan & Design</h3>
            <p style={{ color: '#64748b', marginBottom: '12px' }}>
              {project.activeFloorPlan
                ? 'Your AI-generated floor plan is ready. Click below to view or amend it.'
                : 'Generate an AI floor plan based on your project requirements.'}
            </p>
            <button className="pd-application__select" style={{ width: 'auto', display: 'inline-block' }}
              onClick={() => navigate(`/projects/${id}/design`)}>
              {project.activeFloorPlan ? '📐 View / Edit Floor Plan' : '🤖 Generate Floor Plan'}
            </button>
          </div>
        )}

        {/* No applications yet */}
        {isOwner && project.status === 'posted' && applications.length === 0 && (
          <div className="pd-card pd-card--empty">
            <h3>📩 No Applications Yet</h3>
            <p>Your project is live — engineers can browse and apply. You'll see their proposals here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetail;
