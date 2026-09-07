import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { getEngineerStats, getActiveProjects, getEngineerRequests, getMyProjects } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, draft: 0 });
  const [engStats, setEngStats] = useState(null);
  const [engActiveProjects, setEngActiveProjects] = useState([]);
  const [engRequests, setEngRequests] = useState([]);

  useEffect(() => {
    if (!user) return;

    if (user.role === 'customer') {
      getMyProjects().then(res => {
        if (res.data.success) {
          const data = res.data.data;
          setProjects(data);
          setStats({
            total: data.length,
            active: data.filter(p => ['posted', 'matched', 'in_progress', 'review'].includes(p.status)).length,
            completed: data.filter(p => p.status === 'completed').length,
            draft: data.filter(p => p.status === 'draft').length,
          });
        }
      }).catch(() => {});
    }

    if (user.role === 'engineer' || user.role === 'architect') {
      getEngineerStats().then(res => {
        if (res.data.success) setEngStats(res.data.data);
      }).catch(() => {});

      getActiveProjects().then(res => {
        if (res.data.success) setEngActiveProjects(res.data.data);
      }).catch(() => {});

      getEngineerRequests().then(res => {
        if (res.data.success) setEngRequests(res.data.data.filter(r => r.applicationStatus === 'pending'));
      }).catch(() => {});
    }
  }, [user]);

  if (!user) {
    return (
      <div className="dashboard" style={{ paddingTop: '120px', textAlign: 'center' }}>
        <h2>Please log in to access the dashboard</h2>
        <button className="btn-form btn-form--primary" style={{ marginTop: '20px' }}
          onClick={() => navigate('/login')}>Log In</button>
      </div>
    );
  }

  const isCustomer = user.role === 'customer';
  const isEngineer = user.role === 'engineer' || user.role === 'architect';

  const getStatusColor = (status) => {
    const colors = {
      draft: '#94a3b8', posted: '#3b82f6', matched: '#8b5cf6',
      in_progress: '#f59e0b', review: '#f97316', completed: '#10b981',
      cancelled: '#ef4444', disputed: '#ef4444',
    };
    return colors[status] || '#94a3b8';
  };

  const getStatusLabel = (status) => {
    const labels = {
      draft: 'Draft', posted: 'Open', matched: 'Matched',
      in_progress: 'In Progress', review: 'Under Review', completed: 'Completed',
      cancelled: 'Cancelled', disputed: 'Disputed',
    };
    return labels[status] || status;
  };

  const formatPKR = (n) => n ? `PKR ${new Intl.NumberFormat('en-PK').format(n)}` : 'N/A';

  return (
    <div className="dashboard">
      <div className="dashboard__container">
        {/* Welcome */}
        <div className="dashboard__welcome">
          <div className="dashboard__avatar">
            {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
          </div>
          <div>
            <h1 className="dashboard__title">Welcome back, {user.firstName}! 👋</h1>
            <p className="dashboard__role">
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Account
              {isEngineer && profile && (
                <span className={`dashboard__verification-inline dashboard__verification-inline--${profile.verificationStatus}`}>
                  {profile.verificationStatus === 'pending' && '⏳ Pending Verification'}
                  {profile.verificationStatus === 'verified' && '✅ Verified'}
                  {profile.verificationStatus === 'rejected' && '❌ Rejected'}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* ============ CUSTOMER DASHBOARD ============ */}
        {isCustomer && (
          <>
            <div className="dashboard__quick-actions">
              <Link to="/projects/new" className="dashboard__action-card dashboard__action-card--primary">
                <div className="dashboard__action-icon">🚀</div>
                <div>
                  <h3>Start New Project</h3>
                  <p>Describe your dream build and get AI estimates</p>
                </div>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <Link to="/find-engineers" className="dashboard__action-card">
                <div className="dashboard__action-icon">🔍</div>
                <div>
                  <h3>Find Engineers</h3>
                  <p>Browse AI-matched professionals</p>
                </div>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <Link to="/projects/new" className="dashboard__action-card">
                <div className="dashboard__action-icon">🤖</div>
                <div>
                  <h3>AI Cost Estimator</h3>
                  <p>Get instant cost breakdowns</p>
                </div>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
            </div>

            <div className="dashboard__stats-row">
              <div className="dashboard__stat-card">
                <div className="dashboard__stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}>📊</div>
                <div>
                  <p className="dashboard__stat-value">{stats.total}</p>
                  <p className="dashboard__stat-label">Total Projects</p>
                </div>
              </div>
              <div className="dashboard__stat-card">
                <div className="dashboard__stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>⚡</div>
                <div>
                  <p className="dashboard__stat-value">{stats.active}</p>
                  <p className="dashboard__stat-label">Active</p>
                </div>
              </div>
              <div className="dashboard__stat-card">
                <div className="dashboard__stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>✅</div>
                <div>
                  <p className="dashboard__stat-value">{stats.completed}</p>
                  <p className="dashboard__stat-label">Completed</p>
                </div>
              </div>
              <div className="dashboard__stat-card">
                <div className="dashboard__stat-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>📝</div>
                <div>
                  <p className="dashboard__stat-value">{stats.draft}</p>
                  <p className="dashboard__stat-label">Drafts</p>
                </div>
              </div>
            </div>

            {/* Recent Projects */}
            <div className="dashboard__section">
              <div className="dashboard__section-header">
                <h2>Recent Projects</h2>
                {projects.length > 0 && <Link to="/my-projects" className="dashboard__see-all">See All →</Link>}
              </div>

              {projects.length === 0 ? (
                <div className="dashboard__empty">
                  <div className="dashboard__empty-icon">🏠</div>
                  <h3>No projects yet</h3>
                  <p>Start your first project and get AI-powered cost estimates with matched engineers.</p>
                  <Link to="/projects/new" className="btn-form btn-form--primary" style={{ marginTop: '16px' }}>
                    🚀 Start Your First Project
                  </Link>
                </div>
              ) : (
                <div className="dashboard__projects-list">
                  {projects.slice(0, 5).map((project, i) => (
                    <div key={i} className="dashboard__project-card" onClick={() => navigate(`/projects/${project._id}`)} style={{ cursor: 'pointer' }}>
                      <div className="dashboard__project-main">
                        <div className="dashboard__project-type-icon">
                          {project.projectType === 'residential' ? '🏠' : project.projectType === 'commercial' ? '🏢' : '🏗️'}
                        </div>
                        <div className="dashboard__project-info">
                          <h3>{project.title}</h3>
                          <p className="dashboard__project-meta">
                            {project.projectType?.charAt(0).toUpperCase() + project.projectType?.slice(1)}
                            {project.location?.city && ` • ${project.location.city}`}
                            {project.createdAt && ` • ${new Date(project.createdAt).toLocaleDateString()}`}
                          </p>
                        </div>
                      </div>
                      <div className="dashboard__project-right">
                        {project.estimatedCost && (
                          <span className="dashboard__project-cost">
                            {formatPKR(project.estimatedCost.min)} - {formatPKR(project.estimatedCost.max)}
                          </span>
                        )}
                        <span className="dashboard__project-status" style={{ '--status-color': getStatusColor(project.status) }}>
                          {getStatusLabel(project.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ============ ENGINEER DASHBOARD ============ */}
        {isEngineer && (
          <>
            {/* Quick Actions */}
            <div className="dashboard__quick-actions">
              <Link to="/browse-projects" className="dashboard__action-card dashboard__action-card--primary">
                <div className="dashboard__action-icon">🔍</div>
                <div>
                  <h3>Browse Projects</h3>
                  <p>Find open projects matching your skills</p>
                </div>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <Link to="/my-requests" className="dashboard__action-card">
                <div className="dashboard__action-icon">📬</div>
                <div>
                  <h3>My Requests</h3>
                  <p>View project invitations & applications</p>
                </div>
                {engRequests.length > 0 && <span className="dashboard__action-badge">{engRequests.length}</span>}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <Link to="/engineer-profile" className="dashboard__action-card">
                <div className="dashboard__action-icon">👤</div>
                <div>
                  <h3>My Profile</h3>
                  <p>Update portfolio & availability</p>
                </div>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
            </div>

            {/* Verification Notice */}
            {profile?.verificationStatus === 'pending' && (
              <div className="dashboard__notice dashboard__notice--warning">
                <span>⏳</span>
                <p>Your profile is under review by our admin team. You'll be notified once verified and can start receiving AI-matched project requests and apply to open projects.</p>
              </div>
            )}

            {/* Stats */}
            <div className="dashboard__stats-row">
              <div className="dashboard__stat-card">
                <div className="dashboard__stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>⚡</div>
                <div>
                  <p className="dashboard__stat-value">{engStats?.activeProjects ?? 0}</p>
                  <p className="dashboard__stat-label">Active Projects</p>
                </div>
              </div>
              <div className="dashboard__stat-card">
                <div className="dashboard__stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>✅</div>
                <div>
                  <p className="dashboard__stat-value">{engStats?.completedProjects ?? 0}</p>
                  <p className="dashboard__stat-label">Completed</p>
                </div>
              </div>
              <div className="dashboard__stat-card">
                <div className="dashboard__stat-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>📬</div>
                <div>
                  <p className="dashboard__stat-value">{engStats?.pendingRequests ?? 0}</p>
                  <p className="dashboard__stat-label">Pending Requests</p>
                </div>
              </div>
              <div className="dashboard__stat-card">
                <div className="dashboard__stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}>🌐</div>
                <div>
                  <p className="dashboard__stat-value">{engStats?.availableProjects ?? 0}</p>
                  <p className="dashboard__stat-label">Open Projects</p>
                </div>
              </div>
            </div>

            {/* Earnings & Rating */}
            <div className="dashboard__stats-row dashboard__stats-row--2">
              <div className="dashboard__stat-card dashboard__stat-card--wide">
                <div className="dashboard__stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>💰</div>
                <div>
                  <p className="dashboard__stat-value">{formatPKR(engStats?.totalEarnings ?? 0)}</p>
                  <p className="dashboard__stat-label">Total Earnings</p>
                </div>
              </div>
              <div className="dashboard__stat-card dashboard__stat-card--wide">
                <div className="dashboard__stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>⭐</div>
                <div>
                  <p className="dashboard__stat-value">
                    {engStats?.rating ? `${engStats.rating.toFixed(1)} / 5.0` : 'N/A'}
                    {engStats?.reviewCount > 0 && <span className="dashboard__review-count">({engStats.reviewCount} reviews)</span>}
                  </p>
                  <p className="dashboard__stat-label">Client Rating</p>
                </div>
              </div>
            </div>

            {/* Active Projects */}
            <div className="dashboard__section">
              <div className="dashboard__section-header">
                <h2>Active Projects</h2>
              </div>

              {engActiveProjects.length === 0 ? (
                <div className="dashboard__empty">
                  <div className="dashboard__empty-icon">📋</div>
                  <h3>No active projects</h3>
                  <p>Browse open projects and apply, or wait for AI-matched invitations from customers.</p>
                  <Link to="/browse-projects" className="btn-form btn-form--primary" style={{ marginTop: '16px' }}>
                    🔍 Browse Projects
                  </Link>
                </div>
              ) : (
                <div className="dashboard__projects-list">
                  {engActiveProjects.map((project, i) => (
                    <div key={i} className="dashboard__project-card" onClick={() => navigate(`/projects/${project._id}`)} style={{ cursor: 'pointer' }}>
                      <div className="dashboard__project-main">
                        <div className="dashboard__project-type-icon">
                          {project.projectType === 'residential' ? '🏠' : project.projectType === 'commercial' ? '🏢' : '🏗️'}
                        </div>
                        <div className="dashboard__project-info">
                          <h3>{project.title}</h3>
                          <p className="dashboard__project-meta">
                            {project.projectType?.charAt(0).toUpperCase() + project.projectType?.slice(1)}
                            {project.location?.city && ` • ${project.location.city}`}
                            {project.customer && ` • Client: ${project.customer.firstName} ${project.customer.lastName}`}
                          </p>
                        </div>
                      </div>
                      <div className="dashboard__project-right">
                        <span className="dashboard__project-status" style={{ '--status-color': getStatusColor(project.status) }}>
                          {getStatusLabel(project.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending Requests */}
            {engRequests.length > 0 && (
              <div className="dashboard__section">
                <div className="dashboard__section-header">
                  <h2>Pending Requests</h2>
                  <Link to="/my-requests" className="dashboard__see-all">View All →</Link>
                </div>
                <div className="dashboard__projects-list">
                  {engRequests.slice(0, 3).map((req, i) => (
                    <div key={i} className="dashboard__project-card">
                      <div className="dashboard__project-main">
                        <div className="dashboard__project-type-icon">📬</div>
                        <div className="dashboard__project-info">
                          <h3>{req.project.title}</h3>
                          <p className="dashboard__project-meta">
                            {req.project.projectType} • {req.project.location?.city || 'Remote'}
                          </p>
                        </div>
                      </div>
                      <div className="dashboard__project-right">
                        <span className="dashboard__project-status" style={{ '--status-color': '#f59e0b' }}>
                          Pending
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
