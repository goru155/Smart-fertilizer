import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Login = () => {
  const { login, isAuthenticated } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState({ message: '', type: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      // Will redirect via ProtectedRoute
    }
  }, [isAuthenticated])

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    setStatus({ message: '', type: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus({ message: '', type: '' })

    const result = await login(formData.email, formData.password)

    if (result.success) {
      setStatus({
        message: `Welcome back! Redirecting...`,
        type: 'success'
      })
    } else {
      setStatus({
        message: result.message || 'Login failed. Please try again.',
        type: 'error'
      })
    }
    setLoading(false)
  }

  const handleSocialLogin = (provider) => {
    // OAuth redirect - backend handles the flow
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
    window.location.href = `${baseUrl}/auth/${provider.toLowerCase()}`
  }

  return (
    <div className="login-page">
      <div className="auth-card">
        {/* Hero Section */}
        <div className="hero">
          <div className="birds">
            <span className="bird" style={{ top: '78px', left: '50%' }}></span>
            <span className="bird" style={{ top: '58px', left: '56%', transform: 'scale(.8) rotate(6deg)' }}></span>
            <span className="bird" style={{ top: '94px', left: '62%', transform: 'scale(.7) rotate(-3deg)' }}></span>
          </div>
          <div className="hero-overlay">
            <div className="sensor-box">
              <div className="solar-panel"></div>
              <div className="sensor-screen">
                <div className="sensor-top">💧 <span>32%</span></div>
                <div className="sensor-bottom">NDK 🍃🍃</div>
              </div>
            </div>

            <div className="farmer-figure">
              <div className="farmer">
                <div className="ponytail"></div>
                <div className="hair"></div>
                <div className="head"></div>
                <div className="body-shape"></div>
                <div className="arm"></div>
                <div className="arm2"></div>
                <div className="tablet"></div>
                <div className="leg"></div>
                <div className="leg2"></div>
                <div className="boot"></div>
                <div className="boot2"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Card Content */}
        <div className="card-content">
          <div className="logo-badge">
            <div className="leaf-mark">
              <span className="leaf-stem"></span>
              <span className="leaf-soil"></span>
            </div>
          </div>

          <h1>Welcome Back!</h1>
          <p className="subtext">Login to your account</p>

          <form onSubmit={handleSubmit} className="form-stack">
            <div className="input-wrap">
              <span className="icon-left">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="5" width="18" height="14" rx="2"></rect>
                  <path d="M3 7l9 6 9-6"></path>
                </svg>
              </span>
              <input
                name="email"
                type="email"
                className="form-control"
                placeholder="example@email.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-wrap">
              <span className="icon-left">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="11" width="14" height="10" rx="2"></rect>
                  <path d="M8 11V8a4 4 0 118 0v3"></path>
                </svg>
              </span>
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="icon-right"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {showPassword ? (
                    <>
                      <path d="M17.94 17.94A10.94 10.94 0 0112 20c-7 0-11-8-11-8a21.77 21.77 0 015.06-6.94"></path>
                      <path d="M1 1l22 22"></path>
                    </>
                  ) : (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </>
                  )}
                </svg>
              </button>
            </div>

            <div className="row-line">
              <button type="button" className="text-link">Forgot password?</button>
            </div>

            <button className="primary-btn" type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {status.message && (
            <div className={`status-box ${status.type === 'success' ? 'success' : 'error'}`}>
              {status.message}
            </div>
          )}

          <div className="divider">or continue with</div>

          <div className="social-grid">
            <button
              className="social-btn"
              type="button"
              onClick={() => handleSocialLogin('Google')}
              aria-label="Continue with Google"
            >
              <svg viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.655 32.657 29.23 36 24 36c-6.627 0-12-5.373-12-12S17.373 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.27 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path>
                <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.27 4 24 4c-7.682 0-14.347 4.337-17.694 10.691z"></path>
                <path fill="#4CAF50" d="M24 44c5.167 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.144 35.091 26.715 36 24 36c-5.209 0-9.617-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path>
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.084 5.57l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"></path>
              </svg>
            </button>
            <button
              className="social-btn"
              type="button"
              onClick={() => handleSocialLogin('Facebook')}
              aria-label="Continue with Facebook"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#1877F2" d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.099 4.388 23.094 10.125 24v-8.438H7.078v-3.489h3.047V9.413c0-3.017 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.962H15.83c-1.491 0-1.956.927-1.956 1.877v2.255h3.328l-.532 3.489h-2.796V24C19.612 23.094 24 18.099 24 12.073z"></path>
              </svg>
            </button>
            <button
              className="social-btn"
              type="button"
              onClick={() => handleSocialLogin('Apple')}
              aria-label="Continue with Apple"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#111111" d="M16.365 1.43c0 1.14-.415 2.187-1.118 3.006-.846.982-2.227 1.74-3.425 1.643-.152-1.107.433-2.295 1.118-3.07.757-.855 2.065-1.472 3.425-1.579zM20.97 17.058c-.596 1.354-.88 1.957-1.647 3.17-1.067 1.685-2.575 3.784-4.445 3.799-1.666.016-2.096-1.085-4.357-1.072-2.262.013-2.734 1.093-4.4 1.077-1.87-.016-3.3-1.91-4.368-3.594C-1.217 16.42-.976 9.43 2.868 7.11c1.368-.827 3.53-1.325 5.62-.92 1.42.275 2.314.96 3.506.96 1.156 0 1.86-.703 3.512-.968 1.864-.3 3.875.339 5.208 1.547-4.573 2.51-3.83 9.004.256 9.329z"></path>
              </svg>
            </button>
          </div>

          <p className="bottom-text">
            Don't have an account?{' '}
            <Link to="/register">Sign Up</Link>
          </p>
        </div>
      </div>

      <style>{loginStyles}</style>
    </div>
  )
}

const loginStyles = `
  .login-page {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 28px;
    background:
      linear-gradient(rgba(82, 139, 220, 0.16), rgba(82, 139, 220, 0.16)),
      url('https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1600&q=80') center/cover no-repeat fixed;
  }

  .auth-card {
    width: 100%;
    max-width: 760px;
    background: rgba(252, 252, 249, 0.92);
    border-radius: 46px;
    box-shadow: 0 24px 50px rgba(35, 67, 58, 0.18);
    overflow: hidden;
    backdrop-filter: blur(10px);
    position: relative;
  }

  .hero {
    height: 320px;
    position: relative;
    background:
      linear-gradient(180deg, rgba(230,244,242,0.28), rgba(230,244,242,0.15)),
      url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=80') center/cover no-repeat;
    border-bottom-left-radius: 34% 16%;
    border-bottom-right-radius: 34% 16%;
    overflow: hidden;
  }

  .hero::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(242, 249, 247, 0.18), rgba(242, 249, 247, 0.08));
  }

  .hero-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 32px 34px;
    gap: 20px;
  }

  .sensor-box {
    width: 140px;
    padding: 12px;
    border-radius: 22px;
    background: rgba(241, 246, 245, 0.9);
    box-shadow: 0 14px 28px rgba(53, 83, 69, 0.18);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    position: absolute;
    left: 48px;
    bottom: 42px;
    z-index: 2;
  }

  .solar-panel {
    width: 90px;
    height: 40px;
    border-radius: 6px;
    background:
      linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px),
      linear-gradient(rgba(255,255,255,0.16) 1px, transparent 1px),
      linear-gradient(160deg, #2a4267, #21304e);
    background-size: 18px 100%, 100% 10px, 100% 100%;
    border: 3px solid #e6efff;
    position: relative;
  }

  .solar-panel::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 50%;
    width: 6px;
    height: 10px;
    background: #808b8f;
    transform: translateX(-50%);
    border-radius: 2px;
  }

  .sensor-screen {
    width: 100%;
    border-radius: 16px;
    background: #36473d;
    color: #fff;
    padding: 14px 12px;
    text-align: center;
    display: grid;
    gap: 6px;
  }

  .sensor-top {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    font-size: 28px;
    font-weight: 700;
  }

  .sensor-bottom {
    color: #7cf28e;
    font-size: 18px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .farmer-figure {
    position: absolute;
    right: 48px;
    bottom: 24px;
    z-index: 2;
    display: flex;
    align-items: end;
  }

  .farmer {
    position: relative;
    width: 190px;
    height: 220px;
  }

  .head {
    width: 54px;
    height: 54px;
    background: #f0c2a5;
    border-radius: 50%;
    position: absolute;
    top: 4px;
    right: 68px;
    z-index: 3;
  }

  .hair {
    width: 70px;
    height: 72px;
    background: #2a262a;
    border-radius: 50% 50% 44% 46%;
    position: absolute;
    top: -2px;
    right: 58px;
    z-index: 4;
  }

  .ponytail {
    width: 42px;
    height: 76px;
    background: #2a262a;
    border-radius: 50px;
    position: absolute;
    top: 16px;
    right: 30px;
    transform: rotate(-10deg);
    z-index: 2;
  }

  .body-shape {
    width: 105px;
    height: 105px;
    background: #4b9f45;
    border-radius: 28px 28px 22px 22px;
    position: absolute;
    top: 54px;
    right: 40px;
    z-index: 1;
    border: 6px solid #e1c04b;
  }

  .arm, .arm2 {
    position: absolute;
    background: #f0c2a5;
    border-radius: 30px;
    z-index: 3;
  }

  .arm {
    width: 70px;
    height: 18px;
    top: 88px;
    right: 98px;
    transform: rotate(-28deg);
  }

  .arm2 {
    width: 64px;
    height: 18px;
    top: 108px;
    right: 18px;
    transform: rotate(24deg);
  }

  .tablet {
    position: absolute;
    width: 56px;
    height: 72px;
    border-radius: 8px;
    background: #374556;
    top: 80px;
    right: 118px;
    transform: rotate(-17deg);
    z-index: 4;
    border: 4px solid #e7edf2;
  }

  .leg, .leg2 {
    position: absolute;
    background: #356fbd;
    border-radius: 28px;
    z-index: 2;
  }

  .leg {
    width: 96px;
    height: 30px;
    bottom: 42px;
    right: 50px;
    transform: rotate(34deg);
  }

  .leg2 {
    width: 96px;
    height: 30px;
    bottom: 16px;
    right: 8px;
    transform: rotate(70deg);
  }

  .boot, .boot2 {
    position: absolute;
    width: 56px;
    height: 24px;
    background: #5d9a49;
    border-radius: 16px;
    z-index: 3;
  }

  .boot {
    bottom: 76px;
    right: 18px;
    transform: rotate(12deg);
  }

  .boot2 {
    bottom: -2px;
    right: 48px;
    transform: rotate(-8deg);
  }

  .birds {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .bird {
    position: absolute;
    width: 12px;
    height: 6px;
    border-top: 2px solid rgba(29, 47, 38, 0.7);
    border-radius: 50%;
    transform: rotate(12deg);
  }

  .bird::after {
    content: '';
    position: absolute;
    left: 8px;
    top: -2px;
    width: 12px;
    height: 6px;
    border-top: 2px solid rgba(29, 47, 38, 0.7);
    border-radius: 50%;
    transform: rotate(-25deg);
  }

  .card-content {
    padding: 0 56px 48px;
    position: relative;
  }

  .logo-badge {
    width: 124px;
    height: 124px;
    border-radius: 32px;
    background: linear-gradient(180deg, rgba(246, 250, 248, 0.98), rgba(222, 238, 230, 0.95));
    position: relative;
    margin: -48px auto 14px;
    box-shadow: 0 18px 28px rgba(75, 108, 93, 0.16);
    display: grid;
    place-items: center;
    border: 1px solid rgba(114, 167, 132, 0.18);
  }

  .leaf-mark {
    width: 72px;
    height: 72px;
    position: relative;
  }

  .leaf-mark::before,
  .leaf-mark::after {
    content: '';
    position: absolute;
    border-radius: 100% 0 100% 0;
    background: linear-gradient(145deg, #3cb57a, #79d54f);
  }

  .leaf-mark::before {
    width: 34px;
    height: 48px;
    left: 8px;
    top: 12px;
    transform: rotate(-36deg);
  }

  .leaf-mark::after {
    width: 30px;
    height: 42px;
    right: 8px;
    top: 4px;
    transform: rotate(26deg);
  }

  .leaf-stem {
    position: absolute;
    left: 50%;
    bottom: 4px;
    width: 6px;
    height: 42px;
    background: linear-gradient(180deg, #5aa05f, #3c6f46);
    border-radius: 6px;
    transform: translateX(-50%);
  }

  .leaf-soil {
    position: absolute;
    left: 50%;
    bottom: 2px;
    width: 62px;
    height: 18px;
    background: linear-gradient(180deg, #7d5936, #5f4227);
    border-radius: 50%;
    transform: translateX(-50%);
  }

  h1 {
    text-align: center;
    font-size: 3.2rem;
    line-height: 1.1;
    color: #23433a;
    font-weight: 800;
    margin-bottom: 10px;
    letter-spacing: -1px;
  }

  .subtext {
    text-align: center;
    color: #6c746f;
    font-size: 1.65rem;
    margin-bottom: 34px;
  }

  .form-stack {
    display: grid;
    gap: 18px;
  }

  .input-wrap {
    position: relative;
  }

  .form-control {
    width: 100%;
    height: 84px;
    border: 2px solid rgba(74, 92, 83, 0.14);
    border-radius: 42px;
    background: rgba(255,255,255,0.6);
    padding: 0 72px 0 84px;
    font-size: 1.65rem;
    color: #23433a;
    outline: none;
    transition: 0.25s ease;
  }

  .form-control:focus {
    border-color: rgba(63, 152, 89, 0.55);
    box-shadow: 0 0 0 5px rgba(111, 194, 119, 0.12);
  }

  .icon-left, .icon-right {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .icon-left {
    left: 28px;
    color: #78a866;
    pointer-events: none;
  }

  .icon-right {
    right: 28px;
    color: #a8aeab;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
  }

  .row-line {
    display: flex;
    justify-content: flex-end;
    margin-top: -4px;
    margin-bottom: 6px;
  }

  .text-link {
    background: none;
    border: none;
    color: #727b76;
    font-size: 1.2rem;
    cursor: pointer;
  }

  .primary-btn {
    width: 100%;
    height: 82px;
    border: none;
    border-radius: 40px;
    background: linear-gradient(90deg, #2ab18a 0%, #8fd84f 55%, #c8dc55 100%);
    color: #fff;
    font-size: 2rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 18px 22px rgba(20, 127, 101, 0.22);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .primary-btn:hover:not(:disabled) {
    transform: translateY(-2px);
  }

  .primary-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .divider {
    display: flex;
    align-items: center;
    gap: 18px;
    margin: 32px 0 24px;
    color: #848a86;
    font-size: 1.3rem;
    justify-content: center;
  }

  .divider::before,
  .divider::after {
    content: '';
    height: 1px;
    flex: 1;
    background: rgba(90, 101, 95, 0.22);
  }

  .social-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 30px;
  }

  .social-btn {
    height: 82px;
    border-radius: 38px;
    border: 2px solid rgba(74, 92, 83, 0.14);
    background: rgba(255,255,255,0.65);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: 0.2s ease;
    padding: 0;
  }

  .social-btn:hover {
    transform: translateY(-2px);
  }

  .social-btn svg {
    width: 34px;
    height: 34px;
    display: block;
  }

  .bottom-text {
    text-align: center;
    font-size: 1.35rem;
    color: #68706c;
  }

  .bottom-text a {
    border: none;
    background: none;
    color: #0f6d52;
    font-weight: 700;
    font-size: 1.35rem;
    cursor: pointer;
    text-decoration: none;
  }

  .bottom-text a:hover {
    text-decoration: underline;
  }

  .status-box {
    min-height: 24px;
    text-align: center;
    font-size: 0.95rem;
    font-weight: 600;
    padding: 12px;
    border-radius: 12px;
    margin-top: 12px;
  }

  .status-box.success {
    background: rgba(86, 194, 113, 0.15);
    color: #1e7d48;
  }

  .status-box.error {
    background: rgba(180, 60, 60, 0.1);
    color: #b43c3c;
  }

  @media (max-width: 900px) {
    .hero { height: 280px; }
    .farmer-figure { right: 22px; bottom: 18px; transform: scale(0.85); transform-origin: bottom right; }
    .sensor-box { left: 18px; bottom: 24px; transform: scale(0.88); transform-origin: bottom left; }
    .card-content { padding: 0 26px 36px; }
    h1 { font-size: 2.5rem; }
    .subtext { font-size: 1.25rem; }
    .form-control { height: 74px; font-size: 1.25rem; }
    .primary-btn { height: 72px; font-size: 1.7rem; }
    .social-btn { height: 74px; }
  }

  @media (max-width: 560px) {
    .auth-card { border-radius: 28px; }
    .hero { height: 240px; }
    .logo-badge { width: 104px; height: 104px; border-radius: 26px; }
    h1 { font-size: 2rem; }
    .subtext { font-size: 1rem; margin-bottom: 24px; }
    .form-control { padding-left: 68px; padding-right: 58px; font-size: 1.08rem; }
    .icon-left { left: 22px; }
    .icon-right { right: 18px; }
    .social-grid { grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
  }
`

export default Login
