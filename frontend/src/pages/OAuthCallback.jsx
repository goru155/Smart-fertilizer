import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { setAccessToken, authAPI } from '../services/api'

const OAuthCallback = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('Processing authentication...')

  useEffect(() => {
    const handleOAuthCallback = async () => {
      console.log('=== OAuthCallback started ===')

      try {
        // Get access token from URL query parameter
        const accessToken = searchParams.get('access_token')
        const needsOnboarding = searchParams.get('needs_onboarding') === 'true'
        const error = searchParams.get('error')

        console.log('Access token from URL:', accessToken ? 'PRESENT' : 'MISSING')
        console.log('Needs onboarding:', needsOnboarding)
        console.log('Error param:', error)

        // Check for error
        if (error) {
          setStatus('Authentication failed: ' + error)
          console.log('Redirecting to login due to error')
          setTimeout(() => navigate('/login'), 3000)
          return
        }

        // Store the access token
        if (accessToken) {
          setAccessToken(accessToken)
          console.log('Access token stored')
        } else {
          setStatus('No authentication token received.')
          console.log('Redirecting to login (no token)')
          setTimeout(() => navigate('/login'), 3000)
          return
        }

        // Verify authentication by fetching user data
        try {
          console.log('Fetching user data...')
          const user = await authAPI.getCurrentUser()
          console.log('User data received:', user)

          if (user) {
            setStatus('Authentication successful! Redirecting...')

            // Check if user needs to complete onboarding
            // Redirect to /register which handles both regular signup and OAuth onboarding
            if (needsOnboarding || user.needsOnboarding) {
              console.log('New OAuth user - redirecting to onboarding flow...')
              setStatus('Welcome! Please complete your farmer profile...')
              // Use replace: true to prevent back button to login page
              setTimeout(() => navigate('/register', { replace: true }), 1500)
            } else {
              console.log('Existing user - navigating to dashboard...')
              setTimeout(() => navigate('/dashboard', { replace: true }), 1000)
            }
            return
          }
        } catch (meError) {
          console.error('Failed to get user after OAuth:', meError)
          console.error('Error details:', meError.response?.data)
          // Even if fetch fails, we have the token - try dashboard redirect
          // The ProtectedRoute will handle auth check
          if (needsOnboarding) {
            setStatus('Completing setup...')
            setTimeout(() => navigate('/register', { replace: true }), 1500)
          } else {
            setStatus('Redirecting to dashboard...')
            setTimeout(() => navigate('/dashboard', { replace: true }), 1500)
          }
          return
        }

        // Fallback - should not reach here
        setStatus('Completing authentication...')
        console.log('Redirecting to login (fallback)')
        setTimeout(() => navigate('/login'), 3000)

      } catch (error) {
        console.error('OAuth callback error:', error)
        setStatus('An error occurred. Please try again.')
        setTimeout(() => navigate('/login'), 3000)
      }
    }

    handleOAuthCallback()
  }, [searchParams, navigate])

  return (
    <div className="login-page">
      <div className="auth-card">
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

        <div className="card-content">
          <div className="logo-badge">
            <div className="leaf-mark">
              <span className="leaf-stem"></span>
              <span className="leaf-soil"></span>
            </div>
          </div>

          <h1>{status.includes('successful') ? 'Welcome!' : 'Authenticating...'}</h1>
          <p className="subtext">{status}</p>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px'
          }}>
            <div className="spinner" style={{
              width: '48px',
              height: '48px',
              border: '4px solid rgba(86, 194, 113, 0.2)',
              borderTopColor: '#56c271',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          </div>

          <style>{oauthStyles}</style>
        </div>
      </div>
    </div>
  )
}

const oauthStyles = `
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

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @media (max-width: 900px) {
    .hero { height: 280px; }
    .farmer-figure { right: 22px; bottom: 18px; transform: scale(0.85); transform-origin: bottom right; }
    .sensor-box { left: 18px; bottom: 24px; transform: scale(0.88); transform-origin: bottom left; }
    .card-content { padding: 0 26px 36px; }
    h1 { font-size: 2.5rem; }
    .subtext { font-size: 1.25rem; }
  }

  @media (max-width: 560px) {
    .auth-card { border-radius: 28px; }
    .hero { height: 240px; }
    .logo-badge { width: 104px; height: 104px; border-radius: 26px; }
    h1 { font-size: 2rem; }
    .subtext { font-size: 1rem; margin-bottom: 24px; }
  }
`

export default OAuthCallback
