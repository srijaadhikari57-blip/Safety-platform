import { useState, useCallback, useEffect } from 'react';
import { journeyAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useLocation } from '../context/LocationContext';

export const useJourney = () => {
  const [activeJourney, setActiveJourney] = useState(null);
  const [journeys, setJourneys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { socket, emit } = useSocket();
  const { location, startWatching, stopWatching } = useLocation();

  const fetchActiveJourney = useCallback(async () => {
    try {
      const { data } = await journeyAPI.getActive();
      setActiveJourney(data.journey);
      return data.journey;
    } catch (err) {
      console.error('Failed to fetch active journey:', err);
      return null;
    }
  }, []);

  const fetchJourneys = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const { data } = await journeyAPI.getAll(params);
      setJourneys(data.journeys);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch journeys');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createJourney = useCallback(async (journeyData) => {
    setLoading(true);
    try {
      const { data } = await journeyAPI.create(journeyData);
      return data.journey;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create journey');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const startJourney = useCallback(async (journeyId) => {
    try {
      const { data } = await journeyAPI.start(journeyId);
      setActiveJourney(data.journey);
      
      // Start location tracking
      startWatching((loc) => {
        journeyAPI.updateLocation(journeyId, loc);
        emit('location_update', { journeyId, location: loc });
      });
      
      // Join tracking room
      emit('join_tracking', journeyId);
      
      return data.journey;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start journey');
      throw err;
    }
  }, [startWatching, emit]);

  const completeJourney = useCallback(async () => {
    if (!activeJourney) return;
    
    try {
      const { data } = await journeyAPI.complete(activeJourney._id);
      stopWatching();
      emit('leave_tracking', activeJourney._id);
      setActiveJourney(null);
      return data.journey;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete journey');
      throw err;
    }
  }, [activeJourney, stopWatching, emit]);

  // Listen for journey updates
  useEffect(() => {
    if (!socket) return;

    const handleLocationUpdate = (data) => {
      if (activeJourney && data.journeyId === activeJourney._id) {
        setActiveJourney(prev => ({
          ...prev,
          locationHistory: [...(prev.locationHistory || []), data.location]
        }));
      }
    };

    socket.on('location_update', handleLocationUpdate);

    return () => {
      socket.off('location_update', handleLocationUpdate);
    };
  }, [socket, activeJourney]);

  return {
    activeJourney,
    journeys,
    loading,
    error,
    fetchActiveJourney,
    fetchJourneys,
    createJourney,
    startJourney,
    completeJourney,
    currentLocation: location
  };
};
