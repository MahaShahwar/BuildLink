import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  getAdminStats, getAdminUsers, toggleUserActive, deleteUser,
  getAdminEngineers, verifyEngineer, getAdminProjects, deleteProject,
} from '../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', role: '', status: '', engStatus: '' });
  const [pagination, setPagination] = useState({});
  const [acting, setActing] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchStats();
  }, [user]);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'engineers') fetchEngineers();
    if (activeTab === 'projects') fetchProjects();
  }, [activeTab, filters]);

  const fetchStats = async () => {
    try {
      const res = await getAdminStats();
      if (res.data.success) setStats(res.data.data);
    } catch (err) { toast.error('Failed to load stats'); }
    setLoading(false);
  };

  const fetchUsers = async () => {
    try {
      const res = await getAdminUsers({ search: filters.search, role: filters.role });
      if (res.data.success) { setUsers(res.data.data); setPagination(res.data.pagination); }
    } catch { toast.error('Failed to load users'); }
  };

  const fetchEngineers = async () => {
    try {
      const res = await getAdminEngineers({ search: filters.search, status: filters.engStatus });
      if (res.data.success) { setEngineers(res.data.data); }
    } catch { toast.error('Failed to load engineers'); }
  };

  const fetchProjects = async () => {
    try {
      const res = await getAdminProjects({ search: filters.search, status: filters.status });
      if (res.data.success) { setProjects(res.data.data); }
    } catch { toast.error('Failed to load projects'); }
  };

  const handleToggleActive = async (id) => {
    setActing(id);
    try {
      const res = await toggleUserActive(id);
      if (res.data.success) { toast.success(res.data.message); fetchUsers(); }
    } catch { toast.error('Failed'); }
    setActing(null);
  };

  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    setActing(id);
    try {
      const res = await deleteUser(id);
      if (res.data.success) { toast.success('User deleted'); fetchUsers(); }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    setActing(null);
  };

  const handleVerify = async (id, status) => {
    setActing(id + status);
    try {
      const res = await verifyEngineer(id, status);
      if (res.data.success) { toast.success(`Engineer ${status}`); fetchEngineers(); if (activeTab === 'overview') fetchStats(); }
    } catch { toast.error('Failed'); }
    setActing(null);
  };

  const handleDeleteProject = async (id, title) => {
    if (!window.confirm(`Delete project "${title}"?`)) return;
    setActing(id);
    try {
      const res = await deleteProject(id);
      if (res.data.success) { toast.success('Project deleted'); fetchProjects(); }
    } catch { toast.error('Failed'); }
    setActing(null);
  };

  const formatPKR = (n) => n ? `PKR ${new Intl.NumberFormat('en-PK').format(n)}` : '—';

  if (!user || user.role !== 'admin') return null;
  if (loading) return <div className="admin"><div className="admin__loading"><span className="spinner"></span> Loading admin panel...</div></div>;

  const tabs = [
    { id: 'overview', label: '📊 Overview', icon: '📊' },
    { id: 'users', label: '👥 Users', icon: '👥' },
    { id: 'engineers', label: '🔧 Engineers', icon: '🔧' },
    { id: 'projects', label: '🏗️ Projects', icon: '🏗️' },
  ];

  const statusColors = {
    draft: '#94a3b8', posted: '#3b82f6', matched: '#8b5cf6',
    in_progress: '#f59e0b', review: '#f97316', completed: '#10b981',
    cancelled: '#ef4444',
  };

  return (
    <div className="admin">
      <div className="admin__container">
        {/* Header */}
        <div className="admin__header">
          <div>
            <h1>Admin Panel</h1>
            <p>Manage BuildLink platform</p>
          </div>
          <div className="admin__user-badge">
            <div className="admin__user-avatar">🛡️</div>
            <span>{user.firstName} {user.lastName}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="admin__tabs">
          {tabs.map(tab => (
            <button key={tab.id}
              className={`admin__tab ${activeTab === tab.id ? 'admin__tab--active' : ''}`}
              onClick={() => { setActiveTab(tab.id); setFilters({ search: '', role: '', status: '', engStatus: '' }); }}>
              {tab.label}
              {tab.id === 'engineers' && stats?.engineers?.pendingVerifications > 0 && (
                <span className="admin__tab-badge">{stats.engineers.pendingVerifications}</span>
              )}
            </button>
          ))}
        </div>

        {/* ============ OVERVIEW ============ */}
        {activeTab === 'overview' && stats && (
          <>
            <div className="admin__stats-grid">
              <div className="admin__stat-card admin__stat-card--blue">
                <div className="admin__stat-icon">👥</div>
                <div className="admin__stat-number">{stats.users.total}</div>
                <div className="admin__stat-label">Total Users</div>
                <div className="admin__stat-sub">+{stats.users.recentSignups} this month</div>
              </div>
              <div className="admin__stat-card admin__stat-card--cyan">
                <div className="admin__stat-icon">🏠</div>
                <div className="admin__stat-number">{stats.users.customers}</div>
                <div className="admin__stat-label">Customers</div>
              </div>
              <div className="admin__stat-card admin__stat-card--purple">
                <div className="admin__stat-icon">🔧</div>
                <div className="admin__stat-number">{stats.users.engineers}</div>
                <div className="admin__stat-label">Engineers</div>
                <div className="admin__stat-sub">{stats.engineers.verified} verified</div>
              </div>
              <div className="admin__stat-card admin__stat-card--amber">
                <div className="admin__stat-icon">🏗️</div>
                <div className="admin__stat-number">{stats.projects.total}</div>
                <div className="admin__stat-label">Total Projects</div>
                <div className="admin__stat-sub">{stats.projects.active} active</div>
              </div>
            </div>

            <div className="admin__grid-2">
              {/* Projects by Status */}
              <div className="admin__card">
                <h3>📈 Projects by Status</h3>
                <div className="admin__status-list">
                  {Object.entries(stats.projects.byStatus || {}).map(([status, count]) => (
                    <div key={status} className="admin__status-row">
                      <span className="admin__status-dot" style={{ background: statusColors[status] || '#94a3b8' }}></span>
                      <span className="admin__status-name">{status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                      <span className="admin__status-count">{count}</span>
                    </div>
                  ))}
                  {Object.keys(stats.projects.byStatus || {}).length === 0 && (
                    <p className="admin__empty-text">No projects yet</p>
                  )}
                </div>
              </div>

              {/* Pending Verifications */}
              <div className="admin__card">
                <h3>⏳ Pending Verifications</h3>
                {stats.engineers.pendingVerifications > 0 ? (
                  <div className="admin__pending-alert">
                    <span className="admin__pending-count">{stats.engineers.pendingVerifications}</span>
                    <p>engineers awaiting verification</p>
                    <button className="admin__btn admin__btn--primary"
                      onClick={() => { setActiveTab('engineers'); setFilters(f => ({ ...f, engStatus: 'pending' })); }}>
                      Review Now →
                    </button>
                  </div>
                ) : (
                  <div className="admin__all-clear">
                    <span>✅</span>
                    <p>All engineers verified — no pending reviews</p>
                  </div>
                )}
              </div>
            </div>

            {/* Revenue */}
            {(stats.revenue.totalMin > 0 || stats.revenue.totalMax > 0) && (
              <div className="admin__card">
                <h3>💰 Platform Revenue Potential</h3>
                <p className="admin__revenue">{formatPKR(stats.revenue.totalMin)} — {formatPKR(stats.revenue.totalMax)}</p>
                <p className="admin__revenue-sub">Total estimated project value across {stats.projects.total} projects</p>
              </div>
            )}
          </>
        )}

        {/* ============ USERS ============ */}
        {activeTab === 'users' && (
          <>
            <div className="admin__toolbar">
              <input type="text" placeholder="Search by name or email..." className="admin__search"
                value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
              <select className="admin__filter" value={filters.role}
                onChange={e => setFilters(f => ({ ...f, role: e.target.value }))}>
                <option value="">All Roles</option>
                <option value="customer">Customers</option>
                <option value="engineer">Engineers</option>
                <option value="architect">Architects</option>
                <option value="admin">Admins</option>
              </select>
            </div>

            <div className="admin__table-wrapper">
              <table className="admin__table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id} className={!u.isActive ? 'admin__row--inactive' : ''}>
                      <td>
                        <div className="admin__user-cell">
                          <div className="admin__table-avatar">{u.firstName?.charAt(0)}</div>
                          <span>{u.firstName} {u.lastName}</span>
                        </div>
                      </td>
                      <td>{u.email}</td>
                      <td><span className={`admin__role-badge admin__role-badge--${u.role}`}>{u.role}</span></td>
                      <td>{u.phone}</td>
                      <td>
                        <span className={`admin__active-badge ${u.isActive ? 'admin__active-badge--yes' : 'admin__active-badge--no'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="admin__actions">
                          <button className={`admin__btn admin__btn--sm ${u.isActive ? 'admin__btn--warning' : 'admin__btn--success'}`}
                            disabled={acting === u._id || u.role === 'admin'}
                            onClick={() => handleToggleActive(u._id)}>
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button className="admin__btn admin__btn--sm admin__btn--danger"
                            disabled={acting === u._id || u.role === 'admin'}
                            onClick={() => handleDeleteUser(u._id, `${u.firstName} ${u.lastName}`)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan="7" className="admin__empty-cell">No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ============ ENGINEERS ============ */}
        {activeTab === 'engineers' && (
          <>
            <div className="admin__toolbar">
              <input type="text" placeholder="Search engineers..." className="admin__search"
                value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
              <select className="admin__filter" value={filters.engStatus}
                onChange={e => setFilters(f => ({ ...f, engStatus: e.target.value }))}>
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="admin__engineers-grid">
              {engineers.map(eng => (
                <div key={eng._id} className={`admin__eng-card admin__eng-card--${eng.verificationStatus}`}>
                  <div className="admin__eng-header">
                    <div className="admin__eng-avatar">{eng.user?.firstName?.charAt(0) || '?'}</div>
                    <div className="admin__eng-info">
                      <h4>{eng.user?.firstName} {eng.user?.lastName}</h4>
                      <p>{eng.user?.email}</p>
                    </div>
                    <span className={`admin__verification-badge admin__verification-badge--${eng.verificationStatus}`}>
                      {eng.verificationStatus === 'pending' && '⏳ Pending'}
                      {eng.verificationStatus === 'verified' && '✅ Verified'}
                      {eng.verificationStatus === 'rejected' && '❌ Rejected'}
                    </span>
                  </div>

                  <div className="admin__eng-details">
                    <div className="admin__eng-detail">
                      <span>Specialization</span>
                      <strong>{eng.specialization?.replace(/_/g, ' ')}</strong>
                    </div>
                    <div className="admin__eng-detail">
                      <span>Experience</span>
                      <strong>{eng.yearsOfExperience} years</strong>
                    </div>
                    <div className="admin__eng-detail">
                      <span>Location</span>
                      <strong>{eng.city}, {eng.state}</strong>
                    </div>
                    <div className="admin__eng-detail">
                      <span>License #</span>
                      <strong>{eng.licenseNumber}</strong>
                    </div>
                    <div className="admin__eng-detail">
                      <span>Rating</span>
                      <strong>⭐ {eng.rating || 0} ({eng.reviewCount || 0} reviews)</strong>
                    </div>
                    <div className="admin__eng-detail">
                      <span>Projects</span>
                      <strong>{eng.completedProjects || 0} completed</strong>
                    </div>
                  </div>

                  {eng.bio && <p className="admin__eng-bio">"{eng.bio}"</p>}

                  {eng.softwareProficiency?.length > 0 && (
                    <div className="admin__eng-skills">
                      {eng.softwareProficiency.map(s => <span key={s} className="admin__skill-tag">{s}</span>)}
                    </div>
                  )}

                  {eng.verificationStatus === 'pending' && (
                    <div className="admin__eng-actions">
                      <button className="admin__btn admin__btn--success"
                        disabled={acting === eng._id + 'verified'}
                        onClick={() => handleVerify(eng._id, 'verified')}>
                        ✅ Verify
                      </button>
                      <button className="admin__btn admin__btn--danger"
                        disabled={acting === eng._id + 'rejected'}
                        onClick={() => handleVerify(eng._id, 'rejected')}>
                        ❌ Reject
                      </button>
                    </div>
                  )}

                  {eng.verifiedAt && (
                    <p className="admin__eng-verified-info">
                      {eng.verificationStatus === 'verified' ? '✅' : '❌'} {eng.verificationStatus} on {new Date(eng.verifiedAt).toLocaleDateString()}
                      {eng.verifiedBy && ` by ${eng.verifiedBy.firstName} ${eng.verifiedBy.lastName}`}
                    </p>
                  )}
                </div>
              ))}
              {engineers.length === 0 && (
                <div className="admin__empty-state">
                  <span>🔧</span>
                  <p>No engineers found</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ============ PROJECTS ============ */}
        {activeTab === 'projects' && (
          <>
            <div className="admin__toolbar">
              <input type="text" placeholder="Search projects..." className="admin__search"
                value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
              <select className="admin__filter" value={filters.status}
                onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="posted">Posted</option>
                <option value="matched">Matched</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="admin__table-wrapper">
              <table className="admin__table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Customer</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Estimate</th>
                    <th>Engineer</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map(p => (
                    <tr key={p._id}>
                      <td>
                        <div className="admin__project-title">{p.title}</div>
                        <div className="admin__project-location">{p.location?.city || '—'}</div>
                      </td>
                      <td>{p.customer?.firstName} {p.customer?.lastName}</td>
                      <td>{p.projectType}</td>
                      <td>
                        <span className="admin__status-badge" style={{ '--sc': statusColors[p.status] || '#94a3b8' }}>
                          {p.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        {p.estimatedCost ? `${formatPKR(p.estimatedCost.min)}` : '—'}
                      </td>
                      <td>{p.assignedEngineer?.user ? `${p.assignedEngineer.user.firstName} ${p.assignedEngineer.user.lastName}` : '—'}</td>
                      <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="admin__actions">
                          <button className="admin__btn admin__btn--sm admin__btn--primary"
                            onClick={() => navigate(`/projects/${p._id}`)}>View</button>
                          <button className="admin__btn admin__btn--sm admin__btn--danger"
                            disabled={acting === p._id}
                            onClick={() => handleDeleteProject(p._id, p.title)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {projects.length === 0 && (
                    <tr><td colSpan="8" className="admin__empty-cell">No projects found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
