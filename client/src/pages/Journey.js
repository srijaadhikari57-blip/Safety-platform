import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJourney } from '../hooks/useJourney';
import { useLocation } from '../context/LocationContext';
import Map from '../components/Map';
import './Journey.css';

const Journey = () => {
  const navigate = useNavigate();
  const { 
    activeJourney, 
    createJourney, 
    startJourney, 
    completeJourney,
    fetchActiveJourney,
    loading 
  } = useJourney();
  const { location, getCurrentPosition } = useLocation();

  const [formData, setFormData] = useState({
    endAddress: '',
    transportMode: 'walking',
    estimatedDuration: 30
  });
  const [destination, setDestination] = useState(null);

  useEffect(() => {
    fetchActiveJourney();
    getCurrentPosition();
  }, [fetchActiveJourney, getCurrentPosition]);

  const handleMapClick = (coords) => {
    setDestination(coords);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!location || !destination) {
      alert('Please select a destination on the map');
      return;
    }

    try {
      const journey = await createJourney({
        startLocation: {
          latitude: location.latitude,
          longitude: location.longitude
        },
        endLocation: {
          latitude: destination.lat,
          longitude: destination.lng
        },
        endAddress: formData.endAddress,
        transportMode: formData.transportMode,
        estimatedDuration: parseInt(formData.estimatedDuration)
      });

      await startJourney(journey._id);
      navigate(`/journey/${journey._id}`);
    } catch (err) {
      console.error('Failed to create journey:', err);
    }
  };

  const handleComplete = async () => {
    try {
      await completeJourney();
      navigate('/');
    } catch (err) {
      console.error('Failed to complete journey:', err);
    }
  };

  if (activeJourney) {
    return (
      <div className="journey-page">
        <header className="journey-header">
          <h1>Active Journey</h1>
          <span className="status-badge active">In Progress</span>
        </header>

        <div className="map-container">
          <Map
            center={{
              lat: activeJourney.endLocation.coordinates[1],
              lng: activeJourney.endLocation.coordinates[0]
            }}
            userLocation={location}
            markers={[
              {
                lat: activeJourney.startLocation.coordinates[1],
                lng: activeJourney.startLocation.coordinates[0],
                title: 'Start'
              },
              {
                lat: activeJourney.endLocation.coordinates[1],
                lng: activeJourney.endLocation.coordinates[0],
                title: 'Destination'
              }
            ]}
            path={activeJourney.locationHistory?.map(loc => ({
              lat: loc.coordinates[1],
              lng: loc.coordinates[0]
            }))}
          />
        </div>

        <div className="journey-details">
          <div className="detail-row">
            <span className="detail-label">Destination</span>
            <span className="detail-value">{activeJourney.endAddress || 'Set destination'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">ETA</span>
            <span className="detail-value">
              {new Date(activeJourney.expectedArrival).toLocaleTimeString()}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Mode</span>
            <span className="detail-value">{activeJourney.transportMode}</span>
          </div>
        </div>

        <button 
          onClick={handleComplete} 
          className="complete-btn"
          disabled={loading}
        >
          {loading ? 'Completing...' : 'I\'ve Arrived Safely'}
        </button>
      </div>
    );
  }

  return (
    <div className="journey-page">
      <header className="journey-header">
        <h1>Plan Your Journey</h1>
        <p>Let someone know where you're going</p>
      </header>

      <div className="map-container">
        <Map
          center={location ? { lat: location.latitude, lng: location.longitude } : undefined}
          userLocation={location}
          markers={destination ? [{ lat: destination.lat, lng: destination.lng, title: 'Destination' }] : []}
          onMapClick={handleMapClick}
        />
        <p className="map-hint">Tap on the map to set your destination</p>
      </div>

      <form onSubmit={handleSubmit} className="journey-form">
        <div className="form-group">
          <label>Destination Name</label>
          <input
            type="text"
            value={formData.endAddress}
            onChange={(e) => setFormData(prev => ({ ...prev, endAddress: e.target.value }))}
            placeholder="e.g., Home, Office, Coffee Shop"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Transport Mode</label>
            <select
              value={formData.transportMode}
              onChange={(e) => setFormData(prev => ({ ...prev, transportMode: e.target.value }))}
            >
              <option value="walking">Walking</option>
              <option value="driving">Driving</option>
              <option value="cycling">Cycling</option>
              <option value="public_transport">Public Transport</option>
            </select>
          </div>

          <div className="form-group">
            <label>Est. Duration (min)</label>
            <input
              type="number"
              value={formData.estimatedDuration}
              onChange={(e) => setFormData(prev => ({ ...prev, estimatedDuration: e.target.value }))}
              min="1"
              max="480"
            />
          </div>
        </div>

        <button 
          type="submit" 
          className="start-journey-btn"
          disabled={loading || !destination}
        >
          {loading ? 'Starting...' : 'Start Journey'}
        </button>
      </form>
    </div>
  );
};

export default Journey;
