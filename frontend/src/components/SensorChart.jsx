import React, { useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const SensorChart = ({ data = [] }) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        labels: [],
        datasets: [
          {
            label: 'Temperature',
            data: [],
            borderColor: '#e74c3c',
            backgroundColor: 'rgba(231, 76, 60, 0.1)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Humidity',
            data: [],
            borderColor: '#3498db',
            backgroundColor: 'rgba(52, 152, 219, 0.1)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Soil Moisture',
            data: [],
            borderColor: '#27ae60',
            backgroundColor: 'rgba(39, 174, 96, 0.1)',
            fill: true,
            tension: 0.4
          }
        ]
      }
    }

    // Transform data for chart
    const labels = data.map((_, index) => {
      const time = new Date(data[index]?.timestamp || data[index]?.receivedAt)
      return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    })

    return {
      labels,
      datasets: [
        {
          label: 'Temperature (°C)',
          data: data.map(d => d.temperature ?? null),
          borderColor: '#e74c3c',
          backgroundColor: 'rgba(231, 76, 60, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 6
        },
        {
          label: 'Humidity (%)',
          data: data.map(d => d.humidity ?? null),
          borderColor: '#3498db',
          backgroundColor: 'rgba(52, 152, 219, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 6
        },
        {
          label: 'Soil Moisture (%)',
          data: data.map(d => d.soilMoisture ?? null),
          borderColor: '#27ae60',
          backgroundColor: 'rgba(39, 174, 96, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 6
        }
      ]
    }
  }, [data])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 16,
          font: {
            size: 12,
            family: "'Inter', sans-serif"
          }
        }
      },
      title: {
        display: true,
        text: 'Sensor Readings Over Time',
        font: {
          size: 16,
          weight: '600',
          family: "'Inter', sans-serif"
        },
        padding: { top: 10, bottom: 20 }
      },
      tooltip: {
        backgroundColor: 'rgba(35, 67, 58, 0.95)',
        titleFont: { size: 13, family: "'Inter', sans-serif" },
        bodyFont: { size: 12, family: "'Inter', sans-serif" },
        padding: 12,
        cornerRadius: 8,
        displayColors: true
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(74, 92, 83, 0.05)',
          drawBorder: false
        },
        ticks: {
          font: { family: "'Inter', sans-serif" },
          color: '#6c746f',
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        grid: {
          color: 'rgba(74, 92, 83, 0.05)',
          drawBorder: false
        },
        ticks: {
          font: { family: "'Inter', sans-serif" },
          color: '#6c746f'
        },
        beginAtZero: false
      }
    }
  }

  return (
    <div className="chart-container">
      {data.length === 0 ? (
        <div className="chart-empty">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          <p>Waiting for sensor data...</p>
          <span>Data will appear here as readings come in</span>
        </div>
      ) : (
        <Line data={chartData} options={options} />
      )}

      <style>{`
        .chart-container {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 8px 24px rgba(35, 67, 58, 0.1);
          border: 1px solid rgba(74, 92, 83, 0.08);
          min-height: 450px;
        }

        .chart-empty {
          height: 350px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 12px;
          color: #95a5a6;
        }

        .chart-empty svg {
          color: #bdc3c7;
        }

        .chart-empty p {
          font-size: 1.1rem;
          font-weight: 600;
          color: #6c746f;
        }

        .chart-empty span {
          font-size: 0.9rem;
          color: #95a5a6;
        }

        canvas {
          max-height: 400px;
        }
      `}</style>
    </div>
  )
}

export default SensorChart
