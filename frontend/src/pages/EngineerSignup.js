import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { registerEngineer } from '../services/api';
import './EngineerSignup.css';

const SPECIALIZATIONS = [
  { value: 'civil_engineer', label: 'Civil Engineer', icon: '🏗️' },
  { value: 'structural_engineer', label: 'Structural Engineer', icon: '🔩' },
  { value: 'architect', label: 'Architect', icon: '📐' },
  { value: 'interior_designer', label: 'Interior Designer', icon: '🎨' },
  { value: 'autocad_specialist', label: 'AutoCAD Specialist', icon: '💻' },
  { value: 'geotechnical_engineer', label: 'Geotechnical Engineer', icon: '🌍' },
  { value: 'environmental_engineer', label: 'Environmental Engineer', icon: '🌱' },
];

const SOFTWARE_OPTIONS = [
  'AutoCAD', 'Revit', 'SketchUp', 'ETABS', 'SAP2000',
  'STAAD.Pro', 'SolidWorks', 'Rhino', '3ds Max',
  'Lumion', 'ArchiCAD', 'Civil 3D', 'Tekla', 'SAFE',
];

const EngineerSignup = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '', phone: '',
    specialization: '', title: '', bio: '', licenseNumber: '',
    yearsOfExperience: '', education: [{ degree: '', institution: '', year: '' }],
    skills: [], softwareProficiency: [],
    pricingModel: 'fixed', hourlyRate: '', fixedRateRange: { min: '', max: '' }, perSqftRate: '',
    city: '', state: '', country: 'Pakistan', remoteAvailable: true, languages: ['English'],
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const toggleArrayItem = (field, item) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item],
    }));
  };

  const validateStep = (s) => {
    const errs = {};
    if (s === 1) {
      if (!form.firstName.trim()) errs.firstName = 'Required';
      if (!form.lastName.trim()) errs.lastName = 'Required';
      if (!form.email.trim()) errs.email = 'Required';
      else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
      if (!form.phone.trim()) errs.phone = 'Required';
      if (!form.password) errs.password = 'Required';
      else if (form.password.length < 8) errs.password = 'Min 8 characters';
      if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords don\'t match';
    }
    if (s === 2) {
      if (!form.specialization) errs.specialization = 'Select a specialization';
      if (!form.licenseNumber.trim()) errs.licenseNumber = 'Required';
      if (!form.yearsOfExperience) errs.yearsOfExperience = 'Required';
    }
    if (s === 3) {
      if (!form.city.trim()) errs.city = 'Required';
      if (!form.state.trim()) errs.state = 'Required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const handleSubmit = async () => {
    if (!validateStep(step)) return;
    setLoading(true);
    try {
      const payload = {
        ...form,
        yearsOfExperience: parseInt(form.yearsOfExperience),
        hourlyRate: form.hourlyRate ? parseFloat(form.hourlyRate) : undefined,
        perSqftRate: form.perSqftRate ? parseFloat(form.perSqftRate) : undefined,
        fixedRateRange: form.fixedRateRange.min ? {
          min: parseFloat(form.fixedRateRange.min),
          max: parseFloat(form.fixedRateRange.max),
        } : undefined,
      };
      delete payload.confirmPassword;

      const res = await registerEngineer(payload);
      login(res.data.token, res.data.user, res.data.profile);
      toast.success('🎉 Welcome to BuildLink! Your profile is pending verification.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
    setLoading(false);
  };

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  return (
    <div className="signup-page">
      {/* Left side - decorative */}
      <div className="signup-page__left">
        <div className="signup-page__left-content">
          <div className="signup-page__left-glow"></div>
          <div className="signup-page__left-glow signup-page__left-glow--2"></div>

          <h2 className="signup-page__left-title">
            Join the Future of<br />
            <span className="signup-page__left-gradient">Construction</span>
          </h2>
          <p className="signup-page__left-desc">
            Connect with homeowners through AI-powered matching.
            Get matched to projects that fit your expertise.
          </p>

          <div className="signup-page__left-features">
            {[
              { icon: '🎯', text: 'AI-powered project matching' },
              { icon: '💰', text: 'Secure escrow payments' },
              { icon: '⭐', text: 'Build your verified profile' },
              { icon: '📈', text: 'Grow your client base' },
            ].map((f, i) => (
              <div key={i} className="signup-page__left-feature">
                <span className="signup-page__left-feature-icon">{f.icon}</span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - form */}
      <div className="signup-page__right">
        <div className="signup-form">
          <div className="signup-form__header">
            <h1 className="signup-form__title">Engineer Registration</h1>
            <p className="signup-form__subtitle">Step {step} of {totalSteps}</p>
          </div>

          {/* Progress bar */}
          <div className="signup-form__progress">
            <div className="signup-form__progress-bar" style={{ width: `${progress}%` }}></div>
          </div>

          {/* Step indicators */}
          <div className="signup-form__steps">
            {['Account', 'Professional', 'Location', 'Review'].map((label, i) => (
              <div
                key={i}
                className={`signup-form__step-indicator ${i + 1 <= step ? 'active' : ''} ${i + 1 < step ? 'done' : ''}`}
                onClick={() => i + 1 < step && setStep(i + 1)}
              >
                <div className="signup-form__step-dot">
                  {i + 1 < step ? '✓' : i + 1}
                </div>
                <span className="signup-form__step-label">{label}</span>
              </div>
            ))}
          </div>

          {/* STEP 1 — Account */}
          {step === 1 && (
            <div className="signup-form__section">
              <h2 className="signup-form__section-title">
                <span className="signup-form__section-icon">👤</span>
                Personal Information
              </h2>

              <div className="form-row">
                <div className="form-group">
                  <label>First Name <span className="required">*</span></label>
                  <input type="text" value={form.firstName} onChange={e => updateField('firstName', e.target.value)}
                    placeholder="Saad" className={errors.firstName ? 'error' : ''} />
                  {errors.firstName && <span className="form-error">{errors.firstName}</span>}
                </div>
                <div className="form-group">
                  <label>Last Name <span className="required">*</span></label>
                  <input type="text" value={form.lastName} onChange={e => updateField('lastName', e.target.value)}
                    placeholder="Naveed" className={errors.lastName ? 'error' : ''} />
                  {errors.lastName && <span className="form-error">{errors.lastName}</span>}
                </div>
              </div>

              <div className="form-group">
                <label>Email Address <span className="required">*</span></label>
                <input type="email" value={form.email} onChange={e => updateField('email', e.target.value)}
                  placeholder="saad@example.com" className={errors.email ? 'error' : ''} />
                {errors.email && <span className="form-error">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label>Phone Number <span className="required">*</span></label>
                <input type="tel" value={form.phone} onChange={e => updateField('phone', e.target.value)}
                  placeholder="+92 300 1234567" className={errors.phone ? 'error' : ''} />
                {errors.phone && <span className="form-error">{errors.phone}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Password <span className="required">*</span></label>
                  <div className="input-password">
                    <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => updateField('password', e.target.value)}
                      placeholder="Min 8 characters" className={errors.password ? 'error' : ''} />
                    <button type="button" className="input-password__toggle" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                      {showPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/></svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      )}
                    </button>
                  </div>
                  {errors.password && <span className="form-error">{errors.password}</span>}
                </div>
                <div className="form-group">
                  <label>Confirm Password <span className="required">*</span></label>
                  <div className="input-password">
                    <input type={showConfirmPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={e => updateField('confirmPassword', e.target.value)}
                      placeholder="Re-enter password" className={errors.confirmPassword ? 'error' : ''} />
                    <button type="button" className="input-password__toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)} tabIndex={-1}>
                      {showConfirmPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/></svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — Professional */}
          {step === 2 && (
            <div className="signup-form__section">
              <h2 className="signup-form__section-title">
                <span className="signup-form__section-icon">🏗️</span>
                Professional Details
              </h2>

              <div className="form-group">
                <label>Specialization <span className="required">*</span></label>
                <div className="specialization-grid">
                  {SPECIALIZATIONS.map(s => (
                    <div
                      key={s.value}
                      className={`specialization-card ${form.specialization === s.value ? 'selected' : ''}`}
                      onClick={() => updateField('specialization', s.value)}
                    >
                      <span className="specialization-card__icon">{s.icon}</span>
                      <span className="specialization-card__label">{s.label}</span>
                    </div>
                  ))}
                </div>
                {errors.specialization && <span className="form-error">{errors.specialization}</span>}
              </div>

              <div className="form-group">
                <label>Professional Title</label>
                <input type="text" value={form.title} onChange={e => updateField('title', e.target.value)}
                  placeholder="e.g. Senior Civil Engineer" />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>License Number <span className="required">*</span></label>
                  <input type="text" value={form.licenseNumber} onChange={e => updateField('licenseNumber', e.target.value)}
                    placeholder="PEC-12345" className={errors.licenseNumber ? 'error' : ''} />
                  {errors.licenseNumber && <span className="form-error">{errors.licenseNumber}</span>}
                </div>
                <div className="form-group">
                  <label>Years of Experience <span className="required">*</span></label>
                  <input type="number" value={form.yearsOfExperience} onChange={e => updateField('yearsOfExperience', e.target.value)}
                    placeholder="e.g. 8" min="0" max="60" className={errors.yearsOfExperience ? 'error' : ''} />
                  {errors.yearsOfExperience && <span className="form-error">{errors.yearsOfExperience}</span>}
                </div>
              </div>

              <div className="form-group">
                <label>Bio</label>
                <textarea value={form.bio} onChange={e => updateField('bio', e.target.value)}
                  placeholder="Tell clients about your expertise, approach, and what makes you unique..."
                  rows={3} />
              </div>

              <div className="form-group">
                <label>Software Proficiency</label>
                <div className="chip-grid">
                  {SOFTWARE_OPTIONS.map(sw => (
                    <button
                      key={sw}
                      type="button"
                      className={`chip ${form.softwareProficiency.includes(sw) ? 'chip--selected' : ''}`}
                      onClick={() => toggleArrayItem('softwareProficiency', sw)}
                    >
                      {sw}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Pricing Model</label>
                <div className="pricing-options">
                  {[
                    { value: 'fixed', label: 'Fixed Price', icon: '💵' },
                    { value: 'hourly', label: 'Hourly Rate', icon: '⏰' },
                    { value: 'per_sqft', label: 'Per Sq. Ft', icon: '📏' },
                  ].map(p => (
                    <div
                      key={p.value}
                      className={`pricing-option ${form.pricingModel === p.value ? 'selected' : ''}`}
                      onClick={() => updateField('pricingModel', p.value)}
                    >
                      <span>{p.icon}</span>
                      <span>{p.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {form.pricingModel === 'fixed' && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Min Rate (PKR)</label>
                    <input type="number" value={form.fixedRateRange.min}
                      onChange={e => setForm(prev => ({ ...prev, fixedRateRange: { ...prev.fixedRateRange, min: e.target.value } }))}
                      placeholder="50000" />
                  </div>
                  <div className="form-group">
                    <label>Max Rate (PKR)</label>
                    <input type="number" value={form.fixedRateRange.max}
                      onChange={e => setForm(prev => ({ ...prev, fixedRateRange: { ...prev.fixedRateRange, max: e.target.value } }))}
                      placeholder="500000" />
                  </div>
                </div>
              )}
              {form.pricingModel === 'hourly' && (
                <div className="form-group">
                  <label>Hourly Rate (PKR)</label>
                  <input type="number" value={form.hourlyRate} onChange={e => updateField('hourlyRate', e.target.value)}
                    placeholder="5000" />
                </div>
              )}
              {form.pricingModel === 'per_sqft' && (
                <div className="form-group">
                  <label>Rate per Sq. Ft (PKR)</label>
                  <input type="number" value={form.perSqftRate} onChange={e => updateField('perSqftRate', e.target.value)}
                    placeholder="50" />
                </div>
              )}
            </div>
          )}

          {/* STEP 3 — Location */}
          {step === 3 && (
            <div className="signup-form__section">
              <h2 className="signup-form__section-title">
                <span className="signup-form__section-icon">📍</span>
                Location & Availability
              </h2>

              <div className="form-row">
                <div className="form-group">
                  <label>City <span className="required">*</span></label>
                  <input type="text" value={form.city} onChange={e => updateField('city', e.target.value)}
                    placeholder="Lahore" className={errors.city ? 'error' : ''} />
                  {errors.city && <span className="form-error">{errors.city}</span>}
                </div>
                <div className="form-group">
                  <label>State / Province <span className="required">*</span></label>
                  <input type="text" value={form.state} onChange={e => updateField('state', e.target.value)}
                    placeholder="Punjab" className={errors.state ? 'error' : ''} />
                  {errors.state && <span className="form-error">{errors.state}</span>}
                </div>
              </div>

              <div className="form-group">
                <label>Country</label>
                <select value={form.country} onChange={e => updateField('country', e.target.value)}>
                  <option value="Pakistan">Pakistan</option>
                  <option value="India">India</option>
                  <option value="UAE">UAE</option>
                  <option value="Saudi Arabia">Saudi Arabia</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="toggle-label">
                  <span>Available for Remote Work</span>
                  <div className={`toggle ${form.remoteAvailable ? 'toggle--on' : ''}`}
                    onClick={() => updateField('remoteAvailable', !form.remoteAvailable)}>
                    <div className="toggle__knob"></div>
                  </div>
                </label>
              </div>

              <div className="form-group">
                <label>Languages</label>
                <div className="chip-grid">
                  {['English', 'Urdu', 'Punjabi', 'Sindhi', 'Pashto', 'Arabic', 'Hindi'].map(lang => (
                    <button
                      key={lang}
                      type="button"
                      className={`chip ${form.languages.includes(lang) ? 'chip--selected' : ''}`}
                      onClick={() => toggleArrayItem('languages', lang)}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 — Review */}
          {step === 4 && (
            <div className="signup-form__section">
              <h2 className="signup-form__section-title">
                <span className="signup-form__section-icon">✅</span>
                Review Your Profile
              </h2>

              <div className="review-card">
                <div className="review-card__header">
                  <div className="review-card__avatar">
                    {form.firstName.charAt(0)}{form.lastName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="review-card__name">{form.firstName} {form.lastName}</h3>
                    <p className="review-card__title">{form.title || SPECIALIZATIONS.find(s => s.value === form.specialization)?.label || 'Engineer'}</p>
                  </div>
                </div>

                <div className="review-card__grid">
                  <div className="review-card__item">
                    <span className="review-card__item-label">📧 Email</span>
                    <span className="review-card__item-value">{form.email}</span>
                  </div>
                  <div className="review-card__item">
                    <span className="review-card__item-label">📱 Phone</span>
                    <span className="review-card__item-value">{form.phone}</span>
                  </div>
                  <div className="review-card__item">
                    <span className="review-card__item-label">🏗️ Specialization</span>
                    <span className="review-card__item-value">{SPECIALIZATIONS.find(s => s.value === form.specialization)?.label}</span>
                  </div>
                  <div className="review-card__item">
                    <span className="review-card__item-label">📋 License</span>
                    <span className="review-card__item-value">{form.licenseNumber}</span>
                  </div>
                  <div className="review-card__item">
                    <span className="review-card__item-label">⏳ Experience</span>
                    <span className="review-card__item-value">{form.yearsOfExperience} years</span>
                  </div>
                  <div className="review-card__item">
                    <span className="review-card__item-label">📍 Location</span>
                    <span className="review-card__item-value">{form.city}, {form.state}, {form.country}</span>
                  </div>
                </div>

                {form.softwareProficiency.length > 0 && (
                  <div className="review-card__software">
                    <span className="review-card__item-label">💻 Software</span>
                    <div className="chip-grid chip-grid--compact">
                      {form.softwareProficiency.map(sw => (
                        <span key={sw} className="chip chip--selected chip--sm">{sw}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="review-notice">
                <span className="review-notice__icon">ℹ️</span>
                <p>Your profile will be reviewed by our admin team. You'll be notified once verified and can start receiving project matches.</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="signup-form__actions">
            {step > 1 && (
              <button type="button" className="btn-form btn-form--secondary" onClick={prevStep}>
                ← Back
              </button>
            )}
            <div style={{ flex: 1 }}></div>
            {step < totalSteps ? (
              <button type="button" className="btn-form btn-form--primary" onClick={nextStep}>
                Continue →
              </button>
            ) : (
              <button type="button" className="btn-form btn-form--submit" onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <><span className="spinner"></span> Creating Account...</>
                ) : (
                  '🚀 Create Account'
                )}
              </button>
            )}
          </div>

          <p className="signup-form__login">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EngineerSignup;
