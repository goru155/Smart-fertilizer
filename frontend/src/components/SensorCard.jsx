import React from 'react'

const SensorCard = ({ title, value, unit, icon, color }) => {
  const displayValue = value !== null && value !== undefined
    ? typeof value === 'number'
      ? value.toFixed(2)
      : value
    : '--'

  const getStatusColor = () => {
    if (value === null || value === undefined) return '#95a5a6'

    // Status colors based on value ranges
    switch (title.toLowerCase()) {
      case 'temperature':
        if (value < 15) return '#3498db' // Too cold
        if (value > 35) return '#e74c3c' // Too hot
        return '#27ae60' // Optimal
      case 'humidity':
        if (value < 30) return '#f39c12' // Too dry
        if (value > 80) return '#3498db' // Too humid
        return '#27ae60' // Optimal
      case 'soil moisture':
        if (value < 20) return '#e74c3c' // Too dry
        if (value > 80) return '#3498db' // Too wet
        return '#27ae60' // Optimal
      case 'soil ph':
        if (value < 5.5) return '#f39c12' // Too acidic
        if (value > 8) return '#f39c12' // Too alkaline
        return '#27ae60' // Optimal
      default:
        return color || '#27ae60'
    }
  }

  return (
    <div className="sensor-card">
      <div className="sensor-card-header">
        <span className="sensor-icon">{icon}</span>
        <span className="sensor-title">{title}</span>
      </div>
      <div className="sensor-card-body">
        <span
          className="sensor-value"
          style={{ color: getStatusColor() }}
        >
          {displayValue}
        </span>
        <span className="sensor-unit">{unit}</span>
      </div>
      <div className="sensor-card-footer">
        <div
          className="status-indicator"
          style={{ background: getStatusColor() }}
        />
        <span className="status-text">
          {value === null || value === undefined ? 'Waiting...' : 'Active'}
        </span>
      </div>

      <style>{`
        .sensor-card {
          background: rgba(255, 255, 255, 0.9);
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 8px 24px rgba(35, 67, 58, 0.1);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          border: 1px solid rgba(74, 92, 83, 0.08);
        }

        .sensor-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(35, 67, 58, 0.15);
        }

        .sensor-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .sensor-icon {
          font-size: 2rem;
          line-height: 1;
        }

        .sensor-title {
          font-size: 1rem;
          font-weight: 600;
          color: #6c746f;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .sensor-card-body {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-bottom: 16px;
        }

        .sensor-value {
          font-size: 2.5rem;
          font-weight: 700;
          line-height: 1;
          transition: color 0.3s ease;
        }

        .sensor-unit {
          font-size: 1rem;
          color: #95a5a6;
          font-weight: 500;
        }

        .sensor-card-footer {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-top: 12px;
          border-top: 1px solid rgba(74, 92, 83, 0.1);
        }

        .status-indicator {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          transition: background 0.3s ease;
        }

        .status-text {
          font-size: 0.85rem;
          color: #95a5a6;
        }
      `}</style>
    </div>
  )
}

export default SensorCard
