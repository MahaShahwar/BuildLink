import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../services/api';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill in all fields');
    setLoading(true);
    try {
      const res = await loginUser(form);
      login(res.data.token, res.data.user, res.data.profile);
      toast.success(`Welcome back, ${res.data.user.firstName}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
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
            Welcome Back to<br />
            <span className="signup-page__left-gradient">BuildLink</span>
          </h2>
          <p className="signup-page__left-desc">
            Continue building amazing projects with AI-powered tools.
          </p>
        </div>
      </div>

      <div className="login-page__right">
        <form className="login-form" onSubmit={handleSubmit}>
          <h1 className="login-form__title">Log In</h1>
          <p className="login-form__subtitle">Enter your credentials to continue</p>

          <div className="form-group">
            <label>Email Address</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com" />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-password">
              <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Enter your password" />
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
            {loading ? <><span className="spinner"></span> Logging in...</> : 'Log In'}
          </button>

          <div className="login-form__divider">
            <span>or</span>
          </div>

          <div className="login-form__links">
            <Link to="/signup/engineer" className="login-form__link">
              <span>🏗️</span> Sign up as Engineer
            </Link>
            <Link to="/signup/customer" className="login-form__link">
              <span>🏠</span> Sign up as Customer
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
