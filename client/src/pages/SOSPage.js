import React, { useEffect, useState } from 'react';
import { useSOS } from '../hooks/useSOS';
import { sosAPI } from '../services/api';
import SOSButton from '../components/SOSButton';
import Map from '../components/Map';
import { useLocation } from '../context/LocationContext';
import './SOSPage.css';

const SOSPage = () => {
  const { activeSOS, resolveSOS, checkActiveSOS, loading } = useSOS();
  const { location } = useLocation();
  const [history, setHistory] = useState([]);
  const [resolution, setResolution] = useState('');

  useEffect(() => {
    checkActiveSOS();
    loadHistory();
  }, [checkActiveSOS]);

  const loadHistory = async () => {
    try {
      const { data } = await sosAPI.getHistory({ limit: 5 });
      setHistory(data.alerts);
    } catch (err) {
      console.error('Failed to load SOS history:', err);
    }
  };

  const handleResolve = async (isFalseAlarm = false) => {
    try {
      await resolveSOS(resolution, isFalseAlarm);
      setResolution('');
      loadHistory();
    } catch (err) {
      console.error('Failed to resolve SOS:', err);
    }
  };

  if (activeSOS) {
    return (
      <div className="sos-page active-sos">
        <div className="sos-active-header">
          <div className="sos-pulse-container">
            <span className="sos-pulse"></span>
            <span className="sos-icon">🆘</span>
          </div>
          <h1>SOS Active</h1>
          <p>Emergency contacts have been notified</p>
        </div>

        <div className="map-container">
          <Map
            center={location ? { lat: location.latitude, lng: location.longitude } : undefined}
            userLocation={location}
            zoom={16}
          />
        </div>

        <div className="sos-info">
          <div className="info-row">
            <span className="info-label">Triggered</span>
            <span className="info-value">
              {new Date(activeSOS.createdAt).toLocaleTimeString()}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Status</span>
            <span className="info-value status-active">{activeSOS.status}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Contacts Notified</span>
            <span className="info-value">{activeSOS.notifiedContacts?.length || 0}</span>
          </div>
        </div>

        <div className="resolve-section">
          <h3>Are you safe now?</h3>
          <textarea
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            placeholder="Optional: Add a note about the situation"
            rows={3}
          />
          <div className="resolve-buttons">
            <button 
              onClick={() => handleResolve(false)} 
              className="resolve-btn safe"
              disabled={loading}
            >
              I'm Safe Now
            </button>
            <button 
              onClick={() => handleResolve(true)} 
              className="resolve-btn false-alarm"
              disabled={loading}
            >
              False Alarm
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sos-page">
      <header className="sos-header">
        <h1>Emergency SOS</h1>
        <p>Hold the button for 3 seconds to trigger an emergency alert</p>
      </header>

      <div className="sos-button-section">
        <SOSButton size="large" />
      </div>

      <div className="sos-info-card">
        <h3>What happens when you trigger SOS?</h3>
        <ul>
          <li>📍 Your location is shared with emergency contacts</li>
          <li>📱 All contacts receive instant notifications</li>
          <li>🔄 Location updates are sent in real-time</li>
          <li>📞 Contacts can see your journey if active</li>
        </ul>
      </div>

      {history.length > 0 && (
        <section className="history-section">
          <h2>Recent Alerts</h2>
          <div className="history-list">
            {history.map((alert) => (
              <div key={alert._id} className="history-item">
                <div className="history-status">
                  <span className={`status-badge ${alert.status}`}>
                    {alert.status}
                  </span>
                  <span className="history-date">
                    {new Date(alert.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="history-location">
                  {alert.location.address || 'Location recorded'}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default SOSPage;
