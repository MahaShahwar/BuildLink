import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getEngineerRequests, respondToProject } from '../services/api';
import './MyRequests.css';

const MyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [responding, setResponding] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await getEngineerRequests();
      if (res.data.success) setRequests(res.data.data);
    } catch { setRequests([]); }
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleRespond = async (projectId, action) => {
    setResponding(projectId + action);
    try {
      const res = await respondToProject(projectId, { action });
      if (res.data.success) {
        toast.success(action === 'accept' ? '✅ Project accepted!' : '❌ Project declined');
        fetchRequests();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to respond');
    }
    setResponding(null);
  };

  const formatPKR = (n) => n ? `PKR ${new Intl.NumberFormat('en-PK').format(n)}` : 'N/A';

  const getStatus = (item) => item.applicationStatus || 'pending';

  const filtered = filter === 'all' ? requests :
    requests.filter(r => getStatus(r) === filter);

  const statusColors = { pending: '#f59e0b', accepted: '#10b981', declined: '#ef4444' };

  return (
    <div className="my-requests">
      <div className="my-requests__container">
        <div className="my-requests__header">
          <h1>My Requests</h1>
          <p>Projects where customers have invited you or you've applied</p>
        </div>

        <div className="my-requests__tabs">
          {['all', 'pending', 'accepted', 'declined'].map(tab => (
            <button key={tab}
              className={`my-requests__tab ${filter === tab ? 'my-requests__tab--active' : ''}`}
              onClick={() => setFilter(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'pending' && requests.filter(r => getStatus(r) === 'pending').length > 0 && <span className="my-requests__badge">{requests.filter(r => getStatus(r) === 'pending').length}</span>}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="my-requests__loading"><span className="spinner"></span> Loading requests...</div>
        ) : filtered.length === 0 ? (
          <div className="my-requests__empty">
            <div className="my-requests__empty-icon">📋</div>
            <h3>No {filter !== 'all' ? filter : ''} requests</h3>
            <p>When customers invite you to their projects or you apply, they'll appear here.</p>
          </div>
        ) : (
          <div className="my-requests__list">
            {filtered.map(item => {
              const project = item.project;
              const status = getStatus(item);
              return (
                <div key={project._id} className="request-card">
                  <div className="request-card__top">
                    <div className="request-card__type">
                      {project.projectType === 'residential' ? '🏠' : project.projectType === 'commercial' ? '🏢' : '🏭'}
                      <span>{project.projectType?.charAt(0).toUpperCase() + project.projectType?.slice(1)}</span>
                    </div>
                    <span className="request-card__status" style={{ background: `${statusColors[status]}20`, color: statusColors[status] }}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  </div>

                  <h3 className="request-card__title">{project.title}</h3>
                  <p className="request-card__desc">{project.description?.slice(0, 150)}{project.description?.length > 150 ? '...' : ''}</p>

                  <div className="request-card__meta">
                    {project.location?.city && <span>📍 {project.location.city}</span>}
                    <span>💰 {project.budget?.min ? formatPKR(project.budget.min) : 'N/A'} — {project.budget?.max ? formatPKR(project.budget.max) : 'N/A'}</span>
                    {project.customer && <span>👤 {project.customer.firstName} {project.customer.lastName}</span>}
                  </div>

                  {status === 'pending' && (
                    <div className="request-card__actions">
                      <button className="request-card__accept"
                        disabled={responding === project._id + 'accept'}
                        onClick={() => handleRespond(project._id, 'accept')}>
                        {responding === project._id + 'accept' ? '...' : '✅ Accept'}
                      </button>
                      <button className="request-card__decline"
                        disabled={responding === project._id + 'decline'}
                        onClick={() => handleRespond(project._id, 'decline')}>
                        {responding === project._id + 'decline' ? '...' : '❌ Decline'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyRequests;
