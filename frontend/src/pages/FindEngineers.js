import React, { useState, useEffect } from 'react';
import { getEngineers } from '../services/api';
import './FindEngineers.css';

const SPECIALIZATIONS = [
  { value: '', label: 'All Specializations' },
  { value: 'civil_engineer', label: 'Civil Engineer' },
  { value: 'structural_engineer', label: 'Structural Engineer' },
  { value: 'architect', label: 'Architect' },
  { value: 'interior_designer', label: 'Interior Designer' },
  { value: 'autocad_specialist', label: 'AutoCAD Specialist' },
  { value: 'geotechnical_engineer', label: 'Geotechnical Engineer' },
];

const FindEngineers = () => {
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    specialization: '',
    city: '',
    minRating: '',
    maxPrice: '',
    availability: '',
    sortBy: 'rating',
  });
  const [searchQuery, setSearchQuery] = useState('');

  const fetchEngineers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.specialization) params.specialization = filters.specialization;
      if (filters.city) params.city = filters.city;
      if (filters.minRating) params.minRating = filters.minRating;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.availability) params.availability = filters.availability;
      if (filters.sortBy) params.sortBy = filters.sortBy;

      const res = await getEngineers(params);
      if (res.data.success) {
        setEngineers(res.data.data);
        setTotal(res.data.total);
      }
    } catch {
      // API offline — show empty state
      setEngineers([]);
      setTotal(0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEngineers();
  }, [filters]);

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getSpecLabel = (val) => {
    const labels = {
      civil_engineer: 'Civil Engineer', structural_engineer: 'Structural Engineer',
      architect: 'Architect', interior_designer: 'Interior Designer',
      autocad_specialist: 'AutoCAD Specialist', geotechnical_engineer: 'Geotechnical Engineer',
      environmental_engineer: 'Environmental Engineer',
    };
    return labels[val] || val;
  };

  const renderStars = (rating) => {
    return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
  };

  return (
    <div className="find-engineers">
      <div className="find-engineers__container">
        {/* Header */}
        <div className="find-engineers__header">
          <div>
            <h1>Find Engineers</h1>
            <p>Browse AI-verified professionals for your project</p>
          </div>
          <div className="find-engineers__search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input
              type="text"
              placeholder="Search by name, skill, or city..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="find-engineers__layout">
          {/* Filters Sidebar */}
          <div className="find-engineers__filters">
            <h3>Filters</h3>

            <div className="filter-group">
              <label>Specialization</label>
              <select value={filters.specialization} onChange={e => updateFilter('specialization', e.target.value)}>
                {SPECIALIZATIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            <div className="filter-group">
              <label>City</label>
              <input type="text" value={filters.city} onChange={e => updateFilter('city', e.target.value)}
                placeholder="e.g. Lahore" />
            </div>

            <div className="filter-group">
              <label>Min Rating</label>
              <select value={filters.minRating} onChange={e => updateFilter('minRating', e.target.value)}>
                <option value="">Any</option>
                <option value="3">3+ stars</option>
                <option value="3.5">3.5+ stars</option>
                <option value="4">4+ stars</option>
                <option value="4.5">4.5+ stars</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Max Price (PKR)</label>
              <input type="number" value={filters.maxPrice} onChange={e => updateFilter('maxPrice', e.target.value)}
                placeholder="e.g. 200000" />
            </div>

            <div className="filter-group">
              <label>Availability</label>
              <select value={filters.availability} onChange={e => updateFilter('availability', e.target.value)}>
                <option value="">Any</option>
                <option value="available">Available Now</option>
                <option value="busy">Busy</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Sort By</label>
              <select value={filters.sortBy} onChange={e => updateFilter('sortBy', e.target.value)}>
                <option value="rating">Highest Rated</option>
                <option value="experience">Most Experienced</option>
                <option value="price">Lowest Price</option>
              </select>
            </div>

            <button className="filter-reset" onClick={() => setFilters({
              specialization: '', city: '', minRating: '', maxPrice: '', availability: '', sortBy: 'rating',
            })}>
              Reset Filters
            </button>
          </div>

          {/* Results */}
          <div className="find-engineers__results">
            <div className="find-engineers__results-header">
              <span>{total} engineer{total !== 1 ? 's' : ''} found</span>
            </div>

            {loading ? (
              <div className="find-engineers__loading">
                <span className="spinner"></span> Loading engineers...
              </div>
            ) : engineers.length === 0 ? (
              <div className="find-engineers__empty">
                <div className="find-engineers__empty-icon">🔍</div>
                <h3>No engineers found</h3>
                <p>No verified engineers match your current filters. Try adjusting your criteria or check back later as new professionals join the platform.</p>
              </div>
            ) : (
              <div className="find-engineers__grid">
                {engineers.map((eng, i) => (
                  <div key={i} className="engineer-card">
                    <div className="engineer-card__header">
                      <div className="engineer-card__avatar">
                        {eng.user?.firstName?.charAt(0)}{eng.user?.lastName?.charAt(0)}
                      </div>
                      <div>
                        <h3 className="engineer-card__name">
                          {eng.user?.firstName} {eng.user?.lastName}
                        </h3>
                        <p className="engineer-card__spec">{getSpecLabel(eng.specialization)}</p>
                      </div>
                      {eng.verificationStatus === 'verified' && (
                        <span className="engineer-card__verified" title="Verified">✅</span>
                      )}
                    </div>

                    <div className="engineer-card__stats">
                      <div>
                        <span className="engineer-card__stars">{renderStars(eng.rating)}</span>
                        <span className="engineer-card__rating">{eng.rating.toFixed(1)}</span>
                      </div>
                      <span className="engineer-card__exp">{eng.yearsOfExperience} yrs exp</span>
                    </div>

                    <div className="engineer-card__details">
                      <span>📍 {eng.city}, {eng.country}</span>
                      {eng.remoteAvailable && <span>🌐 Remote OK</span>}
                      <span>⏱️ {eng.turnaroundDays}d turnaround</span>
                    </div>

                    {eng.softwareProficiency?.length > 0 && (
                      <div className="engineer-card__software">
                        {eng.softwareProficiency.slice(0, 4).map(sw => (
                          <span key={sw} className="engineer-card__sw-tag">{sw}</span>
                        ))}
                        {eng.softwareProficiency.length > 4 && (
                          <span className="engineer-card__sw-tag">+{eng.softwareProficiency.length - 4}</span>
                        )}
                      </div>
                    )}

                    <div className="engineer-card__footer">
                      <span className="engineer-card__price">
                        {eng.pricingModel === 'hourly' && eng.hourlyRate
                          ? `PKR ${eng.hourlyRate.toLocaleString()}/hr`
                          : eng.fixedRateRange?.min
                          ? `PKR ${eng.fixedRateRange.min.toLocaleString()} - ${eng.fixedRateRange.max.toLocaleString()}`
                          : 'Contact for price'}
                      </span>
                      <span className={`engineer-card__avail engineer-card__avail--${eng.availability}`}>
                        {eng.availability === 'available' ? '🟢 Available' : eng.availability === 'busy' ? '🟡 Busy' : '🔴 Unavailable'}
                      </span>
                    </div>

                    <button className="engineer-card__btn">View Profile →</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindEngineers;
