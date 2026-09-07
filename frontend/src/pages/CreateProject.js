import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { getCostEstimate, createProject } from '../services/api';
import VoiceToProject from '../components/common/VoiceToProject';
import './CreateProject.css';

const PROJECT_TYPES = [
  { value: 'residential', label: 'Residential', icon: '🏠', desc: 'Houses, villas, apartments' },
  { value: 'commercial', label: 'Commercial', icon: '🏢', desc: 'Offices, shops, plazas' },
  { value: 'industrial', label: 'Industrial', icon: '🏭', desc: 'Factories, warehouses' },
  { value: 'renovation', label: 'Renovation', icon: '🔨', desc: 'Remodel existing structures' },
  { value: 'interior', label: 'Interior Design', icon: '🎨', desc: 'Interior & decoration' },
  { value: 'other', label: 'Other', icon: '📦', desc: 'Custom project type' },
];

const PURPOSES_BY_TYPE = {
  residential: [
    { value: 'personal_residence', label: 'Personal Residence' },
    { value: 'rental', label: 'Rental Property' },
    { value: 'investment', label: 'Investment / Resale' },
    { value: 'guest_house', label: 'Guest House' },
    { value: 'other', label: 'Other' },
  ],
  commercial: [
    { value: 'office_space', label: 'Office Space' },
    { value: 'retail_shop', label: 'Retail / Shop' },
    { value: 'restaurant', label: 'Restaurant / Cafe' },
    { value: 'plaza', label: 'Shopping Plaza / Mall' },
    { value: 'hotel', label: 'Hotel / Hospitality' },
    { value: 'other', label: 'Other' },
  ],
  industrial: [
    { value: 'factory', label: 'Factory / Manufacturing' },
    { value: 'warehouse', label: 'Warehouse / Storage' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'cold_storage', label: 'Cold Storage' },
    { value: 'other', label: 'Other' },
  ],
  renovation: [
    { value: 'home_renovation', label: 'Home Renovation' },
    { value: 'office_renovation', label: 'Office Renovation' },
    { value: 'facade_upgrade', label: 'Facade / Exterior Upgrade' },
    { value: 'structural_repair', label: 'Structural Repair' },
    { value: 'other', label: 'Other' },
  ],
  interior: [
    { value: 'home_interior', label: 'Home Interior' },
    { value: 'office_interior', label: 'Office Interior' },
    { value: 'restaurant_interior', label: 'Restaurant / Cafe Interior' },
    { value: 'shop_interior', label: 'Shop / Showroom Interior' },
    { value: 'other', label: 'Other' },
  ],
  other: [
    { value: 'landscaping', label: 'Landscaping' },
    { value: 'boundary_wall', label: 'Boundary Wall / Fencing' },
    { value: 'infrastructure', label: 'Infrastructure' },
    { value: 'consultation', label: 'Consultation Only' },
    { value: 'other', label: 'Other' },
  ],
};

const FEATURES_BY_TYPE = {
  residential: [
    { id: 'basement', label: 'Basement', icon: '🏚️' },
    { id: 'rooftop', label: 'Rooftop Terrace', icon: '🌇' },
    { id: 'garden', label: 'Garden / Lawn', icon: '🌿' },
    { id: 'garage', label: 'Garage / Parking', icon: '🚗' },
    { id: 'pool', label: 'Swimming Pool', icon: '🏊' },
    { id: 'solar', label: 'Solar Panels', icon: '☀️' },
    { id: 'elevator', label: 'Elevator', icon: '🛗' },
    { id: 'servant_quarter', label: 'Servant Quarter', icon: '🏘️' },
    { id: 'boundary_wall', label: 'Boundary Wall', icon: '🧱' },
    { id: 'water_tank', label: 'Underground Water Tank', icon: '💧' },
    { id: 'security', label: 'Security Room', icon: '🔒' },
    { id: 'rainwater', label: 'Rainwater Harvesting', icon: '🌧️' },
    { id: 'central_ac', label: 'Central AC / HVAC', icon: '❄️' },
    { id: 'backup_power', label: 'Backup Generator / UPS', icon: '⚡' },
    { id: 'cctv', label: 'CCTV / Smart Security', icon: '📹' },
    { id: 'smart_home', label: 'Smart Home System', icon: '📱' },
    { id: 'open_kitchen', label: 'Open Kitchen', icon: '🍳' },
    { id: 'store_room', label: 'Store Room', icon: '📦' },
    { id: 'prayer_room', label: 'Prayer Room', icon: '🕌' },
    { id: 'laundry', label: 'Laundry Area', icon: '🧺' },
    { id: 'porch', label: 'Car Porch', icon: '🚘' },
    { id: 'balcony', label: 'Balcony', icon: '🏙️' },
    { id: 'fireplace', label: 'Fireplace', icon: '🔥' },
    { id: 'home_theater', label: 'Home Theater', icon: '🎬' },
    { id: 'gym', label: 'Home Gym', icon: '🏋️' },
  ],
  commercial: [
    { id: 'elevator', label: 'Elevator / Escalator', icon: '🛗' },
    { id: 'parking', label: 'Parking Lot / Basement Parking', icon: '🅿️' },
    { id: 'central_ac', label: 'Central AC / HVAC', icon: '❄️' },
    { id: 'fire_safety', label: 'Fire Safety System', icon: '🧯' },
    { id: 'backup_power', label: 'Backup Generator', icon: '⚡' },
    { id: 'cctv', label: 'CCTV System', icon: '📹' },
    { id: 'reception', label: 'Reception / Lobby', icon: '🛎️' },
    { id: 'conference', label: 'Conference Room', icon: '📊' },
    { id: 'server_room', label: 'Server / IT Room', icon: '🖥️' },
    { id: 'cafeteria', label: 'Cafeteria / Pantry', icon: '☕' },
    { id: 'washrooms', label: 'Public Washrooms', icon: '🚻' },
    { id: 'loading_area', label: 'Loading / Delivery Area', icon: '🚛' },
    { id: 'signage', label: 'Digital Signage / LED', icon: '📺' },
    { id: 'solar', label: 'Solar Panels', icon: '☀️' },
    { id: 'access_control', label: 'Access Control System', icon: '🔐' },
    { id: 'prayer_area', label: 'Prayer Area', icon: '🕌' },
    { id: 'atm', label: 'ATM Space', icon: '🏧' },
    { id: 'open_floor', label: 'Open Floor Plan', icon: '📐' },
  ],
  industrial: [
    { id: 'loading_dock', label: 'Loading Dock', icon: '🚛' },
    { id: 'heavy_power', label: 'Heavy Power Supply', icon: '⚡' },
    { id: 'ventilation', label: 'Industrial Ventilation', icon: '🌀' },
    { id: 'drainage', label: 'Drainage System', icon: '🚰' },
    { id: 'fire_safety', label: 'Fire Safety System', icon: '🧯' },
    { id: 'security', label: 'Security System', icon: '🔒' },
    { id: 'crane', label: 'Overhead Crane', icon: '🏗️' },
    { id: 'cold_storage', label: 'Cold Storage', icon: '🧊' },
    { id: 'waste_mgmt', label: 'Waste Management', icon: '♻️' },
    { id: 'office_block', label: 'Office Block', icon: '🏢' },
    { id: 'water_treatment', label: 'Water Treatment', icon: '💧' },
    { id: 'chemical_storage', label: 'Chemical Storage', icon: '🧪' },
    { id: 'staff_quarters', label: 'Staff Quarters', icon: '🏘️' },
    { id: 'weighbridge', label: 'Weighbridge', icon: '⚖️' },
    { id: 'boundary_wall', label: 'Boundary Wall / Fencing', icon: '🧱' },
    { id: 'parking', label: 'Vehicle Parking', icon: '🅿️' },
  ],
  renovation: [
    { id: 'structural', label: 'Structural Changes', icon: '🏗️' },
    { id: 'electrical', label: 'Electrical Rewiring', icon: '🔌' },
    { id: 'plumbing', label: 'Plumbing Update', icon: '🔧' },
    { id: 'flooring', label: 'New Flooring', icon: '🪵' },
    { id: 'painting', label: 'Painting', icon: '🎨' },
    { id: 'kitchen', label: 'Kitchen Remodel', icon: '🍳' },
    { id: 'bathroom', label: 'Bathroom Remodel', icon: '🚿' },
    { id: 'roof_repair', label: 'Roof Repair / Waterproofing', icon: '🏠' },
    { id: 'window_doors', label: 'Windows & Doors', icon: '🪟' },
    { id: 'false_ceiling', label: 'False Ceiling', icon: '✨' },
    { id: 'ac_upgrade', label: 'AC / HVAC Upgrade', icon: '❄️' },
    { id: 'insulation', label: 'Thermal Insulation', icon: '🧊' },
    { id: 'extension', label: 'Room Extension', icon: '📐' },
    { id: 'demolition', label: 'Partial Demolition', icon: '🔨' },
    { id: 'exterior', label: 'Exterior / Facade', icon: '🏛️' },
    { id: 'damp_proofing', label: 'Damp Proofing', icon: '💧' },
  ],
  interior: [
    { id: 'furniture', label: 'Custom Furniture', icon: '🪑' },
    { id: 'lighting', label: 'Lighting Design', icon: '💡' },
    { id: 'false_ceiling', label: 'False Ceiling', icon: '✨' },
    { id: 'flooring', label: 'Flooring', icon: '🪵' },
    { id: 'kitchen_design', label: 'Modular Kitchen', icon: '🍳' },
    { id: 'curtains', label: 'Curtains & Blinds', icon: '🪟' },
    { id: 'wallpaper', label: 'Wallpaper / Wall Paneling', icon: '🖼️' },
    { id: 'wardrobe', label: 'Built-in Wardrobes', icon: '👔' },
    { id: 'tv_unit', label: 'TV Unit / Media Wall', icon: '📺' },
    { id: 'bathroom_design', label: 'Bathroom Design', icon: '🚿' },
    { id: 'color_scheme', label: 'Color Consultation', icon: '🎨' },
    { id: 'smart_home', label: 'Smart Home Integration', icon: '📱' },
    { id: 'partition', label: 'Room Partitions', icon: '🚪' },
    { id: 'mirror_work', label: 'Mirror / Glass Work', icon: '🪞' },
    { id: 'staircase', label: 'Staircase Design', icon: '🪜' },
    { id: 'outdoor_living', label: 'Outdoor Living Space', icon: '🌿' },
  ],
  other: [
    { id: 'landscaping', label: 'Landscaping', icon: '🌿' },
    { id: 'boundary_wall', label: 'Boundary Wall / Fencing', icon: '🧱' },
    { id: 'solar', label: 'Solar Installation', icon: '☀️' },
    { id: 'pool', label: 'Swimming Pool', icon: '🏊' },
    { id: 'paving', label: 'Paving / Driveway', icon: '🛤️' },
    { id: 'water_supply', label: 'Water Supply System', icon: '💧' },
    { id: 'sewerage', label: 'Sewerage / Drainage', icon: '🚰' },
    { id: 'electrical', label: 'Electrical Work', icon: '🔌' },
    { id: 'security', label: 'Security System', icon: '🔒' },
    { id: 'consultation', label: 'Expert Consultation', icon: '📋' },
  ],
};

const STYLES = [
  { value: 'modern', label: 'Modern', icon: '🏙️' },
  { value: 'traditional', label: 'Traditional', icon: '🕌' },
  { value: 'minimalist', label: 'Minimalist', icon: '⬜' },
  { value: 'contemporary', label: 'Contemporary', icon: '🏗️' },
  { value: 'luxury', label: 'Luxury', icon: '👑' },
  { value: 'colonial', label: 'Colonial', icon: '🏛️' },
  { value: 'mediterranean', label: 'Mediterranean', icon: '🌊' },
  { value: 'farmhouse', label: 'Farmhouse', icon: '🏡' },
];

const PROFESSIONAL_TYPES = [
  { value: 'architect', label: 'Architect', icon: '📐', desc: 'Design aesthetics & space planning' },
  { value: 'civil_engineer', label: 'Civil Engineer', icon: '🏗️', desc: 'Structural design & AutoCAD' },
  { value: 'structural_engineer', label: 'Structural Engineer', icon: '🔩', desc: 'Load-bearing & foundations' },
  { value: 'interior_designer', label: 'Interior Designer', icon: '🎨', desc: 'Interior layouts & finishes' },
  { value: 'autocad_specialist', label: 'AutoCAD Specialist', icon: '💻', desc: '2D/3D technical drawings' },
];

const CreateProject = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiEstimate, setAiEstimate] = useState(null);
  const [estimating, setEstimating] = useState(false);
  const [showVoice, setShowVoice] = useState(false);

  const handleVoiceResult = (data) => {
    setShowVoice(false);
    setForm(prev => ({
      ...prev,
      title: data.title || prev.title,
      description: data.description || prev.description,
      projectType: data.projectType || prev.projectType,
      customProjectType: data.customProjectType || prev.customProjectType,
      purpose: data.purpose || prev.purpose,
      location: {
        city: data.location?.city || prev.location.city,
        state: data.location?.state || prev.location.state,
        country: data.location?.country || 'Pakistan',
      },
      budgetMin: data.budgetMin || prev.budgetMin,
      budgetMax: data.budgetMax || prev.budgetMax,
      floors: data.floors || prev.floors,
      bedrooms: data.rooms || prev.bedrooms,
      bathrooms: data.bathrooms || prev.bathrooms,
      plotSize: data.plotSize || prev.plotSize,
      plotUnit: data.plotUnit || prev.plotUnit,
      style: data.style || prev.style,
      selectedFeatures: data.features?.length ? data.features : prev.selectedFeatures,
      customFeatures: data.customFeatures?.length ? data.customFeatures : prev.customFeatures,
      structuralType: data.structuralType || prev.structuralType,
      timelineWeeks: data.timelineWeeks || prev.timelineWeeks,
    }));
    toast.info(`✨ AI confidence: ${Math.round((data.confidence || 0.8) * 100)}% — review and adjust the details below`);
  };

  const [form, setForm] = useState({
    title: '',
    description: '',
    projectType: '',
    customProjectType: '',
    purpose: '',
    location: { city: '', state: '', country: 'Pakistan' },
    budgetMin: '',
    budgetMax: '',
    timelineWeeks: '',
    expectedStart: '',
    // Features
    floors: 1,
    bedrooms: 3,
    bathrooms: 2,
    plotSize: '',
    plotUnit: 'marla',
    style: '',
    selectedFeatures: [],
    customFeatures: [],
    customFeatureInput: '',
    structuralType: 'rcc', // rcc, steel, loadbearing
    sustainabilityFeatures: [],
    // Professional preferences
    professionalType: '',
    filters: {
      minExperience: '',
      minRating: '',
      maxPrice: '',
      location: '',
      remote: true,
      maxTurnaround: '',
      verifiedOnly: true,
      language: 'English',
    },
    autoMatch: false,
  });

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const updateNested = (parent, field, value) => {
    setForm(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value },
    }));
  };

  const toggleFeature = (featureId) => {
    setForm(prev => ({
      ...prev,
      selectedFeatures: prev.selectedFeatures.includes(featureId)
        ? prev.selectedFeatures.filter(f => f !== featureId)
        : [...prev.selectedFeatures, featureId],
    }));
  };

  const totalSteps = 5;

  const getAIEstimate = async () => {
    const desc = `${form.description} ${form.projectType} ${form.floors} floors ${form.bedrooms} rooms ${form.bathrooms} bathrooms ${form.plotSize} ${form.plotUnit} ${form.style} style with ${form.selectedFeatures.join(', ')} ${form.customFeatures.join(', ')}`;
    setEstimating(true);
    try {
      const res = await getCostEstimate({ description: desc, city: form.location.city || 'Lahore' });
      if (res.data.success) {
        setAiEstimate(res.data);
        toast.success(res.data.aiPowered ? '🤖 AI estimate generated!' : '📊 Estimate generated!');
      }
    } catch {
      toast.error('Could not generate estimate. Backend may be offline.');
    }
    setEstimating(false);
  };

  const submitProject = async (status = 'posted') => {
    try {
      const projectData = {
        title: form.title,
        description: form.description,
        projectType: form.projectType === 'other' ? (form.customProjectType || 'other') : form.projectType,
        location: { city: form.location.city, state: form.location.state, country: 'Pakistan' },
        budget: { min: form.budgetMin ? parseInt(form.budgetMin) : undefined, max: form.budgetMax ? parseInt(form.budgetMax) : undefined },
        requirements: {
          floors: form.floors,
          rooms: form.bedrooms,
          bathrooms: form.bathrooms,
          plotSize: form.plotSize,
          plotUnit: form.plotUnit,
          structuralType: form.structuralType,
          style: form.style,
          features: form.selectedFeatures,
          customFeatures: form.customFeatures,
        },
        purpose: form.purpose,
        status,
      };
      await createProject(projectData);
      toast.success(status === 'draft' ? '📝 Project saved as draft!' : '🎉 Project posted successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    }
  };

  const handleSubmit = () => submitProject('posted');
  const handleSaveDraft = () => submitProject('draft');

  const formatPKR = (n) => new Intl.NumberFormat('en-PK').format(n);
  const progress = (step / totalSteps) * 100;

  if (!user || user.role !== 'customer') {
    return (
      <div className="create-project" style={{ paddingTop: '120px', textAlign: 'center' }}>
        <h2>Only customers can create projects</h2>
      </div>
    );
  }

  return (
    <div className="create-project">
      <div className="create-project__container">
        <div className="create-project__header">
          <h1>Create New Project</h1>
          <p>Step {step} of {totalSteps}</p>
        </div>

        <div className="create-project__progress">
          <div className="create-project__progress-bar" style={{ width: `${progress}%` }}></div>
        </div>

        <div className="create-project__steps-nav">
          {['Project Info', 'Features', 'AI Estimate', 'Find Professional', 'Review'].map((label, i) => (
            <div
              key={i}
              className={`create-project__step-nav ${i + 1 <= step ? 'active' : ''} ${i + 1 < step ? 'done' : ''}`}
              onClick={() => i + 1 < step && setStep(i + 1)}
            >
              <div className="create-project__step-dot">{i + 1 < step ? '✓' : i + 1}</div>
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* STEP 1: Project Info */}
        {step === 1 && (
          <div className="create-project__section fade-in">
            <div className="vtp-banner" onClick={() => setShowVoice(true)}>
              <div className="vtp-banner__icon">🎤</div>
              <div className="vtp-banner__text">
                <strong>Describe your project by voice or text</strong>
                <span>Speak in Urdu or English — AI fills the form for you</span>
              </div>
              <div className="vtp-banner__arrow">→</div>
            </div>
            <h2 className="create-project__section-title"><span>📋</span> Project Details</h2>

            <div className="form-group">
              <label>Project Type <span className="required">*</span></label>
              <div className="type-grid">
                {PROJECT_TYPES.map(t => (
                  <div
                    key={t.value}
                    className={`type-card ${form.projectType === t.value ? 'selected' : ''}`}
                    onClick={() => { updateField('projectType', t.value); updateField('purpose', ''); }}
                  >
                    <span className="type-card__icon">{t.icon}</span>
                    <span className="type-card__label">{t.label}</span>
                    <span className="type-card__desc">{t.desc}</span>
                  </div>
                ))}
              </div>
              {form.projectType === 'other' && (
                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label>Specify Your Project Type <span className="required">*</span></label>
                  <input type="text" value={form.customProjectType} onChange={e => updateField('customProjectType', e.target.value)}
                    placeholder="e.g. Landscaping, Swimming Pool, Solar Installation..." />
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Project Title <span className="required">*</span></label>
              <input type="text" value={form.title} onChange={e => updateField('title', e.target.value)}
                placeholder="e.g. Modern 2-Story House in DHA Lahore" />
            </div>

            <div className="form-group">
              <label>Describe Your Project <span style={{ color: '#94a3b8', fontSize: '12px' }}>(optional)</span></label>
              <textarea value={form.description} onChange={e => updateField('description', e.target.value)}
                placeholder="Describe what you want to build in your own words. Our AI will parse this and generate estimates. e.g. I want to build a modern 2-story house on a 10 marla plot in DHA Phase 6, Lahore. 4 bedrooms, 3 bathrooms, an open kitchen, drawing room, lounge, basement parking, and a rooftop terrace..."
                rows={5} />
            </div>

            <div className="form-group">
              <label>Purpose</label>
              <select value={form.purpose} onChange={e => updateField('purpose', e.target.value)}>
                <option value="">Select purpose...</option>
                {(PURPOSES_BY_TYPE[form.projectType] || PURPOSES_BY_TYPE.other).map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <h3 className="create-project__sub-title">📍 Location</h3>
            <div className="form-row">
              <div className="form-group">
                <label>City <span className="required">*</span></label>
                <input type="text" value={form.location.city} onChange={e => updateNested('location', 'city', e.target.value)}
                  placeholder="e.g. Lahore" />
              </div>
              <div className="form-group">
                <label>State/Province</label>
                <input type="text" value={form.location.state} onChange={e => updateNested('location', 'state', e.target.value)}
                  placeholder="e.g. Punjab" />
              </div>
            </div>

            <h3 className="create-project__sub-title">💰 Budget & Timeline</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Min Budget (PKR)</label>
                <input type="number" value={form.budgetMin} onChange={e => {
                  const val = e.target.value;
                  updateField('budgetMin', val);
                  if (val && form.budgetMax && parseInt(val) > parseInt(form.budgetMax)) {
                    updateField('budgetMax', val);
                  }
                }}
                  placeholder="e.g. 5000000" min="0" />
                {form.budgetMin && form.budgetMax && parseInt(form.budgetMin) > parseInt(form.budgetMax) && (
                  <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>Min cannot exceed max budget</span>
                )}
              </div>
              <div className="form-group">
                <label>Max Budget (PKR)</label>
                <input type="number" value={form.budgetMax} onChange={e => {
                  const val = e.target.value;
                  updateField('budgetMax', val);
                  if (val && form.budgetMin && parseInt(val) < parseInt(form.budgetMin)) {
                    updateField('budgetMin', val);
                  }
                }}
                  placeholder="e.g. 15000000" min="0" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Timeline (weeks)</label>
                <input type="number" value={form.timelineWeeks} onChange={e => updateField('timelineWeeks', e.target.value)}
                  placeholder="e.g. 24" />
              </div>
              <div className="form-group">
                <label>Expected Start Date</label>
                <input type="date" value={form.expectedStart} onChange={e => updateField('expectedStart', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Features Checklist */}
        {step === 2 && (
          <div className="create-project__section fade-in">
            <h2 className="create-project__section-title"><span>✅</span> Requirements & Features</h2>

            <div className="form-row form-row--3">
              <div className="form-group">
                <label>Number of Floors</label>
                <div className="number-stepper">
                  <button type="button" onClick={() => updateField('floors', Math.max(1, form.floors - 1))}>−</button>
                  <span>{form.floors}</span>
                  <button type="button" onClick={() => updateField('floors', Math.min(10, form.floors + 1))}>+</button>
                </div>
              </div>
              <div className="form-group">
                <label>Rooms</label>
                <div className="number-stepper">
                  <button type="button" onClick={() => updateField('bedrooms', Math.max(0, form.bedrooms - 1))}>−</button>
                  <span>{form.bedrooms}</span>
                  <button type="button" onClick={() => updateField('bedrooms', Math.min(50, form.bedrooms + 1))}>+</button>
                </div>
              </div>
              <div className="form-group">
                <label>Bathrooms</label>
                <div className="number-stepper">
                  <button type="button" onClick={() => updateField('bathrooms', Math.max(0, form.bathrooms - 1))}>−</button>
                  <span>{form.bathrooms}</span>
                  <button type="button" onClick={() => updateField('bathrooms', Math.min(50, form.bathrooms + 1))}>+</button>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Plot / Area Size</label>
                <div className="input-with-unit">
                  <input type="number" value={form.plotSize} onChange={e => updateField('plotSize', e.target.value)} placeholder="e.g. 10" />
                  <select value={form.plotUnit} onChange={e => updateField('plotUnit', e.target.value)}>
                    <option value="marla">Marla</option>
                    <option value="kanal">Kanal</option>
                    <option value="sqft">Sq. Ft</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Structural Type</label>
                <select value={form.structuralType} onChange={e => updateField('structuralType', e.target.value)}>
                  <option value="rcc">RCC (Reinforced Concrete)</option>
                  <option value="steel">Steel Structure</option>
                  <option value="loadbearing">Load Bearing</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Style Preference</label>
              <div className="style-grid">
                {STYLES.map(s => (
                  <div
                    key={s.value}
                    className={`style-card ${form.style === s.value ? 'selected' : ''}`}
                    onClick={() => updateField('style', s.value)}
                  >
                    <span>{s.icon}</span>
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Features & Requirements</label>
              <div className="feature-checklist">
                {(FEATURES_BY_TYPE[form.projectType] || FEATURES_BY_TYPE.residential).map(f => (
                  <div
                    key={f.id}
                    className={`feature-check ${form.selectedFeatures.includes(f.id) ? 'selected' : ''}`}
                    onClick={() => toggleFeature(f.id)}
                  >
                    <div className="feature-check__box">
                      {form.selectedFeatures.includes(f.id) && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                      )}
                    </div>
                    <span className="feature-check__icon">{f.icon}</span>
                    <span className="feature-check__label">{f.label}</span>
                  </div>
                ))}
                {/* Custom features */}
                {form.customFeatures.map((cf, i) => (
                  <div key={`custom-${i}`} className="feature-check selected">
                    <div className="feature-check__box">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                    </div>
                    <span className="feature-check__icon">✏️</span>
                    <span className="feature-check__label">{cf}</span>
                    <span
                      style={{ marginLeft: 'auto', cursor: 'pointer', fontSize: '16px', color: '#ef4444' }}
                      onClick={() => setForm(prev => ({ ...prev, customFeatures: prev.customFeatures.filter((_, j) => j !== i) }))}
                    >×</span>
                  </div>
                ))}
              </div>
              {/* Add custom feature */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <input
                  type="text"
                  value={form.customFeatureInput}
                  onChange={e => updateField('customFeatureInput', e.target.value)}
                  placeholder="Add custom requirement..."
                  onKeyDown={e => {
                    if (e.key === 'Enter' && form.customFeatureInput.trim()) {
                      e.preventDefault();
                      setForm(prev => ({
                        ...prev,
                        customFeatures: [...prev.customFeatures, prev.customFeatureInput.trim()],
                        customFeatureInput: '',
                      }));
                    }
                  }}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn-form btn-form--secondary"
                  style={{ whiteSpace: 'nowrap' }}
                  onClick={() => {
                    if (form.customFeatureInput.trim()) {
                      setForm(prev => ({
                        ...prev,
                        customFeatures: [...prev.customFeatures, prev.customFeatureInput.trim()],
                        customFeatureInput: '',
                      }));
                    }
                  }}
                >+ Add</button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: AI Estimate */}
        {step === 3 && (
          <div className="create-project__section fade-in">
            <h2 className="create-project__section-title"><span>🤖</span> AI Cost Estimation</h2>
            <p className="create-project__section-desc">
              Our Gemini AI analyzes your requirements and generates a detailed, localized cost estimate.
            </p>

            <div className="ai-estimate-summary">
              <h3>Your Project Summary</h3>
              <div className="ai-estimate-summary__tags">
                <span className="tag">🏠 {form.projectType === 'other' ? (form.customProjectType || 'Other') : (PROJECT_TYPES.find(t => t.value === form.projectType)?.label || 'residential')}</span>
                {form.floors > 0 && <span className="tag">🏢 {form.floors} floors</span>}
                {form.bedrooms > 0 && <span className="tag">🛏️ {form.bedrooms} rooms</span>}
                {form.bathrooms > 0 && <span className="tag">🚿 {form.bathrooms} baths</span>}
                {form.plotSize && <span className="tag">📏 {form.plotSize} {form.plotUnit}</span>}
                {form.style && <span className="tag">✨ {STYLES.find(s => s.value === form.style)?.label || form.style}</span>}
                {form.location.city && <span className="tag">📍 {form.location.city}</span>}
                {form.selectedFeatures.map(f => {
                  const feat = (FEATURES_BY_TYPE[form.projectType] || FEATURES_BY_TYPE.residential).find(ft => ft.id === f);
                  return <span key={f} className="tag tag--accent">⭐ {feat ? feat.label : f.replace(/_/g, ' ')}</span>;
                })}
                {form.customFeatures.map((cf, i) => <span key={`cf-${i}`} className="tag tag--accent">✏️ {cf}</span>)}
              </div>
            </div>

            <button
              className="btn-form btn-form--primary ai-estimate-btn"
              onClick={getAIEstimate}
              disabled={estimating}
            >
              {estimating ? (
                <><span className="spinner"></span> Gemini AI is analyzing...</>
              ) : aiEstimate ? (
                '🔄 Re-generate Estimate'
              ) : (
                '🤖 Generate AI Estimate'
              )}
            </button>

            {aiEstimate && (
              <div className="ai-result-card">
                <div className="ai-result-card__header">
                  <h3>{aiEstimate.aiPowered ? '🤖 Gemini AI Estimate' : '📊 Estimate'}</h3>
                  {aiEstimate.aiPowered && <span className="tag tag--accent">✨ AI Powered</span>}
                  <span className="estimator__confidence">
                    {Math.round((aiEstimate.estimate?.confidence || 0.75) * 100)}% confidence
                  </span>
                </div>

                <div className="ai-result-card__range">
                  <span className="ai-result-card__range-label">Estimated Cost Range</span>
                  <span className="ai-result-card__range-value">
                    PKR {formatPKR(aiEstimate.estimate?.min)} — {formatPKR(aiEstimate.estimate?.max)}
                  </span>
                </div>

                {aiEstimate.estimate?.breakdown && (
                  <div className="ai-result-card__breakdown">
                    {Object.entries(aiEstimate.estimate.breakdown).map(([key, val]) => (
                      <div key={key} className="ai-result-card__breakdown-row">
                        <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                        <div className="ai-result-card__breakdown-bar">
                          <div style={{ width: `${(val / aiEstimate.estimate.max) * 100}%` }}></div>
                        </div>
                        <span>PKR {formatPKR(val)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {aiEstimate.estimatedTimeline && (
                  <div className="ai-result-card__timeline">
                    <h4>⏱️ Estimated Timeline</h4>
                    <div className="ai-result-card__timeline-items">
                      {aiEstimate.estimatedTimeline.designWeeks && <span className="tag">📐 Design: {aiEstimate.estimatedTimeline.designWeeks} weeks</span>}
                      {aiEstimate.estimatedTimeline.constructionMonths && <span className="tag">🏗️ Build: {aiEstimate.estimatedTimeline.constructionMonths} months</span>}
                      {aiEstimate.estimatedTimeline.totalMonths && <span className="tag tag--accent">📅 Total: {aiEstimate.estimatedTimeline.totalMonths} months</span>}
                    </div>
                  </div>
                )}

                {aiEstimate.recommendations?.length > 0 && (
                  <div className="ai-result-card__recs">
                    <h4>💡 AI Recommendations</h4>
                    <ul>
                      {aiEstimate.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Find Professional */}
        {step === 4 && (
          <div className="create-project__section fade-in">
            <h2 className="create-project__section-title"><span>🎯</span> Find a Professional</h2>
            <p className="create-project__section-desc">
              Choose the type of professional you need and set your preferences. Our AI will match you with the best fit.
            </p>

            <div className="form-group">
              <label>Professional Type Needed <span className="required">*</span></label>
              <div className="professional-grid">
                {PROFESSIONAL_TYPES.map(p => (
                  <div
                    key={p.value}
                    className={`professional-card ${form.professionalType === p.value ? 'selected' : ''}`}
                    onClick={() => updateField('professionalType', p.value)}
                  >
                    <span className="professional-card__icon">{p.icon}</span>
                    <div>
                      <span className="professional-card__label">{p.label}</span>
                      <span className="professional-card__desc">{p.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <h3 className="create-project__sub-title">🔧 Filter Preferences</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Minimum Experience (years)</label>
                <input type="number" value={form.filters.minExperience}
                  onChange={e => updateNested('filters', 'minExperience', e.target.value)}
                  placeholder="e.g. 5" min="0" />
              </div>
              <div className="form-group">
                <label>Minimum Rating</label>
                <select value={form.filters.minRating}
                  onChange={e => updateNested('filters', 'minRating', e.target.value)}>
                  <option value="">Any rating</option>
                  <option value="3">3+ stars</option>
                  <option value="3.5">3.5+ stars</option>
                  <option value="4">4+ stars</option>
                  <option value="4.5">4.5+ stars</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Max Price (PKR)</label>
                <input type="number" value={form.filters.maxPrice}
                  onChange={e => updateNested('filters', 'maxPrice', e.target.value)}
                  placeholder="e.g. 200000" />
              </div>
              <div className="form-group">
                <label>Preferred Location</label>
                <input type="text" value={form.filters.location}
                  onChange={e => updateNested('filters', 'location', e.target.value)}
                  placeholder="e.g. Lahore" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Max Turnaround (days)</label>
                <input type="number" value={form.filters.maxTurnaround}
                  onChange={e => updateNested('filters', 'maxTurnaround', e.target.value)}
                  placeholder="e.g. 14" />
              </div>
              <div className="form-group">
                <label>Preferred Language</label>
                <select value={form.filters.language}
                  onChange={e => updateNested('filters', 'language', e.target.value)}>
                  <option value="English">English</option>
                  <option value="Urdu">Urdu</option>
                  <option value="Punjabi">Punjabi</option>
                  <option value="Any">Any</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="toggle-label">
                  <span>Open to Remote Professionals</span>
                  <div className={`toggle ${form.filters.remote ? 'toggle--on' : ''}`}
                    onClick={() => updateNested('filters', 'remote', !form.filters.remote)}>
                    <div className="toggle__knob"></div>
                  </div>
                </label>
              </div>
              <div className="form-group">
                <label className="toggle-label">
                  <span>Verified Professionals Only</span>
                  <div className={`toggle ${form.filters.verifiedOnly ? 'toggle--on' : ''}`}
                    onClick={() => updateNested('filters', 'verifiedOnly', !form.filters.verifiedOnly)}>
                    <div className="toggle__knob"></div>
                  </div>
                </label>
              </div>
            </div>

            <div className="matching-option">
              <div
                className={`matching-option__card ${!form.autoMatch ? 'selected' : ''}`}
                onClick={() => updateField('autoMatch', false)}
              >
                <span className="matching-option__icon">🔍</span>
                <h4>Browse & Select</h4>
                <p>View AI-ranked matches and choose your professional</p>
              </div>
              <div
                className={`matching-option__card ${form.autoMatch ? 'selected' : ''}`}
                onClick={() => updateField('autoMatch', true)}
              >
                <span className="matching-option__icon">🤖</span>
                <h4>Auto-Assign</h4>
                <p>Let our AI pick the best match for your project</p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Review */}
        {step === 5 && (
          <div className="create-project__section fade-in">
            <h2 className="create-project__section-title"><span>📋</span> Review & Submit</h2>

            <div className="review-section">
              <div className="review-section__card">
                <h3>Project Details</h3>
                <div className="review-section__grid">
                  <div className="review-section__item">
                    <span className="review-section__label">Title</span>
                    <span className="review-section__value">{form.title || '—'}</span>
                  </div>
                  <div className="review-section__item">
                    <span className="review-section__label">Type</span>
                    <span className="review-section__value">{PROJECT_TYPES.find(t => t.value === form.projectType)?.label || '—'}</span>
                  </div>
                  <div className="review-section__item">
                    <span className="review-section__label">Location</span>
                    <span className="review-section__value">{form.location.city || '—'}, {form.location.state || ''}</span>
                  </div>
                  <div className="review-section__item">
                    <span className="review-section__label">Budget</span>
                    <span className="review-section__value">
                      {form.budgetMin || form.budgetMax
                        ? `PKR ${formatPKR(form.budgetMin || 0)} — ${formatPKR(form.budgetMax || 0)}`
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="review-section__card">
                <h3>Requirements</h3>
                <div className="review-section__tags">
                  {form.floors > 0 && <span className="tag">🏢 {form.floors} floors</span>}
                  {form.bedrooms > 0 && <span className="tag">🛏️ {form.bedrooms} rooms</span>}
                  {form.bathrooms > 0 && <span className="tag">🚿 {form.bathrooms} bathrooms</span>}
                  {form.plotSize && <span className="tag">📏 {form.plotSize} {form.plotUnit}</span>}
                  {form.style && <span className="tag">✨ {STYLES.find(s => s.value === form.style)?.label || form.style}</span>}
                  {form.selectedFeatures.map(f => {
                    const feat = (FEATURES_BY_TYPE[form.projectType] || FEATURES_BY_TYPE.residential).find(ft => ft.id === f);
                    return <span key={f} className="tag tag--accent">⭐ {feat ? feat.label : f.replace(/_/g, ' ')}</span>;
                  })}
                  {form.customFeatures.map((cf, i) => <span key={`cf-${i}`} className="tag tag--accent">✏️ {cf}</span>)}
                </div>
              </div>

              {aiEstimate && (
                <div className="review-section__card review-section__card--highlight">
                  <h3>🤖 AI Cost Estimate</h3>
                  <p className="review-section__estimate">
                    PKR {formatPKR(aiEstimate.estimate?.min)} — {formatPKR(aiEstimate.estimate?.max)}
                  </p>
                </div>
              )}

              <div className="review-section__card">
                <h3>Professional Preferences</h3>
                <div className="review-section__grid">
                  <div className="review-section__item">
                    <span className="review-section__label">Type</span>
                    <span className="review-section__value">{PROFESSIONAL_TYPES.find(p => p.value === form.professionalType)?.label || '—'}</span>
                  </div>
                  <div className="review-section__item">
                    <span className="review-section__label">Matching</span>
                    <span className="review-section__value">{form.autoMatch ? '🤖 Auto-Assign' : '🔍 Browse & Select'}</span>
                  </div>
                  <div className="review-section__item">
                    <span className="review-section__label">Verified Only</span>
                    <span className="review-section__value">{form.filters.verifiedOnly ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="review-section__item">
                    <span className="review-section__label">Remote OK</span>
                    <span className="review-section__value">{form.filters.remote ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="review-notice">
              <span>ℹ️</span>
              <p>Once submitted, your project will be posted and AI-matched professionals will be notified. You can review matches and select your preferred professional.</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="create-project__actions">
          {step > 1 && (
            <button type="button" className="btn-form btn-form--secondary" onClick={() => setStep(step - 1)}>
              ← Back
            </button>
          )}
          <div style={{ flex: 1 }}></div>
          {step < totalSteps ? (
            <button type="button" className="btn-form btn-form--primary" onClick={() => setStep(step + 1)}>
              Continue →
            </button>
          ) : (
            <>
              <button type="button" className="btn-form btn-form--secondary" onClick={handleSaveDraft} disabled={loading}>
                📝 Save as Draft
              </button>
              <button type="button" className="btn-form btn-form--submit" onClick={handleSubmit} disabled={loading}>
                {loading ? <><span className="spinner"></span> Submitting...</> : '🚀 Post Project'}
              </button>
            </>
          )}
        </div>
      </div>
      {showVoice && <VoiceToProject onResult={handleVoiceResult} onClose={() => setShowVoice(false)} />}
    </div>
  );
};

export default CreateProject;
