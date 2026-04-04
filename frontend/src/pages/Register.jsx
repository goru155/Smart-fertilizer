import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authAPI, getAccessToken } from '../services/api'

const Register = () => {
  const { register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState({ message: '', type: '' })
  const [showSummary, setShowSummary] = useState(false)
  const [savedData, setSavedData] = useState(null)
  const [isOnboarding, setIsOnboarding] = useState(false)
  const [oauthProvider, setOauthProvider] = useState(null)

  const [formData, setFormData] = useState({
    farmerName: '',
    farmerContact: '',
    farmerEmail: '',
    accountPassword: '',
    confirmPassword: '',
    farmerLocality: '',
    fieldSize: '',
    fieldUnit: '',
    sectorCount: '',
    soilType: '',
    irrigationType: '',
    fertilizerType: '',
    cropPlan: '',
    cropNames: ''
  })

  const [showPasswords, setShowPasswords] = useState({
    password: false,
    confirm: false
  })

  const TOTAL_STEPS = 12

  // Check if this is an OAuth onboarding flow
  useEffect(() => {
    const token = getAccessToken()
    if (token) {
      // User has token - check if they need onboarding
      authAPI.getCurrentUser().then(user => {
        if (user && user.needsOnboarding) {
          setIsOnboarding(true)
          // Pre-fill name and email from OAuth profile
          setFormData(prev => ({
            ...prev,
            farmerName: user.name || '',
            farmerEmail: user.email || ''
          }))
          // Detect OAuth provider from user data
          if (user.oauthAccounts && user.oauthAccounts.length > 0) {
            setOauthProvider(user.oauthAccounts[0].provider)
          }
        }
      }).catch(() => {
        // Not authenticated - regular signup flow
      })
    }
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setStatus({ message: '', type: '' })
  }

  const validateStep = (stepIndex) => {
    switch (stepIndex) {
      case 0:
        if (!formData.farmerName.trim()) return 'Please enter the farmer name.'
        break
      case 1:
        if (!formData.farmerContact.trim()) return 'Please enter the contact number.'
        if (formData.farmerContact.replace(/\D/g, '').length < 10) return 'Please enter a valid contact number with at least 10 digits.'
        break
      case 4:
        if (!formData.farmerLocality.trim()) return 'Please enter the locality.'
        break
      case 5:
        if (!formData.fieldSize || Number(formData.fieldSize) <= 0) return 'Please enter a valid field size greater than zero.'
        if (!formData.fieldUnit) return 'Please select a unit of measurement.'
        break
      case 6:
        if (!formData.sectorCount || Number(formData.sectorCount) < 1) return 'Please enter at least 1 sector.'
        break
      case 7:
        if (!formData.soilType) return 'Please select a soil type.'
        break
      case 8:
        if (!formData.irrigationType) return 'Please select an irrigation type.'
        break
      case 9:
        if (!formData.fertilizerType) return 'Please select a fertilizer type.'
        break
      case 10:
        if (!formData.cropPlan) return 'Please select a crop plan.'
        break
      case 11:
        if (!formData.cropNames.trim()) return 'Please enter crop details.'
        break
      default:
        break
    }
    return ''
  }

  const handleNext = async () => {
    const actualStep = getActualStepIndex(currentStep)
    const error = validateStep(actualStep)
    if (error) {
      setStatus({ message: error, type: 'error' })
      return
    }

    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(prev => prev + 1)
      setStatus({ message: '', type: '' })
    } else {
      setLoading(true)

      if (isOnboarding) {
        // OAuth user completing onboarding
        const onboardingData = {
          name: formData.farmerName,
          contact: formData.farmerContact,
          locality: formData.farmerLocality,
          fieldSize: formData.fieldSize,
          fieldUnit: formData.fieldUnit,
          sectorCount: formData.sectorCount,
          soilType: formData.soilType,
          irrigationType: formData.irrigationType,
          fertilizerType: formData.fertilizerType,
          cropPlan: formData.cropPlan,
          cropNames: formData.cropNames
        }

        try {
          const { data } = await authAPI.post('/auth/complete-onboarding', onboardingData)
          setSavedData(formData)
          setShowSummary(true)
          setStatus({ message: 'Onboarding completed successfully!', type: 'success' })
        } catch (error) {
          setStatus({ message: error.response?.data?.message || 'Failed to complete onboarding', type: 'error' })
        }
      } else {
        // Regular registration
        const userData = {
          name: formData.farmerName,
          email: formData.farmerEmail,
          password: formData.accountPassword,
          contact: formData.farmerContact,
          locality: formData.farmerLocality,
          fieldSize: formData.fieldSize,
          fieldUnit: formData.fieldUnit,
          sectorCount: formData.sectorCount,
          soilType: formData.soilType,
          irrigationType: formData.irrigationType,
          fertilizerType: formData.fertilizerType,
          cropPlan: formData.cropPlan,
          cropNames: formData.cropNames
        }

        const result = await register(userData)

        if (result.success) {
          setSavedData(formData)
          setShowSummary(true)
          setStatus({ message: result.message, type: 'success' })
        } else {
          setStatus({ message: result.message, type: 'error' })
        }
      }
      setLoading(false)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
      setStatus({ message: '', type: '' })
    }
  }

  const handleClear = () => {
    setFormData({
      farmerName: '',
      farmerContact: '',
      farmerEmail: '',
      accountPassword: '',
      confirmPassword: '',
      farmerLocality: '',
      fieldSize: '',
      fieldUnit: '',
      sectorCount: '',
      soilType: '',
      irrigationType: '',
      fertilizerType: '',
      cropPlan: '',
      cropNames: ''
    })
    setCurrentStep(0)
    setStatus({ message: '', type: '' })
  }

  const handleEdit = () => {
    setShowSummary(false)
  }

  const handleGoToLogin = () => {
    if (isOnboarding) {
      // OAuth user - redirect to dashboard after onboarding
      navigate('/dashboard', { replace: true })
    } else {
      // Regular signup - go to login to sign in
      navigate('/login', { replace: true })
    }
  }

  // OAuth users skip email (step 2) and password (step 3) steps
  // So we have 10 steps instead of 12 for OAuth onboarding
  const TOTAL_STEPS = isOnboarding ? 10 : 12

  // Map display step to actual step index for OAuth users
  const getActualStepIndex = (displayStep) => {
    if (!isOnboarding) return displayStep
    // Skip steps 2 and 3 (email and password) for OAuth users
    if (displayStep >= 2) return displayStep + 2
    return displayStep
  }

  const getPasswordStrength = () => {
    const pwd = formData.accountPassword
    let score = 0
    if (pwd.length >= 6) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[a-z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++

    if (pwd.length === 0) {
      return { label: 'Weak', width: '20%', color: '#e0a13a' }
    }
    if (score <= 2) {
      return { label: 'Weak', width: '33%', color: '#e59b2f' }
    }
    if (score <= 4) {
      return { label: 'Medium', width: '66%', color: '#d1c13e' }
    }
    return { label: 'Strong', width: '100%', color: '#38b46f' }
  }

  const strength = getPasswordStrength()

  const renderStep = () => {
    const actualStep = getActualStepIndex(currentStep)

    switch (actualStep) {
      case 0:
        return (
          <>
            <div className="step-tag">Step 1</div>
            <div className="step-question">What is the name of the farmer?</div>
            <div className="step-help">Enter the full name that should be linked to the account.</div>
            <input
              name="farmerName"
              type="text"
              className="wizard-control"
              placeholder="Enter full name"
              value={formData.farmerName}
              onChange={handleChange}
              required
              readOnly={isOnboarding}
            />
          </>
        )
      case 1:
        return (
          <>
            <div className="step-tag">Step 2</div>
            <div className="step-question">What is the contact number of the farmer?</div>
            <div className="step-help">Enter a reachable phone number for alerts and communication.</div>
            <input
              name="farmerContact"
              type="tel"
              className="wizard-control"
              placeholder="Enter contact number"
              value={formData.farmerContact}
              onChange={handleChange}
              required
            />
          </>
        )
      case 4:
        return (
          <>
            <div className="step-tag">Step 3</div>
            <div className="step-question">What is the locality of the farmer?</div>
            <div className="step-help">Enter the village, town, city area, or locality of the farmer.</div>
            <input
              name="farmerLocality"
              type="text"
              className="wizard-control"
              placeholder="Enter locality"
              value={formData.farmerLocality}
              onChange={handleChange}
              required
            />
          </>
        )
      case 5:
        return (
          <>
            <div className="step-tag">Step 4</div>
            <div className="step-question">What is the size of the field of the farmer?</div>
            <div className="step-help">Enter the field size and choose the measurement unit.</div>
            <div className="split-input">
              <input
                name="fieldSize"
                type="number"
                min="0"
                step="0.01"
                className="wizard-control"
                placeholder="Enter size"
                value={formData.fieldSize}
                onChange={handleChange}
                required
              />
              <select
                name="fieldUnit"
                className="wizard-select"
                value={formData.fieldUnit}
                onChange={handleChange}
                required
              >
                <option value="">Select unit</option>
                <option value="Feet">Feet</option>
                <option value="Acres">Acres</option>
                <option value="Hectares">Hectares</option>
              </select>
            </div>
          </>
        )
      case 6:
        return (
          <>
            <div className="step-tag">Step 5</div>
            <div className="step-question">In how many sectors does the farmer want to divide the field?</div>
            <div className="step-help">This helps organize monitoring and crop planning better.</div>
            <input
              name="sectorCount"
              type="number"
              min="1"
              className="wizard-control"
              placeholder="Enter number of sectors"
              value={formData.sectorCount}
              onChange={handleChange}
              required
            />
          </>
        )
      case 7:
        return (
          <>
            <div className="step-tag">Step 6</div>
            <div className="step-question">What type of soil is being used for crop growth?</div>
            <div className="step-help">Select the soil type that best matches the field.</div>
            <select
              name="soilType"
              className="wizard-select"
              value={formData.soilType}
              onChange={handleChange}
              required
            >
              <option value="">Select soil type</option>
              <option value="Alluvial Soil">Alluvial Soil</option>
              <option value="Black Soil">Black Soil</option>
              <option value="Red Soil">Red Soil</option>
              <option value="Clay Soil">Clay Soil</option>
              <option value="Sandy Soil">Sandy Soil</option>
              <option value="Loamy Soil">Loamy Soil</option>
              <option value="Silty Soil">Silty Soil</option>
              <option value="Peaty Soil">Peaty Soil</option>
            </select>
          </>
        )
      case 8:
        return (
          <>
            <div className="step-tag">Step 7</div>
            <div className="step-question">How are the irrigation facilities?</div>
            <div className="step-help">Choose the irrigation setup available in the field.</div>
            <select
              name="irrigationType"
              className="wizard-select"
              value={formData.irrigationType}
              onChange={handleChange}
              required
            >
              <option value="">Select irrigation type</option>
              <option value="Drip Irrigation">Drip Irrigation</option>
              <option value="Sprinkler Irrigation">Sprinkler Irrigation</option>
              <option value="Canal Irrigation">Canal Irrigation</option>
              <option value="Tube Well / Borewell">Tube Well / Borewell</option>
              <option value="Rain-fed">Rain-fed</option>
              <option value="Manual Irrigation">Manual Irrigation</option>
            </select>
          </>
        )
      case 9:
        return (
          <>
            <div className="step-tag">Step 8</div>
            <div className="step-question">Which type of fertilizer is being used?</div>
            <div className="step-help">Pick the fertilizer category currently planned for use.</div>
            <select
              name="fertilizerType"
              className="wizard-select"
              value={formData.fertilizerType}
              onChange={handleChange}
              required
            >
              <option value="">Select fertilizer type</option>
              <option value="Organic Compost">Organic Compost</option>
              <option value="Vermicompost">Vermicompost</option>
              <option value="Urea">Urea</option>
              <option value="DAP">DAP</option>
              <option value="NPK">NPK</option>
              <option value="Biofertilizer">Biofertilizer</option>
              <option value="Mixed Fertilizer">Mixed Fertilizer</option>
            </select>
          </>
        )
      case 10:
        return (
          <>
            <div className="step-tag">Step 9</div>
            <div className="step-question">Is the farmer planning a single crop in the whole field or different crops in different sectors?</div>
            <div className="step-help">Select the crop planning method for the whole field.</div>
            <select
              name="cropPlan"
              className="wizard-select"
              value={formData.cropPlan}
              onChange={handleChange}
              required
            >
              <option value="">Select plan</option>
              <option value="Single crop in the whole field">Single crop in the whole field</option>
              <option value="Different crops in different sectors">Different crops in different sectors</option>
            </select>
          </>
        )
      case 11:
        return (
          <>
            <div className="step-tag">Step 10</div>
            <div className="step-question">Which crop is going to be planted in the field?</div>
            <div className="step-help">Enter the crop name, or write sector-wise crop details if there are different crops.</div>
            <textarea
              name="cropNames"
              className="wizard-textarea"
              placeholder="Example: Wheat in sectors 1-3, maize in sectors 4-5"
              value={formData.cropNames}
              onChange={handleChange}
              required
            />
          </>
        )
      default:
        return null
    }
  }

  // Summary Screen
  if (showSummary && savedData) {
    return (
      <div className="register-page">
        <div className="auth-card summary-card">
          <div className="summary-header">
            <div>
              <div className="summary-title">Your account is created</div>
              <div className="summary-subtitle">The farmer information has been saved successfully.</div>
            </div>
            <div className="saved-pill">Saved Successfully</div>
          </div>

          <div className="summary-grid">
            <div className="summary-item">
              <small>Farmer Name</small>
              <strong>{savedData.farmerName || '—'}</strong>
            </div>
            <div className="summary-item">
              <small>Contact Number</small>
              <strong>{savedData.farmerContact || '—'}</strong>
            </div>
            {!isOnboarding && (
              <div className="summary-item">
                <small>Email</small>
                <strong>{savedData.farmerEmail || '—'}</strong>
              </div>
            )}
            <div className="summary-item">
              <small>Locality</small>
              <strong>{savedData.farmerLocality || '—'}</strong>
            </div>
            <div className="summary-item">
              <small>Field Size</small>
              <strong>{savedData.fieldSize} {savedData.fieldUnit || '—'}</strong>
            </div>
            <div className="summary-item">
              <small>Number of Sectors</small>
              <strong>{savedData.sectorCount || '—'}</strong>
            </div>
            <div className="summary-item">
              <small>Soil Type</small>
              <strong>{savedData.soilType || '—'}</strong>
            </div>
            <div className="summary-item">
              <small>Irrigation Facilities</small>
              <strong>{savedData.irrigationType || '—'}</strong>
            </div>
            <div className="summary-item">
              <small>Fertilizer Type</small>
              <strong>{savedData.fertilizerType || '—'}</strong>
            </div>
            <div className="summary-item">
              <small>Crop Planning</small>
              <strong>{savedData.cropPlan || '—'}</strong>
            </div>
            <div className="summary-item full">
              <small>Crop Details</small>
              <strong>{savedData.cropNames || '—'}</strong>
            </div>
          </div>

          <div className="actions-row">
            <button className="secondary-btn" type="button" onClick={handleEdit}>Edit Information</button>
            <button className="save-btn" type="button" onClick={handleGoToLogin}>Go to Login</button>
          </div>
        </div>

        <style>{registerStyles}</style>
      </div>
    )
  }

  // Registration Wizard
  return (
    <div className="register-page">
      <div className="auth-card signup-card">
        <div className="signup-inner">
          <div className="top-bar">
            <div>
              <div className="page-title">Create Farmer Account</div>
              <div className="page-subtitle">Answer one question at a time to create the account.</div>
            </div>
            <Link to="/login" className="secondary-btn">← Back to Login</Link>
          </div>

          <div className="wizard-shell">
            <div className="progress-row">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${((currentStep + 1) / TOTAL_STEPS) * 100}%` }}
                />
              </div>
              <div className="progress-label">Question {currentStep + 1} of {TOTAL_STEPS}</div>
            </div>

            {isOnboarding && oauthProvider && (
              <div style={{
                textAlign: 'center',
                color: '#2b7f56',
                fontSize: '0.9rem',
                marginBottom: '12px'
              }}>
                Completing setup for {oauthProvider} account
              </div>
            )}

            <div className="wizard-step active">
              {renderStep()}
            </div>

            <div className="wizard-actions">
              <button
                className="secondary-btn"
                type="button"
                onClick={handlePrev}
                style={{ visibility: currentStep === 0 ? 'hidden' : 'visible' }}
              >
                ← Previous
              </button>
              <div className="wizard-actions-right">
                <button className="secondary-btn" type="button" onClick={handleClear}>
                  Clear
                </button>
                <button
                  className="save-btn"
                  type="button"
                  onClick={handleNext}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : currentStep === TOTAL_STEPS - 1 ? 'Create Account' : 'Next →'}
                </button>
              </div>
            </div>

            {status.message && (
              <div className={`status-box ${status.type === 'success' ? 'success' : 'error'}`}>
                {status.message}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{registerStyles}</style>
    </div>
  )
}

const registerStyles = `
  .register-page {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 28px;
    background:
      linear-gradient(rgba(82, 139, 220, 0.16), rgba(82, 139, 220, 0.16)),
      url('https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1600&q=80') center/cover no-repeat fixed;
  }

  .auth-card.signup-card,
  .auth-card.summary-card {
    max-width: 900px;
    padding: 30px;
    border-radius: 36px;
  }

  .signup-inner {
    background: rgba(255,255,255,0.5);
    border-radius: 30px;
    padding: 34px;
    border: 1px solid rgba(74, 92, 83, 0.09);
  }

  .top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    margin-bottom: 18px;
    flex-wrap: wrap;
  }

  .page-title,
  .summary-title {
    color: #23433a;
    font-size: 2.2rem;
    font-weight: 800;
  }

  .page-subtitle,
  .summary-subtitle {
    color: #6c746f;
    font-size: 1rem;
    margin-top: 6px;
  }

  .secondary-btn {
    border: none;
    background: rgba(39, 104, 80, 0.08);
    color: #0f6d52;
    padding: 14px 22px;
    border-radius: 18px;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
  }

  .secondary-btn:hover {
    background: rgba(39, 104, 80, 0.15);
  }

  .wizard-shell {
    margin-top: 18px;
  }

  .progress-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 22px;
    flex-wrap: wrap;
  }

  .progress-bar {
    flex: 1;
    min-width: 180px;
    height: 10px;
    background: rgba(63, 90, 75, 0.12);
    border-radius: 999px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #2ab18a, #8fd84f);
    transition: width 0.3s ease;
  }

  .progress-label {
    color: #6c746f;
    font-weight: 600;
    font-size: 0.96rem;
  }

  .wizard-step {
    display: flex;
    flex-direction: column;
    min-height: 350px;
    padding: 10px 4px 0;
    animation: fadeSlide 0.25s ease;
  }

  @keyframes fadeSlide {
    from { opacity: 0; transform: translateX(14px); }
    to { opacity: 1; transform: translateX(0); }
  }

  .step-tag {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 9px 14px;
    border-radius: 999px;
    background: rgba(69, 140, 104, 0.1);
    color: #2b7f56;
    font-weight: 700;
    font-size: 0.88rem;
    margin-bottom: 18px;
    width: fit-content;
  }

  .step-question {
    font-size: 2rem;
    line-height: 1.2;
    color: #23433a;
    font-weight: 800;
    max-width: 700px;
    margin-bottom: 10px;
  }

  .step-help {
    color: #6c746f;
    font-size: 1rem;
    line-height: 1.6;
    margin-bottom: 24px;
    max-width: 700px;
  }

  .wizard-control,
  .wizard-select,
  .wizard-textarea {
    width: 100%;
    border: 1.5px solid rgba(74, 92, 83, 0.14);
    border-radius: 22px;
    min-height: 68px;
    padding: 20px 22px;
    font-size: 1.08rem;
    outline: none;
    background: rgba(255,255,255,0.84);
    color: #23433a;
    transition: 0.2s ease;
    font-family: inherit;
  }

  .wizard-control:focus,
  .wizard-select:focus,
  .wizard-textarea:focus {
    border-color: rgba(63, 152, 89, 0.55);
    box-shadow: 0 0 0 5px rgba(111, 194, 119, 0.12);
  }

  .wizard-select {
    cursor: pointer;
  }

  .wizard-textarea {
    min-height: 140px;
    resize: vertical;
  }

  .wizard-password-wrap {
    position: relative;
    width: 100%;
    margin-bottom: 14px;
  }

  .wizard-password-toggle {
    position: absolute;
    right: 18px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #68706c;
  }

  .wizard-password-wrap .wizard-control {
    padding-right: 58px;
  }

  .split-input {
    display: grid;
    grid-template-columns: 1.2fr 0.8fr;
    gap: 14px;
    width: 100%;
  }

  .wizard-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 14px;
    margin-top: 26px;
    flex-wrap: wrap;
    width: 100%;
  }

  .wizard-actions-right {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-left: auto;
  }

  .save-btn {
    min-width: 210px;
    height: 58px;
    border: none;
    border-radius: 18px;
    background: linear-gradient(90deg, #239970, #87d64d);
    color: white;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 12px 20px rgba(21, 117, 93, 0.18);
    transition: transform 0.2s ease;
  }

  .save-btn:hover:not(:disabled) {
    transform: translateY(-2px);
  }

  .save-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .password-strength-wrap {
    width: 100%;
    margin-bottom: 16px;
  }

  .password-strength-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    gap: 12px;
    flex-wrap: wrap;
  }

  .password-strength-head span:first-child {
    font-size: 0.95rem;
    color: #6c746f;
    font-weight: 600;
  }

  .password-strength-track {
    height: 10px;
    background: rgba(63,90,75,0.12);
    border-radius: 999px;
    overflow: hidden;
  }

  .status-box {
    min-height: 24px;
    text-align: center;
    font-size: 0.95rem;
    font-weight: 600;
    padding: 12px;
    border-radius: 12px;
    margin-top: 16px;
  }

  .status-box.success {
    background: rgba(86, 194, 113, 0.15);
    color: #1e7d48;
  }

  .status-box.error {
    background: rgba(180, 60, 60, 0.1);
    color: #b43c3c;
  }

  .summary-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }

  .saved-pill {
    padding: 14px 18px;
    border-radius: 18px;
    background: rgba(86, 194, 113, 0.15);
    color: #1e7d48;
    font-weight: 700;
    white-space: nowrap;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .summary-item {
    background: rgba(255,255,255,0.7);
    border: 1px solid rgba(74, 92, 83, 0.1);
    border-radius: 20px;
    padding: 18px;
  }

  .summary-item.full {
    grid-column: 1 / -1;
  }

  .summary-item small {
    display: block;
    color: #7b847f;
    font-size: 0.86rem;
    margin-bottom: 7px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .summary-item strong {
    color: #23433a;
    font-size: 1.02rem;
    line-height: 1.5;
  }

  .actions-row {
    display: flex;
    justify-content: flex-end;
    gap: 14px;
    flex-wrap: wrap;
    margin-top: 24px;
  }

  @media (max-width: 900px) {
    .auth-card.signup-card,
    .auth-card.summary-card {
      padding: 20px;
    }
    .signup-inner { padding: 24px; }
    .page-title, .summary-title { font-size: 1.8rem; }
    .step-question { font-size: 1.55rem; }
    .wizard-step { min-height: 320px; }
    .split-input { grid-template-columns: 1fr; }
    .summary-grid { grid-template-columns: 1fr; }
  }

  @media (max-width: 560px) {
    .register-page { padding: 14px; }
    .auth-card.signup-card,
    .auth-card.summary-card {
      border-radius: 28px;
      padding: 16px;
    }
    .signup-inner { padding: 20px; }
    .page-title, .summary-title { font-size: 1.6rem; }
    .wizard-actions { flex-direction: column; align-items: stretch; }
    .wizard-actions-right { width: 100%; margin-left: 0; }
    .wizard-actions-right button,
    .wizard-actions > button { width: 100%; }
    .step-question { font-size: 1.35rem; }
    .actions-row { flex-direction: column; }
    .actions-row button { width: 100%; }
  }
`

export default Register
