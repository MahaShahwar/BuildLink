import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { getMyEngineerProfile, updateEngineerProfile } from '../services/api';
import './EngineerProfile.css';

const EngineerProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await getMyEngineerProfile();
      if (res.data.success) {
        setProfile(res.data.data);
        setForm({
          specialization: res.data.data.specialization || '',
          yearsOfExperience: res.data.data.yearsOfExperience || 0,
          licenseNumber: res.data.data.licenseNumber || '',
          softwareProficiency: res.data.data.softwareProficiency || [],
          bio: res.data.data.bio || '',
          hourlyRate: res.data.data.hourlyRate || '',
          projectMinimum: res.data.data.fixedRateRange?.min || '',
          city: res.data.data.city || '',
          state: res.data.data.state || '',
          availability: res.data.data.availability || 'available',
          turnaroundDays: res.data.data.turnaroundDays || 14,
        });
      }
    } catch { toast.error('Failed to load profile'); }
    setLoading(false);
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        specialization: Array.isArray(form.specialization) ? form.specialization[0] : form.specialization,
        yearsOfExperience: parseInt(form.yearsOfExperience) || 0,
        licenseNumber: form.licenseNumber,
        softwareProficiency: form.softwareProficiency,
        bio: form.bio,
        hourlyRate: parseInt(form.hourlyRate) || 0,
        fixedRateRange: { min: parseInt(form.projectMinimum) || 0 },
        city: form.city,
        state: form.state,
        availability: form.availability,
      };
      const res = await updateEngineerProfile(data);
      if (res.data.success) {
        toast.success('✅ Profile updated!');
        setEditing(false);
        fetchProfile();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
    setSaving(false);
  };

  const specializations = [
    { value: 'civil_engineer', label: 'Civil Engineer' },
    { value: 'structural_engineer', label: 'Structural Engineer' },
    { value: 'architect', label: 'Architect' },
    { value: 'interior_designer', label: 'Interior Designer' },
    { value: 'autocad_specialist', label: 'AutoCAD Specialist' },
    { value: 'geotechnical_engineer', label: 'Geotechnical Engineer' },
    { value: 'environmental_engineer', label: 'Environmental Engineer' },
  ];
  const software = ['AutoCAD', 'Revit', 'SketchUp', 'SAP2000', 'ETABS', '3ds Max', 'Lumion', 'Civil 3D'];

  const toggleSoftware = (value) => {
    setForm(prev => ({
      ...prev,
      softwareProficiency: prev.softwareProficiency.includes(value)
        ? prev.softwareProficiency.filter(v => v !== value)
        : [...prev.softwareProficiency, value]
    }));
  };

  if (!user) return <div className="engineer-profile"><div className="engineer-profile__loading">Please log in</div></div>;
  if (loading) return <div className="engineer-profile"><div className="engineer-profile__loading"><span className="spinner"></span> Loading profile...</div></div>;
  if (!profile) return <div className="engineer-profile"><div className="engineer-profile__loading">Profile not found</div></div>;

  return (
    <div className="engineer-profile">
      <div className="engineer-profile__container">
        {/* Header Card */}
        <div className="ep-header-card">
          <div className="ep-header-card__avatar">
            {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
          </div>
          <div className="ep-header-card__info">
            <h1>{user.firstName} {user.lastName}</h1>
            <p className="ep-header-card__email">{user.email}</p>
            <div className="ep-header-card__badges">
              <span className={`ep-badge ep-badge--${profile.availability || 'available'}`}>
                {profile.availability === 'available' ? '🟢 Available' : profile.availability === 'busy' ? '🟡 Busy' : '🔴 Unavailable'}
              </span>
              <span className={`ep-badge ep-badge--verification ${profile.verificationStatus === 'verified' ? 'ep-badge--verified' : ''}`}>
                {profile.verificationStatus === 'verified' ? '✅ Verified' : '⏳ Pending Verification'}
              </span>
            </div>
          </div>
          <button className="ep-edit-btn" onClick={() => setEditing(!editing)}>
            {editing ? '✕ Cancel' : '✏️ Edit Profile'}
          </button>
        </div>

        {editing ? (
          /* Edit Mode */
          <div className="ep-edit-form">
            <div className="ep-section">
              <h3>Bio</h3>
              <textarea value={form.bio} onChange={e => setForm(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell clients about yourself, your experience, and approach..." rows={4} />
            </div>

            <div className="ep-section">
              <h3>Specialization</h3>
              <div className="ep-chips">
                {specializations.map(s => (
                  <button key={s.value} className={`ep-chip ${form.specialization === s.value ? 'ep-chip--active' : ''}`}
                    onClick={() => setForm(prev => ({ ...prev, specialization: s.value }))}>{s.label}</button>
                ))}
              </div>
            </div>

            <div className="ep-section">
              <h3>Software Proficiency</h3>
              <div className="ep-chips">
                {software.map(s => (
                  <button key={s} className={`ep-chip ${form.softwareProficiency.includes(s) ? 'ep-chip--active' : ''}`}
                    onClick={() => toggleSoftware(s)}>{s}</button>
                ))}
              </div>
            </div>

            <div className="ep-grid">
              <div className="ep-field">
                <label>Years of Experience</label>
                <input type="number" value={form.yearsOfExperience} onChange={e => setForm(prev => ({ ...prev, yearsOfExperience: e.target.value }))} />
              </div>
              <div className="ep-field">
                <label>License Number</label>
                <input type="text" value={form.licenseNumber} onChange={e => setForm(prev => ({ ...prev, licenseNumber: e.target.value }))} />
              </div>
              <div className="ep-field">
                <label>Hourly Rate (PKR)</label>
                <input type="number" value={form.hourlyRate} onChange={e => setForm(prev => ({ ...prev, hourlyRate: e.target.value }))} />
              </div>
              <div className="ep-field">
                <label>Min Project Budget (PKR)</label>
                <input type="number" value={form.projectMinimum} onChange={e => setForm(prev => ({ ...prev, projectMinimum: e.target.value }))} />
              </div>
              <div className="ep-field">
                <label>City</label>
                <input type="text" value={form.city} onChange={e => setForm(prev => ({ ...prev, city: e.target.value }))} />
              </div>
              <div className="ep-field">
                <label>State/Province</label>
                <input type="text" value={form.state} onChange={e => setForm(prev => ({ ...prev, state: e.target.value }))} />
              </div>
              <div className="ep-field">
                <label>Availability</label>
                <select value={form.availability} onChange={e => setForm(prev => ({ ...prev, availability: e.target.value }))}>
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
              <div className="ep-field">
                <label>Turnaround (days)</label>
                <input type="number" value={form.turnaroundDays} onChange={e => setForm(prev => ({ ...prev, turnaroundDays: e.target.value }))} />
              </div>
            </div>

            <div className="ep-save-bar">
              <button className="btn-form btn-form--secondary" onClick={() => setEditing(false)}>Cancel</button>
              <button className="btn-form btn-form--submit" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : '💾 Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          /* View Mode */
          <>
            {profile.bio && (
              <div className="ep-card">
                <h3>About</h3>
                <p>{profile.bio}</p>
              </div>
            )}

            <div className="ep-card-grid">
              <div className="ep-card">
                <h3>Specialization</h3>
                <div className="ep-chips">
                  {profile.specialization ? (
                    <span className="ep-chip ep-chip--view">{profile.specialization.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                  ) : <span className="ep-empty">Not set</span>}
                </div>
              </div>

              <div className="ep-card">
                <h3>Software</h3>
                <div className="ep-chips">
                  {profile.softwareProficiency?.length > 0 ? profile.softwareProficiency.map(s => (
                    <span key={s} className="ep-chip ep-chip--view ep-chip--software">{s}</span>
                  )) : <span className="ep-empty">Not set</span>}
                </div>
              </div>
            </div>

            <div className="ep-stats-grid">
              <div className="ep-stat">
                <span className="ep-stat__value">{profile.yearsOfExperience || 0}</span>
                <span className="ep-stat__label">Years Experience</span>
              </div>
              <div className="ep-stat">
                <span className="ep-stat__value">{profile.hourlyRate ? `PKR ${profile.hourlyRate}` : 'N/A'}</span>
                <span className="ep-stat__label">Hourly Rate</span>
              </div>
              <div className="ep-stat">
                <span className="ep-stat__value">{profile.completedProjects || 0}</span>
                <span className="ep-stat__label">Completed Projects</span>
              </div>
              <div className="ep-stat">
                <span className="ep-stat__value">{profile.rating ? `${profile.rating.toFixed(1)} ⭐` : 'N/A'}</span>
                <span className="ep-stat__label">Rating</span>
              </div>
            </div>

            <div className="ep-card">
              <h3>Location & Details</h3>
              <div className="ep-details">
                <div className="ep-detail"><span>📍 Location</span><span>{profile.city || 'N/A'}, {profile.state || 'N/A'}</span></div>
                <div className="ep-detail"><span>📜 License</span><span>{profile.licenseNumber || 'Not provided'}</span></div>
                <div className="ep-detail"><span>🌐 Remote Available</span><span>{profile.remoteAvailable ? 'Yes' : 'No'}</span></div>
                <div className="ep-detail"><span>💰 Min Budget</span><span>{profile.fixedRateRange?.min ? `PKR ${new Intl.NumberFormat('en-PK').format(profile.fixedRateRange.min)}` : 'N/A'}</span></div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EngineerProfile;
