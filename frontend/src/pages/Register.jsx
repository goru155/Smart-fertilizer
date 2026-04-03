import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Register = () => {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState({ message: '', type: '' })

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

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setStatus({ message: '', type: '' })
  }

  const validateStep = (stepIndex) => {
    switch (stepIndex) {
      case 0: // Farmer name
        if (!formData.farmerName.trim()) {
          return 'Please enter the farmer name.'
        }
        break
      case 1: // Contact
        if (!formData.farmerContact.trim()) {
          return 'Please enter the contact number.'
        }
        if (formData.farmerContact.replace(/\D/g, '').length < 10) {
          return 'Please enter a valid contact number with at least 10 digits.'
        }
        break
      case 2: // Email
        if (!formData.farmerEmail.trim()) {
          return 'Please enter the email address.'
        }
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailPattern.test(formData.farmerEmail)) {
          return 'Please enter a valid email address.'
        }
        break
      case 3: // Password
        if (!formData.accountPassword) {
          return 'Please create a password.'
        }
        if (formData.accountPassword.length < 6) {
          return 'Password must be at least 6 characters long.'
        }
        if (formData.confirmPassword !== formData.accountPassword) {
          return 'Confirm password must match the created password.'
        }
        break
      case 4: // Locality
        if (!formData.farmerLocality.trim()) {
          return 'Please enter the locality.'
        }
        break
      case 5: // Field size
        if (!formData.fieldSize || Number(formData.fieldSize) <= 0) {
          return 'Please enter a valid field size greater than zero.'
        }
        if (!formData.fieldUnit) {
          return 'Please select a unit of measurement.'
        }
        break
      case 6: // Sector count
        if (!formData.sectorCount || Number(formData.sectorCount) < 1) {
          return 'Please enter at least 1 sector.'
        }
        break
      case 7: // Soil type
        if (!formData.soilType) {
          return 'Please select a soil type.'
        }
        break
      case 8: // Irrigation type
        if (!formData.irrigationType) {
          return 'Please select an irrigation type.'
        }
        break
      case 9: // Fertilizer type
        if (!formData.fertilizerType) {
          return 'Please select a fertilizer type.'
        }
        break
      case 10: // Crop plan
        if (!formData.cropPlan) {
          return 'Please select a crop plan.'
        }
        break
      case 11: // Crop names
        if (!formData.cropNames.trim()) {
          return 'Please enter crop details.'
        }
        break
      default:
        break
    }
    return ''
  }

  const handleNext = async () => {
    const error = validateStep(currentStep)
    if (error) {
      setStatus({ message: error, type: 'error' })
      return
    }

    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(prev => prev + 1)
      setStatus({ message: '', type: '' })
    } else {
      // Submit registration
      setLoading(true)
      const userData = {
        name: formData.farmerName,
        email: formData.farmerEmail,
        password: formData.accountPassword,
        // Additional farmer data (stored in backend if schema supports)
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
        setStatus({ message: result.message, type: 'success' })
        setTimeout(() => {
          navigate('/login')
        }, 1500)
      } else {
        setStatus({ message: result.message, type: 'error' })
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
    switch (currentStep) {
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
      case 2:
        return (
          <>
            <div className="step-tag">Step 3</div>
            <div className="step-question">What is the email of the farmer?</div>
            <div className="step-help">This email will be used for login.</div>
            <input
              name="farmerEmail"
              type="email"
              className="wizard-control"
              placeholder="Enter email address"
              value={formData.farmerEmail}
              onChange={handleChange}
              required
            />
          </>
        )
      case 3:
        return (
          <>
            <div className="step-tag">Step 4</div>
            <div className="step-question">Create a password for the account</div>
            <div className="step-help">Choose a secure password with at least 6 characters.</div>

            <div className="wizard-password-wrap">
              <input
                name="accountPassword"
                type={showPasswords.password ? 'text' : 'password'}
                className="wizard-control"
                placeholder="Create password"
                value={formData.accountPassword}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="wizard-password-toggle"
                onClick={() => setShowPasswords(p => ({ ...p, password: !p.password }))}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {showPasswords.password ? (
                    <><path d="M17.94 17.94A10.94 10.94 0 0112 20c-7 0-11-8-11-8a21.77 21.77 0 015.06-6.94"></path><path d="M1 1l22 22"></path></>
                  ) : (
                    <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></>
                  )}
                </svg>
              </button>
            </div>

            <div className="password-strength-wrap">
              <div className="password-strength-head">
                <span>Password strength</span>
                <span id="passwordStrengthText" style={{ color: strength.color }}>{strength.label}</span>
              </div>
              <div className="password-strength-track">
                <div id="passwordStrengthBar" style={{ width: strength.width, background: strength.color }}></div>
              </div>
            </div>

            <div className="wizard-password-wrap">
              <input
                name="confirmPassword"
                type={showPasswords.confirm ? 'text' : 'password'}
                className="wizard-control"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="wizard-password-toggle"
                onClick={() => setShowPasswords(p => ({ ...p, confirm: !p.confirm }))}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {showPasswords.confirm ? (
                    <><path d="M17.94 17.94A10.94 10.94 0 0112 20c-7 0-11-8-11-8a21.77 21.77 0 015.06-6.94"></path><path d="M1 1l22 22"></path></>
                  ) : (
                    <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></>
                  )}
                </svg>
              </button>
            </div>
          </>
        )
      case 4:
        return (
          <>
            <div className="step-tag">Step 5</div>
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
            <div className="step-tag">Step 6</div>
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
            <div className="step-tag">Step 7</div>
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
            <div className="step-tag">Step 8</div>
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
            <div className="step-tag">Step 9</div>
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
            <div className="step-tag">Step 10</div>
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
            <div className="step-tag">Step 11</div>
            <div className="step-question">Is the farmer planning to plant a single crop in the whole field or different crops in the field?</div>
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
            <div className="step-tag">Step 12</div>
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

  .auth-card.signup-card {
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

  .page-title {
    color: #23433a;
    font-size: 2.2rem;
    font-weight: 800;
  }

  .page-subtitle {
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

  @media (max-width: 900px) {
    .auth-card.signup-card { padding: 20px; }
    .signup-inner { padding: 24px; }
    .page-title { font-size: 1.8rem; }
    .step-question { font-size: 1.55rem; }
    .wizard-step { min-height: 320px; }
    .split-input { grid-template-columns: 1fr; }
  }

  @media (max-width: 560px) {
    .register-page { padding: 14px; }
    .auth-card.signup-card { border-radius: 28px; padding: 16px; }
    .signup-inner { padding: 20px; }
    .page-title { font-size: 1.6rem; }
    .wizard-actions { flex-direction: column; align-items: stretch; }
    .wizard-actions-right { width: 100%; margin-left: 0; }
    .wizard-actions-right button,
    .wizard-actions > button { width: 100%; }
    .step-question { font-size: 1.35rem; }
  }
`

export default Register
