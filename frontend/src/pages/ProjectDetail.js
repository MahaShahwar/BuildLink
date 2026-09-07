import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { getProject, updateProjectStatus, selectEngineer, declineApplication, getRiskAnalysis, getMaterialBreakdown, getProjectTimeline, updateMilestoneStatus, completeProject, rateProject, getMessages, sendMessage, proposeRate, acceptRate, getDeliverables, uploadDeliverable, deleteDeliverable, fundEscrow, getEscrow } from '../services/api';
import './ProjectDetail.css';

const ProjectDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // AI state
  const [riskData, setRiskData] = useState(null);
  const [riskLoading, setRiskLoading] = useState(false);
  const [materialData, setMaterialData] = useState(null);
  const [materialLoading, setMaterialLoading] = useState(false);
  const [timelineData, setTimelineData] = useState(null);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [milestoneActing, setMilestoneActing] = useState(null);

  // Rating state
  const [showRating, setShowRating] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  // Messaging state
  const [messages, setMessages] = useState([]);
  const [msgText, setMsgText] = useState('');
  const [msgSending, setMsgSending] = useState(false);
  const [rateFinalized, setRateFinalized] = useState(false);
  const [agreedRate, setAgreedRate] = useState(null);
  const [proposeAmount, setProposeAmount] = useState('');
  const [proposeRateType, setProposeRateType] = useState('fixed');
  const [showProposeForm, setShowProposeForm] = useState(false);
  const messagesEndRef = useRef(null);
  const [voiceListening, setVoiceListening] = useState(null); // 'msg' | 'rate' | null
  const voiceRef = useRef(null);

  const startVoice = (target) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast.error('Voice not supported — try Chrome'); return; }
    if (voiceListening) { voiceRef.current?.stop(); return; }
    const recog = new SR();
    recog.lang = 'ur-PK'; recog.interimResults = true; recog.continuous = false;
    voiceRef.current = recog;
    recog.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join('');
      if (target === 'msg') setMsgText(t);
      else if (target === 'rate') setProposeAmount(t.replace(/[^0-9]/g, ''));
    };
    recog.onend = () => setVoiceListening(null);
    recog.onerror = () => setVoiceListening(null);
    setVoiceListening(target);
    recog.start();
  };

  // Deliverables state
  const [deliverables, setDeliverables] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadMilestone, setUploadMilestone] = useState('');
  const fileInputRef = useRef(null);

  // Escrow state
  const [escrow, setEscrow] = useState(null);
  const [escrowLoading, setEscrowLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');

  const fetchProject = async () => {
    setLoading(true);
    try {
      const res = await getProject(id);
      if (res.data.success) {
        setProject(res.data.data);
        setRateFinalized(res.data.data.rateFinalized || false);
        setAgreedRate(res.data.data.agreedRate || null);
      }
    } catch { toast.error('Failed to load project'); }
    setLoading(false);
  };

  const fetchMessages = async () => {
    try {
      const res = await getMessages(id);
      if (res.data.success) {
        setMessages(res.data.data || []);
        setRateFinalized(res.data.rateFinalized || false);
        setAgreedRate(res.data.agreedRate || null);
      }
    } catch {}
  };

  useEffect(() => { fetchProject(); }, [id]);

  useEffect(() => {
    if (project?.assignedEngineer) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [project?.assignedEngineer]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load deliverables when switching to that tab
  useEffect(() => {
    if (activeTab === 'deliverables' && project?.assignedEngineer) {
      fetchDeliverables();
    }
  }, [activeTab, project?.assignedEngineer]);

  // Load escrow when rate is finalized
  useEffect(() => {
    if (project?.rateFinalized || rateFinalized) {
      fetchEscrow();
    }
  }, [project?.rateFinalized, rateFinalized]);

  // Handlers
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
      if (res.data.success) { toast.success('✅ Engineer selected! Waiting for them to accept.'); fetchProject(); }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    setActing(null);
  };

  const handleDeclineApplication = async (applicationId) => {
    setActing(applicationId);
    try {
      const res = await declineApplication(id, applicationId);
      if (res.data.success) { toast.success('❌ Application declined'); fetchProject(); }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    setActing(null);
  };

  const handleRiskAnalysis = async () => {
    setRiskLoading(true);
    try {
      const res = await getRiskAnalysis(id);
      if (res.data.success) setRiskData(res.data.data);
    } catch { toast.error('Failed to generate risk analysis'); }
    setRiskLoading(false);
  };

  const handleMaterialBreakdown = async () => {
    setMaterialLoading(true);
    try {
      const res = await getMaterialBreakdown(id);
      if (res.data.success) setMaterialData(res.data.data);
    } catch { toast.error('Failed to generate material breakdown'); }
    setMaterialLoading(false);
  };

  const handleTimeline = async () => {
    setTimelineLoading(true);
    try {
      const res = await getProjectTimeline(id);
      if (res.data.success) { setTimelineData(res.data.data); fetchProject(); }
    } catch { toast.error('Failed to load timeline'); }
    setTimelineLoading(false);
  };

  // Auto-load timeline when timeline tab is opened
  useEffect(() => {
    if (activeTab === 'timeline' && !timelineData && !project?.aiTimeline && milestones.length === 0) {
      handleTimeline();
    }
  }, [activeTab]); // only re-run when tab changes

  const [revisionComment, setRevisionComment] = useState({});
  const [showRevisionInput, setShowRevisionInput] = useState({});

  const handleMilestoneUpdate = async (milestoneId, status, comment) => {
    setMilestoneActing(milestoneId);
    try {
      await updateMilestoneStatus(id, milestoneId, status, comment);
      const msgs = {
        approved: 'Milestone approved! ✅',
        submitted: 'Milestone submitted! 📤',
        in_progress: 'Milestone started! 🚀',
        revised: 'Revision requested! 📝',
        rejected: 'Milestone rejected ❌',
      };
      toast.success(msgs[status] || 'Milestone updated!');
      setShowRevisionInput({});
      setRevisionComment({});
      fetchProject();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    setMilestoneActing(null);
  };

  const handleComplete = async () => {
    try {
      await completeProject(id);
      toast.success('🎉 Project completed!');
      fetchProject();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleRate = async () => {
    if (!ratingValue) return toast.error('Please select a rating');
    setRatingSubmitting(true);
    try {
      await rateProject(id, ratingValue, reviewText);
      toast.success('⭐ Rating submitted!');
      setShowRating(false);
      fetchProject();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    setRatingSubmitting(false);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!msgText.trim()) return;
    setMsgSending(true);
    try {
      const res = await sendMessage(id, msgText);
      if (res.data.success) { setMessages(res.data.data); setMsgText(''); }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to send'); }
    setMsgSending(false);
  };

  const handleProposeRate = async () => {
    const amount = parseInt(proposeAmount);
    if (!amount || amount <= 0) return toast.error('Enter a valid amount');
    try {
      const res = await proposeRate(id, amount, proposeRateType);
      if (res.data.success) {
        setMessages(res.data.data);
        setAgreedRate(res.data.agreedRate);
        setShowProposeForm(false);
        setProposeAmount('');
        setProposeRateType('fixed');
        toast.success('💰 Rate proposed!');
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleAcceptRate = async () => {
    try {
      const res = await acceptRate(id);
      if (res.data.success) {
        setMessages(res.data.data);
        setRateFinalized(true);
        setAgreedRate(res.data.agreedRate);
        toast.success('🎉 Rate finalized! You can now generate timeline and milestones.');
        fetchProject();
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  // Escrow handlers
  const fetchEscrow = async () => {
    try {
      const res = await getEscrow(id);
      if (res.data.success) setEscrow(res.data.data);
    } catch {}
  };

  const handleFundEscrow = async () => {
    setEscrowLoading(true);
    try {
      const res = await fundEscrow(id, paymentMethod);
      if (res.data.success) {
        setEscrow(res.data.data);
        toast.success('💰 Escrow funded! Engineer can now start work.');
        fetchProject();
        fetchMessages();
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to fund escrow'); }
    setEscrowLoading(false);
  };

  // Deliverables handlers
  const fetchDeliverables = async () => {
    try {
      const res = await getDeliverables(id);
      if (res.data.success) setDeliverables(res.data.data || []);
    } catch {}
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('description', uploadDesc);
      formData.append('milestone', uploadMilestone);
      const res = await uploadDeliverable(id, formData);
      if (res.data.success) {
        setDeliverables(res.data.data);
        setUploadDesc('');
        setUploadMilestone('');
        toast.success('📎 File uploaded!');
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed'); }
    setUploadingFile(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteDeliverable = async (delId) => {
    try {
      const res = await deleteDeliverable(id, delId);
      if (res.data.success) { setDeliverables(res.data.data); toast.success('Deleted'); }
    } catch (err) { toast.error('Failed to delete'); }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const fileIcon = (type) => {
    if (type?.includes('pdf')) return '📄';
    if (type?.includes('image')) return '🖼️';
    if (type?.includes('zip') || type?.includes('rar')) return '📦';
    return '📁';
  };

  // Helpers
  const riskColor = (level) => level === 'high' ? '#ef4444' : level === 'medium' ? '#f59e0b' : '#10b981';
  const riskBg = (level) => level === 'high' ? 'rgba(239,68,68,0.1)' : level === 'medium' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)';
  const formatPKR = (n) => n ? `PKR ${new Intl.NumberFormat('en-PK').format(n)}` : 'N/A';
  const rateTypeLabel = { hourly: '/hour', weekly: '/week', monthly: '/month', fixed: '(Fixed)' };

  const statusConfig = {
    draft: { color: '#94a3b8', label: 'Draft', icon: '📝' },
    posted: { color: '#3b82f6', label: 'Open for Applications', icon: '📢' },
    matched: { color: '#8b5cf6', label: 'Engineer Assigned', icon: '🤝' },
    in_progress: { color: '#f59e0b', label: 'In Progress', icon: '🔨' },
    review: { color: '#f97316', label: 'Under Review', icon: '🔍' },
    completed: { color: '#10b981', label: 'Completed', icon: '✅' },
    cancelled: { color: '#ef4444', label: 'Cancelled', icon: '❌' },
  };

  if (loading) return <div className="pd"><div className="pd__loading"><span className="spinner"></span> Loading project...</div></div>;
  if (!project) return <div className="pd"><div className="pd__loading">Project not found</div></div>;

  const sc = statusConfig[project.status] || statusConfig.draft;
  const isOwner = user && (user.id === project.customer?._id || user._id === project.customer?._id);
  const applications = project.applications || [];
  const acceptedApp = applications.find(a => a.status === 'accepted');
  const isEngineer = user && (user.role === 'engineer' || user.role === 'architect');
  const milestones = project.milestones || [];
  const approvedCount = milestones.filter(m => m.status === 'approved').length;
  const progress = milestones.length ? Math.round((approvedCount / milestones.length) * 100) : 0;
  const allMilestonesApproved = milestones.length > 0 && approvedCount === milestones.length;
  const hasRated = isOwner ? project.ratings?.customerToEngineer?.rating : project.ratings?.engineerToCustomer?.rating;
  const canAcceptRate = agreedRate?.amount && !rateFinalized &&
    agreedRate.proposedBy !== (user?.id || user?._id) &&
    agreedRate.proposedBy?.toString() !== (user?.id || user?._id)?.toString();

  const hasEngineer = !!project.assignedEngineer;

  // Build tabs
  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
  ];
  if (hasEngineer) {
    tabs.push({ id: 'discussion', label: 'Discussion', icon: '💬', badge: !rateFinalized ? '!' : null });
  }
  tabs.push({ id: 'ai', label: 'AI Insights', icon: '🤖' });
  if (hasEngineer && (rateFinalized || project.rateFinalized)) {
    tabs.push({ id: 'timeline', label: 'Timeline', icon: '📅' });
  }
  const escrowFunded = escrow?.status && escrow.status !== 'unfunded';
  if (hasEngineer && (isEngineer || escrowFunded)) {
    tabs.push({ id: 'deliverables', label: 'Deliverables', icon: '📎' });
  }
  if (isEngineer) {
    tabs.push({ id: 'floorplan', label: 'Floor Plan', icon: '🏗️' });
  }
  if (project.status === 'completed') {
    tabs.push({ id: 'completion', label: 'Completion', icon: '🏆' });
  }

  return (
    <div className="pd">
      {/* ====== STICKY HEADER ====== */}
      <div className="pd__header">
        <div className="pd__header-inner">
          <button className="pd__back" onClick={() => navigate(-1)}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div className="pd__header-info">
            <div className="pd__header-top">
              <span className="pd__header-type">
                {project.projectType === 'residential' ? '🏠' : project.projectType === 'commercial' ? '🏢' : '🏗️'}
                {project.projectType?.charAt(0).toUpperCase() + project.projectType?.slice(1)}
              </span>
              <span className="pd__status" style={{ '--sc': sc.color }}>
                {sc.icon} {sc.label}
              </span>
              {project.status === 'draft' && isOwner && (
                <button className="pd__post-btn" onClick={handlePostDraft} disabled={acting === 'post'}>
                  {acting === 'post' ? 'Posting...' : '🚀 Post Project'}
                </button>
              )}
            </div>
            <h1 className="pd__title">{project.title}</h1>
            <div className="pd__header-meta">
              {project.location?.city && <span>📍 {project.location.city}</span>}
              {project.budget?.max && <span>💰 Budget: {formatPKR(project.budget.max)}</span>}
              {rateFinalized && <span className="pd__header-rate">✅ Rate: {formatPKR(agreedRate?.amount)} {rateTypeLabel[agreedRate?.rateType] || ''}</span>}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="pd__tabs">
          {tabs.map(tab => (
            <button key={tab.id}
              className={`pd__tab ${activeTab === tab.id ? 'pd__tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}>
              <span className="pd__tab-icon">{tab.icon}</span>
              <span className="pd__tab-label">{tab.label}</span>
              {tab.badge && <span className="pd__tab-badge">{tab.badge}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* ====== TAB CONTENT ====== */}
      <div className="pd__content">

        {/* ====== OVERVIEW TAB ====== */}
        {activeTab === 'overview' && (
          <div className="pd__panel">
            {/* Description */}
            <div className="pd__card">
              <h2 className="pd__card-title">Project Details</h2>
              <p className="pd__desc">{project.description}</p>
              <div className="pd__tags">
                {(project.requirements?.plotSize || project.nlpParsedRequirements?.plotSize?.value) ? <span className="pd__tag">📐 {project.requirements?.plotSize || project.nlpParsedRequirements?.plotSize?.value} {project.requirements?.plotUnit || project.nlpParsedRequirements?.plotSize?.unit || 'marla'}</span> : null}
                {(project.requirements?.floors ?? project.nlpParsedRequirements?.floors) > 0 && <span className="pd__tag">🏢 {project.requirements?.floors ?? project.nlpParsedRequirements?.floors} floors</span>}
                {(project.requirements?.rooms ?? project.nlpParsedRequirements?.bedrooms) > 0 && <span className="pd__tag">🛏️ {project.requirements?.rooms ?? project.nlpParsedRequirements?.bedrooms} rooms</span>}
                {(project.requirements?.bathrooms ?? project.nlpParsedRequirements?.bathrooms) > 0 && <span className="pd__tag">🛁 {project.requirements?.bathrooms ?? project.nlpParsedRequirements?.bathrooms} baths</span>}
                {(project.requirements?.style || project.nlpParsedRequirements?.style) ? <span className="pd__tag pd__tag--accent">✨ {project.requirements?.style || project.nlpParsedRequirements?.style}</span> : null}
                {project.requirements?.features?.map(f => (
                  <span key={f} className="pd__tag pd__tag--accent">⭐ {f.replace(/_/g, ' ')}</span>
                ))}
                {project.requirements?.customFeatures?.map((f, i) => (
                  <span key={`cf-${i}`} className="pd__tag pd__tag--accent">✏️ {f}</span>
                ))}
                {project.nlpParsedRequirements?.specialFeatures?.map(f => (
                  <span key={f} className="pd__tag pd__tag--accent">⭐ {f}</span>
                ))}
              </div>
            </div>

            {/* Budget & Estimate */}
            <div className="pd__grid-2">
              <div className="pd__card pd__card--stat">
                <span className="pd__stat-icon">💰</span>
                <div>
                  <p className="pd__stat-label">Client Budget</p>
                  <p className="pd__stat-value">{formatPKR(project.budget?.min)} — {formatPKR(project.budget?.max)}</p>
                </div>
              </div>
              {project.estimatedCost && (
                <div className="pd__card pd__card--stat">
                  <span className="pd__stat-icon">🤖</span>
                  <div>
                    <p className="pd__stat-label">AI Cost Estimate</p>
                    <p className="pd__stat-value">{formatPKR(project.estimatedCost.min)} — {formatPKR(project.estimatedCost.max)}</p>
                    {project.estimatedCost.confidence && (
                      <p className="pd__stat-sub">{Math.round(project.estimatedCost.confidence * 100)}% confidence</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Cost Breakdown */}
            {project.estimatedCost?.breakdown && (
              <div className="pd__card">
                <h2 className="pd__card-title">📊 Cost Breakdown</h2>
                <div className="pd__breakdown">
                  {Object.entries(project.estimatedCost.breakdown).map(([key, val]) => val ? (
                    <div key={key} className="pd__breakdown-row">
                      <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                      <div className="pd__breakdown-bar-wrap">
                        <div className="pd__breakdown-bar" style={{ width: `${Math.min((val / project.estimatedCost.max) * 100, 100)}%` }}></div>
                      </div>
                      <span className="pd__breakdown-val">{formatPKR(val)}</span>
                    </div>
                  ) : null)}
                </div>
              </div>
            )}

            {/* Assigned Engineer */}
            {acceptedApp && (
              <div className="pd__card pd__card--engineer">
                <h2 className="pd__card-title">✅ Assigned Engineer</h2>
                <div className="pd__engineer">
                  <div className="pd__engineer-avatar">
                    {acceptedApp.engineer?.user?.firstName?.charAt(0) || '?'}
                  </div>
                  <div className="pd__engineer-info">
                    <strong>{acceptedApp.engineer?.user?.firstName} {acceptedApp.engineer?.user?.lastName}</strong>
                    <span className="pd__engineer-spec">{acceptedApp.engineer?.specialization?.replace(/_/g, ' ')}</span>
                    <div className="pd__engineer-stats">
                      <span>📍 {acceptedApp.engineer?.city}</span>
                      <span>⭐ {acceptedApp.engineer?.rating || 0}</span>
                      <span>🔧 {acceptedApp.engineer?.yearsOfExperience || 0} yrs</span>
                    </div>
                  </div>
                </div>
                {acceptedApp.coverLetter && <p className="pd__engineer-letter">"{acceptedApp.coverLetter}"</p>}
                <div className="pd__engineer-proposal">
                  {acceptedApp.proposedBudget && <span className="pd__engineer-chip">💰 {formatPKR(acceptedApp.proposedBudget)}</span>}
                  {acceptedApp.proposedTimeline && <span className="pd__engineer-chip">📅 {acceptedApp.proposedTimeline} days</span>}
                </div>
                {hasEngineer && !rateFinalized && (
                  <button className="pd__cta-btn" onClick={() => setActiveTab('discussion')}>
                    💬 Start Discussion & Finalize Rate
                  </button>
                )}
              </div>
            )}

            {/* Applications */}
            {isOwner && applications.length > 0 && !acceptedApp && (
              <div className="pd__card">
                <h2 className="pd__card-title">📩 Engineer Applications <span className="pd__count">{applications.length}</span></h2>
                <div className="pd__apps">
                  {applications.map(app => (
                    <div key={app._id} className="pd__app" style={{ flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <div className="pd__app-left">
                          <div className="pd__engineer-avatar pd__engineer-avatar--sm">
                            {app.engineer?.user?.firstName?.charAt(0) || '?'}
                          </div>
                          <div>
                            <strong>{app.engineer?.user?.firstName} {app.engineer?.user?.lastName}</strong>
                            <span className="pd__app-meta">
                              {app.engineer?.specialization?.replace(/_/g, ' ')} • {app.engineer?.city || 'N/A'} • ⭐ {app.engineer?.rating || 0}
                              {app.engineer?.experience ? ` • ${app.engineer.experience} yrs exp` : ''}
                            </span>
                          </div>
                        </div>
                        <div className="pd__app-right">
                          {app.proposedBudget > 0 && <span className="pd__app-budget">{formatPKR(app.proposedBudget)}</span>}
                          {app.proposedTimeline > 0 && <span style={{ fontSize: '13px', color: '#64748b' }}>📅 {app.proposedTimeline} days</span>}
                          {app.status === 'pending' && isOwner && (
                            <>
                              <button className="pd__select-btn" disabled={acting === app._id}
                                onClick={() => handleSelectEngineer(app._id)}>
                                {acting === app._id ? '...' : '✅ Select'}
                              </button>
                              <button className="pd__decline-btn" disabled={acting === app._id}
                                onClick={() => handleDeclineApplication(app._id)}
                                style={{ padding: '6px 14px', borderRadius: '8px', border: '1.5px solid #ef4444', background: 'transparent', color: '#ef4444', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                                ❌ Decline
                              </button>
                            </>
                          )}
                          {app.status === 'selected' && (
                            <span style={{ padding: '6px 14px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', fontWeight: 600, fontSize: '13px' }}>
                              ⏳ Awaiting Engineer Response
                            </span>
                          )}
                          {app.status === 'declined' && (
                            <span style={{ padding: '6px 14px', borderRadius: '8px', background: '#fee2e2', color: '#ef4444', fontWeight: 600, fontSize: '13px' }}>
                              ❌ Declined
                            </span>
                          )}
                        </div>
                      </div>
                      {app.coverLetter && (
                        <div style={{ width: '100%', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', fontSize: '13px', color: '#475569', lineHeight: '1.6', borderLeft: '3px solid #3b82f6' }}>
                          <span style={{ fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px', fontSize: '12px' }}>Cover Letter</span>
                          {app.coverLetter}
                        </div>
                      )}
                      {app.appliedAt && (
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>Applied {new Date(app.appliedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {isOwner && project.status === 'posted' && applications.length === 0 && (
              <div className="pd__card pd__empty">
                <div className="pd__empty-icon">📩</div>
                <h3>Waiting for Applications</h3>
                <p>Your project is live. Engineers will start applying soon.</p>
              </div>
            )}
          </div>
        )}

        {/* ====== DISCUSSION TAB ====== */}
        {activeTab === 'discussion' && hasEngineer && (
          <div className="pd__panel pd__panel--chat">
            <div className="pd__chat">
              {/* Chat Header */}
              <div className="pd__chat-top">
                <div className="pd__chat-top-left">
                  <div className="pd__engineer-avatar pd__engineer-avatar--sm">
                    {acceptedApp?.engineer?.user?.firstName?.charAt(0) || '🔧'}
                  </div>
                  <div>
                    <strong>{isOwner
                      ? `${acceptedApp?.engineer?.user?.firstName || ''} ${acceptedApp?.engineer?.user?.lastName || ''}`.trim() || 'Engineer'
                      : project.customer?.firstName ? `${project.customer.firstName} ${project.customer.lastName}` : 'Customer'
                    }</strong>
                    <span className="pd__chat-role">{isOwner ? 'Engineer' : 'Customer'}</span>
                  </div>
                </div>
                <div>
                  {rateFinalized ? (
                    <span className="pd__rate-badge pd__rate-badge--done">✅ {formatPKR(agreedRate?.amount)} {rateTypeLabel[agreedRate?.rateType] || ''}</span>
                  ) : (
                    <span className="pd__rate-badge pd__rate-badge--pending">⏳ Rate Pending</span>
                  )}
                </div>
              </div>

              {/* Rate Notice */}
              {!rateFinalized && (
                <div className="pd__chat-notice">
                  💡 Discuss project details and finalize the rate. Both parties must agree before work can begin.
                </div>
              )}

              {/* Messages Area */}
              <div className="pd__chat-body">
                {messages.length === 0 && (
                  <div className="pd__chat-empty">
                    <span>👋</span>
                    <p>Say hello and start discussing the project!</p>
                  </div>
                )}
                {messages.map((msg, i) => {
                  const isMine = (msg.sender?._id || msg.sender) === (user?.id || user?._id);
                  const showDate = i === 0 || new Date(msg.sentAt).toDateString() !== new Date(messages[i-1]?.sentAt).toDateString();
                  return (
                    <React.Fragment key={i}>
                      {showDate && (
                        <div className="pd__chat-date">
                          <span>{new Date(msg.sentAt).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                        </div>
                      )}
                      <div className={`pd__msg ${isMine ? 'pd__msg--mine' : 'pd__msg--theirs'} ${msg.type !== 'message' ? 'pd__msg--special' : ''}`}>
                        {!isMine && (
                          <div className="pd__msg-avatar">
                            {msg.sender?.name?.charAt(0) || (msg.senderRole === 'engineer' ? '🔧' : '👤')}
                          </div>
                        )}
                        <div className="pd__msg-bubble">
                          {msg.type === 'rate_proposal' ? (
                            <div className="pd__msg-rate">
                              <div className="pd__msg-rate-header">💰 Rate Proposal</div>
                              <div className="pd__msg-rate-amount">{formatPKR(msg.rateProposal?.amount)}</div>
                              <div className="pd__msg-rate-type">{rateTypeLabel[msg.rateProposal?.rateType] || '(Fixed)'}</div>
                            </div>
                          ) : msg.type === 'rate_accepted' ? (
                            <div className="pd__msg-accepted">🎉 {msg.text}</div>
                          ) : (
                            <p>{msg.text}</p>
                          )}
                          <span className="pd__msg-time">
                            {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Accept Rate Bar */}
              {canAcceptRate && (
                <div className="pd__chat-accept">
                  <div className="pd__chat-accept-info">
                    <strong>{formatPKR(agreedRate.amount)} {rateTypeLabel[agreedRate.rateType] || ''}</strong>
                    <span>proposed — do you accept?</span>
                  </div>
                  <div className="pd__chat-accept-actions">
                    <button className="pd__btn pd__btn--success" onClick={handleAcceptRate}>✅ Accept</button>
                    <button className="pd__btn pd__btn--outline" onClick={() => setShowProposeForm(true)}>💰 Counter</button>
                  </div>
                </div>
              )}

              {/* Propose Rate Form */}
              {showProposeForm && !rateFinalized && (
                <div className="pd__chat-propose">
                  <div className="pd__chat-propose-row">
                    <button type="button" className={`pd__voice-btn ${voiceListening === 'rate' ? 'pd__voice-btn--active' : ''}`}
                      onClick={() => startVoice('rate')} title="Speak amount">
                      {voiceListening === 'rate' ? '🔴' : '🎤'}
                    </button>
                    <input type="number" placeholder={voiceListening === 'rate' ? '🎤 Say the amount...' : 'Amount in PKR'} value={proposeAmount}
                      onChange={e => setProposeAmount(e.target.value)} />
                    <select value={proposeRateType} onChange={e => setProposeRateType(e.target.value)}>
                      <option value="fixed">Fixed Price</option>
                      <option value="hourly">Per Hour</option>
                      <option value="weekly">Per Week</option>
                      <option value="monthly">Per Month</option>
                    </select>
                    <button className="pd__btn pd__btn--primary" onClick={handleProposeRate}>Send</button>
                    <button className="pd__btn pd__btn--ghost" onClick={() => setShowProposeForm(false)}>✕</button>
                  </div>
                </div>
              )}

              {/* Message Input */}
              <form className="pd__chat-input" onSubmit={handleSendMessage}>
                <button type="button" className={`pd__voice-btn ${voiceListening === 'msg' ? 'pd__voice-btn--active' : ''}`}
                  onClick={() => startVoice('msg')} title="Voice message (Urdu/English)">
                  {voiceListening === 'msg' ? '🔴' : '🎤'}
                </button>
                <input type="text" placeholder={voiceListening === 'msg' ? '🎤 Listening... speak now' : 'Type or speak a message...'} value={msgText}
                  onChange={e => setMsgText(e.target.value)} disabled={msgSending} />
                {!rateFinalized && !showProposeForm && (
                  <button type="button" className="pd__btn pd__btn--rate" onClick={() => setShowProposeForm(true)}>
                    💰 Propose Rate
                  </button>
                )}
                <button type="submit" disabled={msgSending || !msgText.trim()} className="pd__chat-send">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M18 2L9 11M18 2L12.5 18L9 11M18 2L2 7.5L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ====== AI INSIGHTS TAB ====== */}
        {activeTab === 'ai' && (
          <div className="pd__panel">
            <div className="pd__ai-grid">
              {/* Risk Analysis */}
              <div className="pd__card">
                <div className="pd__card-header">
                  <h2 className="pd__card-title">⚠️ Risk Analysis</h2>
                  {!riskData && (
                    <button className="pd__btn pd__btn--primary" onClick={handleRiskAnalysis} disabled={riskLoading}>
                      {riskLoading ? <><span className="spinner spinner--sm"></span> Analyzing...</> : '🔍 Analyze'}
                    </button>
                  )}
                </div>
                {!riskData && !riskLoading && (
                  <p className="pd__card-desc">Identify potential construction risks for your project location and requirements.</p>
                )}
                {riskData && (
                  <div className="pd__risk">
                    <div className="pd__risk-overall" style={{ background: riskBg(riskData.overallRiskLevel), borderColor: riskColor(riskData.overallRiskLevel) }}>
                      <span style={{ color: riskColor(riskData.overallRiskLevel), fontWeight: 700 }}>
                        {riskData.overallRiskLevel?.toUpperCase()} RISK
                      </span>
                      {riskData.budgetRisk && <span style={{ color: riskColor(riskData.budgetRisk.level) }}>💰 {riskData.budgetRisk.message}</span>}
                    </div>
                    {riskData.risks?.map((risk, i) => (
                      <div key={i} className="pd__risk-item" style={{ borderLeftColor: riskColor(risk.severity) }}>
                        <div className="pd__risk-item-top">
                          <span className="pd__risk-item-title">{risk.title}</span>
                          <span className="pd__risk-sev" style={{ color: riskColor(risk.severity), background: riskBg(risk.severity) }}>{risk.severity}</span>
                        </div>
                        <p>{risk.description}</p>
                        <p className="pd__risk-tip">💡 {risk.mitigation}</p>
                      </div>
                    ))}
                    {riskData.recommendations?.length > 0 && (
                      <div className="pd__risk-recs">
                        <h4>🎯 Recommendations</h4>
                        <ul>{riskData.recommendations.map((r, i) => <li key={i}>{r}</li>)}</ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Material Breakdown */}
              <div className="pd__card">
                <div className="pd__card-header">
                  <h2 className="pd__card-title">🧱 Material Breakdown</h2>
                  {!materialData && (
                    <button className="pd__btn pd__btn--primary" onClick={handleMaterialBreakdown} disabled={materialLoading}>
                      {materialLoading ? <><span className="spinner spinner--sm"></span> Generating...</> : '📋 Generate'}
                    </button>
                  )}
                </div>
                {!materialData && !materialLoading && (
                  <p className="pd__card-desc">Get a detailed material list with quantities, costs, and money-saving tips.</p>
                )}
                {materialData && (
                  <div className="pd__material">
                    {materialData.summary && <p className="pd__material-summary">{materialData.summary}</p>}
                    {materialData.categories?.map((cat, i) => (
                      <div key={i} className="pd__material-cat">
                        <div className="pd__material-cat-head">
                          <span>{cat.icon} {cat.name}</span>
                          <span>{formatPKR(cat.subtotal)}</span>
                        </div>
                        <div className="pd__table-wrap">
                          <table className="pd__table">
                            <thead><tr><th>Material</th><th>Qty</th><th>Unit</th><th>Total</th><th>Grade</th></tr></thead>
                            <tbody>
                              {cat.items?.map((item, j) => (
                                <tr key={j}>
                                  <td><strong>{item.material}</strong></td>
                                  <td>{item.quantity}</td>
                                  <td>{item.unitCost}</td>
                                  <td>{formatPKR(item.totalCost)}</td>
                                  <td><span className="pd__grade">{item.grade}</span></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                    <div className="pd__material-total">
                      <span>Grand Total</span>
                      <span>{formatPKR(materialData.grandTotal)}</span>
                    </div>
                    {materialData.tips?.length > 0 && (
                      <div className="pd__material-tips">
                        <h4>💡 Money-Saving Tips</h4>
                        <ul>{materialData.tips.map((t, i) => <li key={i}>{t}</li>)}</ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ====== TIMELINE TAB ====== */}
        {activeTab === 'timeline' && (rateFinalized || project.rateFinalized) && (
          <div className="pd__panel">

            {/* Escrow Status / Fund Escrow */}
            {escrow && escrow.status !== 'unfunded' ? (
              <div className="pd__card pd__escrow-card">
                <div className="pd__escrow-header">
                  <div>
                    <h2 className="pd__card-title" style={{ marginBottom: '4px' }}>🔒 Escrow Payment</h2>
                    <span className={`pd__escrow-badge pd__escrow-badge--${escrow.status}`}>
                      {escrow.status === 'funded' ? '✅ Funded' : escrow.status === 'partially_released' ? '📤 Partially Released' : escrow.status === 'fully_released' ? '🎉 Fully Released' : escrow.status}
                    </span>
                  </div>
                  <div className="pd__escrow-amounts">
                    <div className="pd__escrow-amount">
                      <span className="pd__escrow-label">Total Deposited</span>
                      <span className="pd__escrow-value">{formatPKR(escrow.totalAmount)}</span>
                    </div>
                    <div className="pd__escrow-amount">
                      <span className="pd__escrow-label">Released</span>
                      <span className="pd__escrow-value pd__escrow-value--released">{formatPKR(escrow.releasedAmount || 0)}</span>
                    </div>
                    <div className="pd__escrow-amount">
                      <span className="pd__escrow-label">Held in Escrow</span>
                      <span className="pd__escrow-value pd__escrow-value--held">{formatPKR((escrow.totalAmount || 0) - (escrow.releasedAmount || 0))}</span>
                    </div>
                  </div>
                </div>
                {/* Escrow progress bar */}
                <div className="pd__escrow-bar">
                  <div className="pd__escrow-bar-fill" style={{ width: `${escrow.totalAmount ? ((escrow.releasedAmount || 0) / escrow.totalAmount * 100) : 0}%` }}></div>
                </div>
                {/* Transaction history */}
                {escrow.transactions?.length > 0 && (
                  <div className="pd__escrow-txns">
                    <h4>Transaction History</h4>
                    {escrow.transactions.map((txn, i) => (
                      <div key={i} className={`pd__escrow-txn pd__escrow-txn--${txn.type}`}>
                        <span className="pd__escrow-txn-icon">
                          {txn.type === 'deposit' ? '💰' : txn.type === 'release' ? '📤' : '↩️'}
                        </span>
                        <div className="pd__escrow-txn-info">
                          <span>{txn.note || txn.type}</span>
                          <span className="pd__escrow-txn-date">{new Date(txn.createdAt).toLocaleDateString()}</span>
                        </div>
                        <span className={`pd__escrow-txn-amt ${txn.type === 'release' ? 'pd__escrow-txn-amt--green' : ''}`}>
                          {txn.type === 'deposit' ? '+' : '-'}{formatPKR(txn.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : isOwner && (
              <div className="pd__card pd__escrow-fund">
                <div className="pd__escrow-fund-icon">🔒</div>
                <h2>Fund Escrow to Begin</h2>
                <p>Deposit <strong>{formatPKR(agreedRate?.amount)}</strong> into escrow. The engineer will see the funds are secured and can start work with confidence. Funds are released as milestones are approved.</p>
                <div className="pd__escrow-fund-form">
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="pd__escrow-select">
                    <option value="bank_transfer">🏦 Bank Transfer</option>
                    <option value="jazzcash">📱 JazzCash</option>
                    <option value="easypaisa">📱 Easypaisa</option>
                    <option value="credit_card">💳 Credit/Debit Card</option>
                  </select>
                  <button className="pd__cta-btn" onClick={handleFundEscrow} disabled={escrowLoading}>
                    {escrowLoading ? <><span className="spinner spinner--sm"></span> Processing...</> : `💰 Deposit ${formatPKR(agreedRate?.amount)}`}
                  </button>
                </div>
                <div className="pd__escrow-trust">
                  <span>🛡️ Secure</span>
                  <span>🔒 Funds held until approval</span>
                  <span>📤 Auto-release per milestone</span>
                </div>
              </div>
            )}

            {/* Show timeline only after escrow is funded (or for engineer view) */}
            {(escrow?.status && escrow.status !== 'unfunded') || isEngineer ? (
              <>
                {/* Loading state while timeline generates */}
                {!timelineData && milestones.length === 0 && (
                  <div className="pd__card pd__empty">
                    <div className="pd__empty-icon">📅</div>
                    <h3>Loading Timeline...</h3>
                    <p>Setting up design milestones for your project.</p>
                    <span className="spinner spinner--sm" style={{ marginTop: '16px' }}></span>
                  </div>
                )}

            {/* Timeline Visual */}
            {(timelineData || project.aiTimeline) && (
              <div className="pd__card">
                <h2 className="pd__card-title">📅 Design Timeline</h2>
                {(() => { const tl = timelineData || project.aiTimeline; return (
                  <>
                    <div className="pd__tl-header">
                      <span>📐 Total: <strong>{tl.totalDurationWeeks} weeks</strong></span>
                      {tl.designNotes && <span>📝 {tl.designNotes}</span>}
                    </div>
                    <div className="pd__tl-phases">
                      {tl.phases?.map((phase, i) => (
                        <div key={i} className="pd__tl-phase">
                          <div className="pd__tl-dot"></div>
                          <div className="pd__tl-phase-body">
                            <div className="pd__tl-phase-top">
                              <span className="pd__tl-phase-icon">{phase.icon}</span>
                              <strong>{phase.name}</strong>
                            </div>
                            <span className="pd__tl-phase-dur">{phase.durationWeeks} weeks</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {tl.criticalPath?.length > 0 && (
                      <div className="pd__tl-critical">⚡ Critical Path: {tl.criticalPath.join(' → ')}</div>
                    )}
                  </>
                ); })()}
              </div>
            )}

            {/* Milestone Progress */}
            {milestones.length > 0 && (
              <div className="pd__card">
                <h2 className="pd__card-title">🎯 Milestones</h2>
                <div className="pd__ms-progress">
                  <div className="pd__ms-bar">
                    <div className="pd__ms-fill" style={{ width: `${progress}%` }}></div>
                  </div>
                  <span className="pd__ms-text">{progress}% ({approvedCount}/{milestones.length} approved)</span>
                </div>
                <div className="pd__ms-list">
                  {milestones.map((m, i) => {
                    const icons = { pending: '⏳', in_progress: '🔨', submitted: '📤', approved: '✅', revised: '📝', rejected: '❌', paid: '💰', disputed: '⚠️' };
                    const prevApproved = i === 0 || ['approved', 'paid'].includes(milestones[i - 1]?.status);
                    const canStart = isEngineer && (m.status === 'pending' || m.status === 'revised') && prevApproved;
                    const canSubmit = isEngineer && m.status === 'in_progress';
                    const isFloorPlanMilestone = i === 2; // Milestone 3: Detailed Architectural Drawings

                    return (
                      <div key={m._id || i} className={`pd__ms pd__ms--${m.status}`}>
                        <div className="pd__ms-num">{i + 1}</div>
                        <div className="pd__ms-body">
                          <div className="pd__ms-top">
                            <div>
                              <strong>{m.title}</strong>
                              <p>{m.description}</p>
                            </div>
                            <span className={`pd__ms-status pd__ms-status--${m.status}`}>
                              {icons[m.status]} {m.status.replace('_', ' ')}
                            </span>
                          </div>

                          {/* Floor Plan link on Milestone 3 */}
                          {isFloorPlanMilestone && isEngineer && (m.status === 'in_progress' || m.status === 'revised') && (
                            <div style={{ margin: '8px 0', padding: '10px 14px', background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(6,182,212,0.08))', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span>🏗️</span>
                              <span style={{ flex: 1, fontSize: '13px', color: '#334155' }}>
                                {project.activeFloorPlan ? 'Floor plan generated — attach it to this milestone' : 'Generate a floor plan for this milestone'}
                              </span>
                              <button className="pd__btn pd__btn--primary" style={{ fontSize: '12px', padding: '6px 14px' }}
                                onClick={() => navigate(`/projects/${id}/design`, { state: { project } })}>
                                {project.activeFloorPlan ? '📐 View / Edit' : '🤖 Generate'}
                              </button>
                              {project.activeFloorPlan && (
                                <button className="pd__btn pd__btn--primary" style={{ fontSize: '12px', padding: '6px 14px' }}
                                  onClick={() => {
                                    const json = JSON.stringify(project.activeFloorPlan, null, 2);
                                    const blob = new Blob([json], { type: 'application/json' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a'); a.href = url; a.download = `floor-plan-${project.title}.json`; a.click();
                                    URL.revokeObjectURL(url);
                                  }}>
                                  ⬇️ Download
                                </button>
                              )}
                            </div>
                          )}

                          {/* Milestone deliverables */}
                          {m.milestoneDeliverables?.length > 0 && (
                            <div className="pd__ms-deliverables">
                              {m.milestoneDeliverables.map((d, j) => <span key={j}>📎 {d}</span>)}
                            </div>
                          )}

                          {/* Revision history / comments */}
                          {m.revisionHistory?.length > 0 && (
                            <div style={{ margin: '8px 0', padding: '10px 14px', background: m.status === 'rejected' ? '#fef2f2' : '#fefce8', borderRadius: '10px', borderLeft: `3px solid ${m.status === 'rejected' ? '#ef4444' : '#f59e0b'}` }}>
                              <span style={{ fontWeight: 600, fontSize: '12px', color: m.status === 'rejected' ? '#ef4444' : '#d97706', display: 'block', marginBottom: '6px' }}>
                                {m.status === 'rejected' ? '❌ Rejection Feedback' : '📝 Revision Comments'}
                              </span>
                              {m.revisionHistory.map((r, j) => (
                                <div key={j} style={{ fontSize: '13px', color: '#475569', marginBottom: '4px', paddingLeft: '8px', borderLeft: `2px solid ${r.by === 'customer' ? '#3b82f6' : '#10b981'}` }}>
                                  <strong style={{ color: r.by === 'customer' ? '#3b82f6' : '#10b981' }}>{r.by === 'customer' ? '👤 Customer' : '👷 Engineer'}:</strong> {r.comment}
                                  <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '8px' }}>{new Date(r.at).toLocaleDateString()}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Latest revision comment highlight */}
                          {m.revisionComment && m.status === 'revised' && (
                            <div style={{ margin: '8px 0', padding: '10px 14px', background: '#fef3c7', borderRadius: '10px', fontSize: '13px', color: '#92400e', borderLeft: '3px solid #f59e0b' }}>
                              <strong>📝 Revision needed:</strong> {m.revisionComment}
                            </div>
                          )}

                          {/* Engineer Actions */}
                          <div className="pd__ms-actions">
                            {canStart && (
                              <button className="pd__btn pd__btn--primary" disabled={milestoneActing === m._id}
                                onClick={async () => {
                                  await handleMilestoneUpdate(m._id, 'in_progress');
                                  // Auto-switch to deliverables tab with this milestone selected
                                  setUploadMilestone(m.title);
                                  setActiveTab('deliverables');
                                }}>
                                {m.status === 'revised' ? '🔄 Restart & Fix' : '🚀 Start'}
                              </button>
                            )}
                            {!canStart && isEngineer && (m.status === 'pending') && !prevApproved && (
                              <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>🔒 Complete previous milestone first</span>
                            )}
                            {canSubmit && (
                              <button className="pd__btn pd__btn--info" style={{ background: '#eff6ff', color: '#2563eb', border: '1.5px solid #3b82f6', fontSize: '13px' }}
                                onClick={() => {
                                  setUploadMilestone(m.title);
                                  setActiveTab('deliverables');
                                }}>📎 Go to Deliverables</button>
                            )}

                          </div>

                          {/* Customer Review Panel — all actions in one place */}
                          {isOwner && m.status === 'submitted' && (
                            <div style={{ marginTop: '12px', padding: '14px 16px', background: 'linear-gradient(135deg, #f0f9ff, #faf5ff)', border: '1.5px solid #a5b4fc', borderRadius: '12px' }}>
                              <div style={{ fontSize: '12px', fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                                📋 Review Milestone {i + 1}
                              </div>

                              {/* View Deliverables */}
                              <button className="pd__btn" style={{ width: '100%', justifyContent: 'center', background: '#eff6ff', color: '#2563eb', border: '1.5px solid #3b82f6', fontSize: '13px', marginBottom: '10px' }}
                                onClick={() => { setUploadMilestone(m.title); setActiveTab('deliverables'); }}>
                                📂 View Submitted Deliverables
                              </button>

                              {/* Action buttons row */}
                              <div style={{ display: 'flex', gap: '8px', marginBottom: showRevisionInput[m._id] || showRevisionInput[`reject_${m._id}`] ? '10px' : '0' }}>
                                <button className="pd__btn pd__btn--success" disabled={milestoneActing === m._id}
                                  style={{ flex: 1, justifyContent: 'center', fontSize: '13px' }}
                                  onClick={() => handleMilestoneUpdate(m._id, 'approved')}>✅ Approve</button>
                                <button className="pd__btn" disabled={milestoneActing === m._id}
                                  style={{ flex: 1, justifyContent: 'center', background: showRevisionInput[m._id] ? '#fde68a' : '#fef3c7', color: '#d97706', border: '1.5px solid #f59e0b', fontSize: '13px' }}
                                  onClick={() => setShowRevisionInput(prev => ({ ...prev, [m._id]: !prev[m._id], [`reject_${m._id}`]: false }))}>
                                  📝 Revise
                                </button>
                                <button className="pd__btn pd__btn--danger" disabled={milestoneActing === m._id}
                                  style={{ flex: 1, justifyContent: 'center', fontSize: '13px', background: showRevisionInput[`reject_${m._id}`] ? '#fca5a5' : undefined }}
                                  onClick={() => setShowRevisionInput(prev => ({ ...prev, [`reject_${m._id}`]: !prev[`reject_${m._id}`], [m._id]: false }))}>
                                  ❌ Reject
                                </button>
                              </div>

                              {/* Revision comment input */}
                              {showRevisionInput[m._id] && (
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <input type="text" placeholder="Enter revision feedback..."
                                    value={revisionComment[m._id] || ''}
                                    onChange={(e) => setRevisionComment(prev => ({ ...prev, [m._id]: e.target.value }))}
                                    style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #f59e0b', fontSize: '13px' }}
                                  />
                                  <button className="pd__btn" disabled={!revisionComment[m._id]?.trim()}
                                    style={{ background: '#fef3c7', color: '#d97706', border: '1.5px solid #f59e0b', fontSize: '13px' }}
                                    onClick={() => handleMilestoneUpdate(m._id, 'revised', revisionComment[m._id])}>
                                    Send 📝
                                  </button>
                                  <button onClick={() => { setShowRevisionInput(prev => ({ ...prev, [m._id]: false })); setRevisionComment(prev => ({ ...prev, [m._id]: '' })); }}
                                    style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}>
                                    ✕
                                  </button>
                                </div>
                              )}

                              {/* Reject comment input */}
                              {showRevisionInput[`reject_${m._id}`] && (
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <input type="text" placeholder="Reason for rejection (optional)..."
                                    value={revisionComment[`reject_${m._id}`] || ''}
                                    onChange={(e) => setRevisionComment(prev => ({ ...prev, [`reject_${m._id}`]: e.target.value }))}
                                    style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #ef4444', fontSize: '13px' }}
                                  />
                                  <button className="pd__btn pd__btn--danger" style={{ fontSize: '13px' }}
                                    onClick={() => handleMilestoneUpdate(m._id, 'rejected', revisionComment[`reject_${m._id}`])}>
                                    Reject ❌
                                  </button>
                                  <button onClick={() => { setShowRevisionInput(prev => ({ ...prev, [`reject_${m._id}`]: false })); setRevisionComment(prev => ({ ...prev, [`reject_${m._id}`]: '' })); }}
                                    style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}>
                                    ✕
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Complete Project */}
            {isOwner && project.status === 'in_progress' && allMilestonesApproved && (
              <div className="pd__card pd__card--highlight">
                <h2 className="pd__card-title">🎉 All Milestones Complete!</h2>
                <p>All milestones approved. Mark the project as completed.</p>
                <button className="pd__cta-btn" onClick={handleComplete} style={{ marginTop: '12px' }}>✅ Mark Complete</button>
              </div>
            )}
              </>
            ) : !isOwner ? (
              <div className="pd__card pd__empty">
                <div className="pd__empty-icon">⏳</div>
                <h3>Waiting for Escrow</h3>
                <p>The customer needs to fund the escrow before work can begin.</p>
              </div>
            ) : null}
          </div>
        )}

        {/* ====== DELIVERABLES TAB ====== */}
        {activeTab === 'deliverables' && hasEngineer && (
          <div className="pd__panel">
            <div className="pd__card">
              <div className="pd__card-header">
                <h2 className="pd__card-title">📎 Project Deliverables</h2>
                <span className="pd__count" style={{ background: '#6366f1' }}>{deliverables.length} files</span>
              </div>

              {/* Upload Area — Engineer Only */}
              {isEngineer && <div className="pd__upload-area">
                <div className="pd__upload-dropzone" onClick={() => !uploadingFile && fileInputRef.current?.click()}>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }}
                    accept=".jpg,.jpeg,.png,.gif,.pdf,.dwg,.dxf,.svg,.doc,.docx,.zip,.rar" />
                  {uploadingFile ? (
                    <><span className="spinner spinner--sm"></span> Uploading...</>
                  ) : (
                    <>
                      <span className="pd__upload-icon">📤</span>
                      <p><strong>Click to upload</strong> design files</p>
                      <span className="pd__upload-hint">PDF, Images, CAD, ZIP — max 20MB</span>
                    </>
                  )}
                </div>
                <div className="pd__upload-options">
                  <input type="text" placeholder="Description (optional)" value={uploadDesc}
                    onChange={e => setUploadDesc(e.target.value)} className="pd__upload-input" />
                  {milestones.length > 0 && (
                    <select value={uploadMilestone} onChange={e => setUploadMilestone(e.target.value)} className="pd__upload-select">
                      <option value="">No milestone linked</option>
                      {milestones.map((m, i) => (
                        <option key={m._id || i} value={m.title}>{m.title}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>}

              {/* Active Milestone Banner + Submit for Review */}
              {isEngineer && milestones.length > 0 && (() => {
                const activeMilestone = milestones.find(m => m.status === 'in_progress');
                if (!activeMilestone) return null;
                const msIndex = milestones.findIndex(m => m._id === activeMilestone._id);
                const msDeliverables = deliverables.filter(f => f.milestone === activeMilestone.title);
                return (
                  <div style={{ margin: '16px 0', padding: '16px', background: 'linear-gradient(135deg, #eff6ff, #f0fdf4)', borderRadius: '12px', border: '1.5px solid #93c5fd' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div>
                        <span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 600 }}>ACTIVE MILESTONE {msIndex + 1}</span>
                        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', margin: '2px 0' }}>{activeMilestone.title}</h3>
                      </div>
                      <span style={{ background: '#dbeafe', color: '#2563eb', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                        🔨 In Progress
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '10px' }}>
                      📎 {msDeliverables.length} file{msDeliverables.length !== 1 ? 's' : ''} uploaded for this milestone
                    </div>
                    <button className="pd__btn pd__btn--warning"
                      disabled={milestoneActing === activeMilestone._id || msDeliverables.length === 0}
                      onClick={() => handleMilestoneUpdate(activeMilestone._id, 'submitted')}
                      style={{ width: '100%', justifyContent: 'center', opacity: msDeliverables.length === 0 ? 0.5 : 1 }}>
                      {milestoneActing === activeMilestone._id ? '...' : '📤 Submit Milestone for Review'}
                    </button>
                    {msDeliverables.length === 0 && (
                      <span style={{ fontSize: '12px', color: '#f59e0b', display: 'block', marginTop: '6px', textAlign: 'center' }}>
                        ⚠️ Upload at least one file for this milestone before submitting
                      </span>
                    )}
                  </div>
                );
              })()}

              {/* File List */}
              {deliverables.length === 0 ? (
                <div className="pd__empty" style={{ padding: '24px 0' }}>
                  <div className="pd__empty-icon">📂</div>
                  <h3>No deliverables yet</h3>
                  <p>Upload design files, blueprints, and project documents.</p>
                </div>
              ) : (
                <div className="pd__files">
                  {deliverables.map((file, i) => (
                    <div key={file._id || i} className="pd__file">
                      <div className="pd__file-icon">{fileIcon(file.fileType)}</div>
                      <div className="pd__file-info">
                        <a href={`http://localhost:5000${file.path}`} target="_blank" rel="noopener noreferrer" className="pd__file-name">
                          {file.filename}
                        </a>
                        <div className="pd__file-meta">
                          <span>{formatFileSize(file.size)}</span>
                          <span>by {file.uploaderName || file.uploaderRole}</span>
                          <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                          {file.milestone && <span className="pd__file-milestone">📌 {file.milestone}</span>}
                        </div>
                        {file.description && <p className="pd__file-desc">{file.description}</p>}
                      </div>
                      <div className="pd__file-actions">
                        <a href={`http://localhost:5000${file.path}`} target="_blank" rel="noopener noreferrer" className="pd__btn pd__btn--outline">
                          👁️ View
                        </a>
                        {(file.uploadedBy === (user?.id || user?._id) || file.uploadedBy?.toString() === (user?.id || user?._id)?.toString()) && (
                          <button className="pd__btn pd__btn--ghost" onClick={() => handleDeleteDeliverable(file._id)}>🗑️</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Preview area for images */}
            {deliverables.filter(f => f.fileType?.includes('image')).length > 0 && (
              <div className="pd__card">
                <h2 className="pd__card-title">🖼️ Design Previews</h2>
                <div className="pd__previews">
                  {deliverables.filter(f => f.fileType?.includes('image')).map((file, i) => (
                    <a key={i} href={`http://localhost:5000${file.path}`} target="_blank" rel="noopener noreferrer" className="pd__preview">
                      <img src={`http://localhost:5000${file.path}`} alt={file.filename} />
                      <span>{file.filename}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ====== FLOOR PLAN TAB ====== */}
        {activeTab === 'floorplan' && (
          <div className="pd__panel">
            <div className="pd__card pd__empty">
              <div className="pd__empty-icon">🏗️</div>
              <h3>{project.activeFloorPlan ? 'Floor Plan Ready' : 'Generate Floor Plan'}</h3>
              <p>{project.activeFloorPlan
                ? 'Your AI-generated floor plan is ready. View or make amendments.'
                : 'Generate an AI floor plan based on your project requirements.'}</p>
              <button className="pd__cta-btn" style={{ marginTop: '16px' }}
                onClick={() => navigate(`/projects/${id}/design`, { state: { project } })}>
                {project.activeFloorPlan ? '📐 View / Edit Floor Plan' : '🤖 Generate Floor Plan'}
              </button>
            </div>
          </div>
        )}

        {/* ====== COMPLETION TAB ====== */}
        {activeTab === 'completion' && project.status === 'completed' && (
          <div className="pd__panel">
            <div className="pd__card pd__card--completed">
              <div className="pd__completion-header">
                <span className="pd__completion-icon">🏆</span>
                <div>
                  <h2>Project Completed</h2>
                  <p>Completed on {new Date(project.completedAt).toLocaleDateString()}</p>
                </div>
              </div>

              {project.ratings?.customerToEngineer?.rating && (
                <div className="pd__rating-display">
                  <strong>Customer → Engineer:</strong>
                  <span className="pd__stars">{'★'.repeat(project.ratings.customerToEngineer.rating)}{'☆'.repeat(5 - project.ratings.customerToEngineer.rating)}</span>
                  {project.ratings.customerToEngineer.review && <p>"{project.ratings.customerToEngineer.review}"</p>}
                </div>
              )}
              {project.ratings?.engineerToCustomer?.rating && (
                <div className="pd__rating-display">
                  <strong>Engineer → Customer:</strong>
                  <span className="pd__stars">{'★'.repeat(project.ratings.engineerToCustomer.rating)}{'☆'.repeat(5 - project.ratings.engineerToCustomer.rating)}</span>
                  {project.ratings.engineerToCustomer.review && <p>"{project.ratings.engineerToCustomer.review}"</p>}
                </div>
              )}

              {!hasRated && (
                <>
                  {!showRating ? (
                    <button className="pd__cta-btn" onClick={() => setShowRating(true)} style={{ marginTop: '16px' }}>
                      ⭐ Rate {isOwner ? 'Engineer' : 'Customer'}
                    </button>
                  ) : (
                    <div className="pd__rating-form">
                      <h3>Rate your experience</h3>
                      <div className="pd__stars-input">
                        {[1, 2, 3, 4, 5].map(n => (
                          <button key={n} className={`pd__star-btn ${n <= ratingValue ? 'pd__star-btn--active' : ''}`}
                            onClick={() => setRatingValue(n)}>★</button>
                        ))}
                      </div>
                      <textarea placeholder="Write a review (optional)..." value={reviewText}
                        onChange={e => setReviewText(e.target.value)} rows={3} />
                      <div className="pd__rating-actions">
                        <button className="pd__btn pd__btn--ghost" onClick={() => setShowRating(false)}>Cancel</button>
                        <button className="pd__btn pd__btn--primary" onClick={handleRate} disabled={ratingSubmitting}>
                          {ratingSubmitting ? 'Submitting...' : '📩 Submit'}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetail;
