import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import { useAuth } from './AuthContext';

const LocationContext = createContext(null);

export const useLocation = () => useContext(LocationContext);

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(null);
  const [watching, setWatching] = useState(false);
  const [error, setError] = useState(null);
  const [watchId, setWatchId] = useState(null);
  const { isAuthenticated } = useAuth();

  const getCurrentPosition = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed,
            heading: position.coords.heading,
            timestamp: position.timestamp
          };
          setLocation(loc);
          setError(null);
          resolve(loc);
        },
        (err) => {
          setError(err.message);
          reject(err);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }, []);

  const startWatching = useCallback((onUpdate) => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const loc = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed,
          heading: position.coords.heading,
          timestamp: position.timestamp
        };
        setLocation(loc);
        setError(null);
        onUpdate?.(loc);
      },
      (err) => {
        setError(err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );

    setWatchId(id);
    setWatching(true);
    return id;
  }, []);

  const stopWatching = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setWatching(false);
    }
  }, [watchId]);

  // Update server with location periodically
  useEffect(() => {
    if (!isAuthenticated || !location) return;

    const updateServer = async () => {
      try {
        await authAPI.updateLocation({
          latitude: location.latitude,
          longitude: location.longitude
        });
      } catch (err) {
        console.error('Failed to update location:', err);
      }
    };

    const interval = setInterval(updateServer, 60000);
    updateServer();

    return () => clearInterval(interval);
  }, [isAuthenticated, location]);

  const value = {
    location,
    watching,
    error,
    getCurrentPosition,
    startWatching,
    stopWatching
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};
