import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { useJourney } from '../hooks/useJourney';
import { safetyAPI } from '../services/api';
import SafetyScore from '../components/SafetyScore';
import SOSButton from '../components/SOSButton';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const { location, getCurrentPosition } = useLocation();
  const { activeJourney, fetchActiveJourney } = useJourney();
  const [safetyData, setSafetyData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔹 FIRST LOAD (runs once)
  useEffect(() => {
    const loadInitial = async () => {
      try {
        await getCurrentPosition();
        await fetchActiveJourney();
      } catch (err) {
        console.error('Init error:', err);
      }
    };

    loadInitial();
  }, []);

  // 🔹 LOAD DATA WHEN LOCATION AVAILABLE
  useEffect(() => {
    const loadData = async () => {
      try {
        if (!location) return;

        const [safetyResponse, statsResponse] = await Promise.all([
          safetyAPI.getScore({
            latitude: location.latitude,
            longitude: location.longitude
          }),
          safetyAPI.getStats()
        ]);

        if (safetyResponse) {
          setSafetyData(safetyResponse.data);
        }

        setStats(statsResponse.data.stats);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [location]); // ✅ ONLY depend on location (safe now)

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading your safety dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Hello, {user?.name?.split(' ')[0]}</h1>
        <p>Stay safe today</p>
      </header>

      <section className="safety-overview">
        <div className="safety-card">
          <SafetyScore score={safetyData?.safetyScore || user?.safetyScore || 85} size="large" />
          <div className="safety-details">
            <h3>Current Location Safety</h3>
            <p>{safetyData?.recentIncidents || 0} incidents nearby</p>
          </div>
        </div>
      </section>

      <section className="quick-actions">
        <SOSButton size="medium" />

        <Link to="/journey" className="action-card">
          <span className="action-icon">📍</span>
          <span className="action-label">Start Journey</span>
        </Link>

        <Link to="/contacts" className="action-card">
          <span className="action-icon">👥</span>
          <span className="action-label">
            {user?.emergencyContacts?.length || 0} Contacts
          </span>
        </Link>
      </section>

      {activeJourney && (
        <section className="active-journey-card">
          <div className="journey-status">
            <span className="status-badge active">Active Journey</span>
            <span className="journey-time">
              Started {new Date(activeJourney.startTime).toLocaleTimeString()}
            </span>
          </div>

          <div className="journey-info">
            <p className="journey-destination">
              <strong>To:</strong> {activeJourney.endAddress || 'Destination'}
            </p>
            <p className="journey-eta">
              ETA: {new Date(activeJourney.expectedArrival).toLocaleTimeString()}
            </p>
          </div>

          <Link to={`/journey/${activeJourney._id}`} className="view-journey-btn">
            View Journey
          </Link>
        </section>
      )}

      <section className="stats-section">
        <h2>Your Safety Stats</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{stats?.journeys?.total || 0}</span>
            <span className="stat-label">Journeys</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats?.journeys?.completionRate || 0}%</span>
            <span className="stat-label">Completion</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats?.sos?.total || 0}</span>
            <span className="stat-label">SOS Alerts</span>
          </div>
        </div>
      </section>

      <section className="tips-section">
        <h2>Safety Tips</h2>
        <div className="tip-card">
          <span className="tip-icon">💡</span>
          <p>
            Share your journey with trusted contacts when traveling alone, especially at night.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;