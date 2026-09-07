import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { getAvailableProjects, applyToProject } from '../services/api';
import './BrowseProjects.css';

const BrowseProjects = () => {
  const { user, profile } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ projectType: '', city: '', sortBy: 'newest' });
  const [applyModal, setApplyModal] = useState(null);
  const [applyForm, setApplyForm] = useState({ coverLetter: '', proposedBudget: '', proposedTimeline: '' });
  const [applying, setApplying] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.projectType) params.projectType = filters.projectType;
      if (filters.city) params.city = filters.city;
      if (filters.sortBy) params.sortBy = filters.sortBy;

      const res = await getAvailableProjects(params);
      if (res.data.success) {
        setProjects(res.data.data);
        setTotal(res.data.total);
      }
    } catch {
      setProjects([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchProjects(); }, [filters]);

  const handleApply = async () => {
    if (!applyForm.coverLetter.trim()) return toast.error('Please write a cover letter');
    setApplying(true);
    try {
      const res = await applyToProject(applyModal._id, {
        coverLetter: applyForm.coverLetter,
        proposedBudget: applyForm.proposedBudget ? parseInt(applyForm.proposedBudget) : null,
        proposedTimeline: applyForm.proposedTimeline ? parseInt(applyForm.proposedTimeline) : null,
      });
      if (res.data.success) {
        toast.success('✅ Application submitted!');
        setApplyModal(null);
        setApplyForm({ coverLetter: '', proposedBudget: '', proposedTimeline: '' });
        fetchProjects();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply');
    }
    setApplying(false);
  };

  const formatPKR = (n) => n ? `PKR ${new Intl.NumberFormat('en-PK').format(n)}` : 'N/A';
  const timeAgo = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff} days ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="browse-projects">
      <div className="browse-projects__container">
        <div className="browse-projects__header">
          <div>
            <h1>Browse Open Projects</h1>
            <p>{total} project{total !== 1 ? 's' : ''} available</p>
          </div>
        </div>

        {/* Filters */}
        <div className="browse-projects__filters">
          <select value={filters.projectType} onChange={e => setFilters(prev => ({ ...prev, projectType: e.target.value }))}>
            <option value="">All Types</option>
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="industrial">Industrial</option>
            <option value="renovation">Renovation</option>
            <option value="interior">Interior</option>
          </select>
          <input type="text" placeholder="Filter by city..." value={filters.city}
            onChange={e => setFilters(prev => ({ ...prev, city: e.target.value }))} />
          <select value={filters.sortBy} onChange={e => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}>
            <option value="newest">Newest First</option>
            <option value="budget">Highest Budget</option>
          </select>
        </div>

        {/* Project List */}
        {loading ? (
          <div className="browse-projects__loading"><span className="spinner"></span> Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="browse-projects__empty">
            <div className="browse-projects__empty-icon">📭</div>
            <h3>No open projects right now</h3>
            <p>Check back soon — new projects are posted regularly by homeowners and businesses.</p>
          </div>
        ) : (
          <div className="browse-projects__list">
            {projects.map((project) => (
              <div key={project._id} className="browse-project-card">
                <div className="browse-project-card__top">
                  <div className="browse-project-card__type">
                    {project.projectType === 'residential' ? '🏠' : project.projectType === 'commercial' ? '🏢' : project.projectType === 'industrial' ? '🏭' : project.projectType === 'renovation' ? '🔨' : '🎨'}
                    <span>{project.projectType?.charAt(0).toUpperCase() + project.projectType?.slice(1)}</span>
                  </div>
                  <span className="browse-project-card__time">{timeAgo(project.createdAt)}</span>
                </div>

                <h3 className="browse-project-card__title">{project.title}</h3>
                <p className="browse-project-card__desc">{project.description?.slice(0, 200)}{project.description?.length > 200 ? '...' : ''}</p>

                <div className="browse-project-card__tags">
                  {project.location?.city && <span className="tag">📍 {project.location.city}</span>}
                  {(project.requirements?.floors ?? project.nlpParsedRequirements?.floors) > 0 && <span className="tag">🏢 {project.requirements?.floors ?? project.nlpParsedRequirements?.floors} floors</span>}
                  {(project.requirements?.rooms ?? project.nlpParsedRequirements?.bedrooms) > 0 && <span className="tag">🛏️ {project.requirements?.rooms ?? project.nlpParsedRequirements?.bedrooms} rooms</span>}
                  {(project.requirements?.bathrooms ?? project.nlpParsedRequirements?.bathrooms) > 0 && <span className="tag">🚿 {project.requirements?.bathrooms ?? project.nlpParsedRequirements?.bathrooms} baths</span>}
                  {(project.requirements?.style || project.nlpParsedRequirements?.style) ? <span className="tag">✨ {project.requirements?.style || project.nlpParsedRequirements?.style}</span> : null}
                  {project.requirements?.features?.map(f => (
                    <span key={f} className="tag tag--accent">⭐ {f.replace(/_/g, ' ')}</span>
                  ))}
                  {project.requirements?.customFeatures?.map((f, i) => (
                    <span key={`cf-${i}`} className="tag tag--accent">✏️ {f}</span>
                  ))}
                </div>

                <div className="browse-project-card__footer">
                  <div className="browse-project-card__budget">
                    {project.budget?.min || project.budget?.max ? (
                      <><span className="browse-project-card__budget-label">Budget:</span> {formatPKR(project.budget.min)} — {formatPKR(project.budget.max)}</>
                    ) : project.estimatedCost ? (
                      <><span className="browse-project-card__budget-label">AI Estimate:</span> {formatPKR(project.estimatedCost.min)} — {formatPKR(project.estimatedCost.max)}</>
                    ) : 'Budget not specified'}
                  </div>
                  {project.customer && (
                    <span className="browse-project-card__client">
                      👤 {project.customer.firstName} {project.customer.lastName}
                    </span>
                  )}
                </div>

                <div className="browse-project-card__actions">
                  {project.applications?.some(a => (a.engineer?._id || a.engineer) === (profile?._id || profile?.id)) ? (
                    <span className="browse-project-card__applied-badge">
                      ✅ Applied
                    </span>
                  ) : (
                    <button className="browse-project-card__apply-btn" onClick={() => setApplyModal(project)}>
                      📝 Apply to Project
                    </button>
                  )}
                  <span className="browse-project-card__applicants">
                    {project.applications?.length || 0} applicant{(project.applications?.length || 0) !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Apply Modal */}
      {applyModal && (
        <div className="modal-overlay" onClick={() => setApplyModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Apply to Project</h2>
              <button className="modal__close" onClick={() => setApplyModal(null)}>✕</button>
            </div>
            <p className="modal__project-title">{applyModal.title}</p>

            <div className="form-group">
              <label>Cover Letter <span className="required">*</span></label>
              <textarea
                value={applyForm.coverLetter}
                onChange={e => setApplyForm(prev => ({ ...prev, coverLetter: e.target.value }))}
                placeholder="Explain why you're the right fit for this project. Mention relevant experience, your approach, and timeline..."
                rows={5}
              />
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>Proposed Budget (PKR)</label>
                <input type="number" value={applyForm.proposedBudget}
                  onChange={e => setApplyForm(prev => ({ ...prev, proposedBudget: e.target.value }))}
                  placeholder="e.g. 150000" />
              </div>
              <div className="form-group">
                <label>Proposed Timeline (days)</label>
                <input type="number" value={applyForm.proposedTimeline}
                  onChange={e => setApplyForm(prev => ({ ...prev, proposedTimeline: e.target.value }))}
                  placeholder="e.g. 14" />
              </div>
            </div>

            <div className="modal__actions">
              <button className="btn-form btn-form--secondary" onClick={() => setApplyModal(null)}>Cancel</button>
              <button className="btn-form btn-form--submit" onClick={handleApply} disabled={applying}>
                {applying ? <><span className="spinner"></span> Submitting...</> : '🚀 Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowseProjects;
