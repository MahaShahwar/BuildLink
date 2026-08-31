import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { registerUser } from '../services/api';
import './Login.css';

const CustomerSignup = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', phone: '', role: 'customer',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.password || !form.phone) {
      return toast.error('Please fill in all fields');
    }
    setLoading(true);
    try {
      const res = await registerUser(form);
      login(res.data.token, res.data.user);
      toast.success('Welcome to BuildLink!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-page__left">
        <div className="login-page__left-content">
          <div className="signup-page__left-glow"></div>
          <div className="signup-page__left-glow signup-page__left-glow--2"></div>
          <h2 className="signup-page__left-title">
            Start Building<br />
            <span className="signup-page__left-gradient">Your Dream</span>
          </h2>
          <p className="signup-page__left-desc">
            Get instant AI cost estimates and connect with verified engineers.
          </p>
        </div>
      </div>

      <div className="login-page__right">
        <form className="login-form" onSubmit={handleSubmit}>
          <h1 className="login-form__title">Customer Sign Up</h1>
          <p className="login-form__subtitle">Create an account to start your project</p>

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>First Name</label>
              <input type="text" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} placeholder="First name" />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input type="text" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} placeholder="Last name" />
            </div>
          </div>

          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+92 300 1234567" />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-password">
              <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 8 characters" />
              <button type="button" className="input-password__toggle" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-form btn-form--primary login-form__submit" disabled={loading}>
            {loading ? <><span className="spinner"></span> Creating...</> : '🏠 Create Account'}
          </button>

          <p className="signup-form__login" style={{ marginTop: '24px' }}>
            Already have an account? <Link to="/login">Log in</Link>
          </p>
          <p className="signup-form__login">
            Are you an engineer? <Link to="/signup/engineer">Sign up here</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default CustomerSignup;
