import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { journeyAPI } from '../services/api';
import { useJourney } from '../hooks/useJourney';
import { useLocation } from '../context/LocationContext';
import Map from '../components/Map';
import './JourneyDetail.css';

const JourneyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [journey, setJourney] = useState(null);
  const [loading, setLoading] = useState(true);
  const { completeJourney } = useJourney();
  const { location } = useLocation();

  useEffect(() => {
    const fetchJourney = async () => {
      try {
        const { data } = await journeyAPI.getById(id);
        setJourney(data.journey);
      } catch (err) {
        console.error('Failed to fetch journey:', err);
        navigate('/journey');
      } finally {
        setLoading(false);
      }
    };

    fetchJourney();
  }, [id, navigate]);

  const handleComplete = async () => {
    try {
      await completeJourney();
      navigate('/');
    } catch (err) {
      console.error('Failed to complete journey:', err);
    }
  };

  if (loading) {
    return (
      <div className="journey-detail-loading">
        <div className="spinner"></div>
        <p>Loading journey...</p>
      </div>
    );
  }

  if (!journey) {
    return null;
  }

  const isActive = journey.status === 'active';

  return (
    <div className="journey-detail">
      <header className="detail-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          ← Back
        </button>
        <span className={`status-badge ${journey.status}`}>
          {journey.status}
        </span>
      </header>

      <div className="map-container large">
        <Map
          center={{
            lat: journey.endLocation.coordinates[1],
            lng: journey.endLocation.coordinates[0]
          }}
          userLocation={isActive ? location : null}
          markers={[
            {
              lat: journey.startLocation.coordinates[1],
              lng: journey.startLocation.coordinates[0],
              title: 'Start'
            },
            {
              lat: journey.endLocation.coordinates[1],
              lng: journey.endLocation.coordinates[0],
              title: 'Destination'
            }
          ]}
          path={journey.locationHistory?.map(loc => ({
            lat: loc.coordinates[1],
            lng: loc.coordinates[0]
          }))}
        />
      </div>

      <div className="journey-info-card">
        <h2>{journey.endAddress || 'Journey'}</h2>
        
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Started</span>
            <span className="info-value">
              {new Date(journey.startTime).toLocaleTimeString()}
            </span>
          </div>
          
          <div className="info-item">
            <span className="info-label">ETA</span>
            <span className="info-value">
              {new Date(journey.expectedArrival).toLocaleTimeString()}
            </span>
          </div>
          
          <div className="info-item">
            <span className="info-label">Mode</span>
            <span className="info-value">{journey.transportMode}</span>
          </div>
          
          <div className="info-item">
            <span className="info-label">Duration</span>
            <span className="info-value">
              {journey.actualDuration || journey.estimatedDuration} min
            </span>
          </div>
        </div>

        {journey.sharedWith?.length > 0 && (
          <div className="shared-section">
            <h3>Shared with</h3>
            <div className="shared-list">
              {journey.sharedWith.map((share, index) => (
                <span key={index} className="shared-badge">
                  {share.user?.name || share.email}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {isActive && (
        <button onClick={handleComplete} className="arrive-btn">
          I've Arrived Safely
        </button>
      )}

      {journey.status === 'completed' && (
        <div className="completion-card">
          <span className="completion-icon">✓</span>
          <h3>Journey Completed</h3>
          <p>You arrived safely at {new Date(journey.endTime).toLocaleTimeString()}</p>
        </div>
      )}
    </div>
  );
};

export default JourneyDetail;
