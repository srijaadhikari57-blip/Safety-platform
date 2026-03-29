import { useState, useCallback, useEffect } from 'react';
import { sosAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';

export const useSOS = () => {
  const [activeSOS, setActiveSOS] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { socket, emit } = useSocket();
  const { location, startWatching, stopWatching, getCurrentPosition } = useLocation();
  const { user } = useAuth();

  const checkActiveSOS = useCallback(async () => {
    try {
      const { data } = await sosAPI.getActive();
      setActiveSOS(data.sos);
      return data.sos;
    } catch (err) {
      console.error('Failed to check active SOS:', err);
      return null;
    }
  }, []);

  const triggerSOS = useCallback(async (options = {}) => {
    setLoading(true);
    setError(null);

    try {
      // Get current location
      let currentLocation = location;
      if (!currentLocation) {
        currentLocation = await getCurrentPosition();
      }

      const { data } = await sosAPI.trigger({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        accuracy: currentLocation.accuracy,
        triggerMethod: options.triggerMethod || 'button',
        severity: options.severity || 'high'
      });

      setActiveSOS(data.sos);

      // Start continuous location updates
      startWatching((loc) => {
        sosAPI.updateLocation(data.sos.id, loc);
      });

      // Emit to socket for real-time notifications
      emit('sos_triggered', {
        sosId: data.sos.id,
        location: currentLocation,
        emergencyContacts: user?.emergencyContacts?.map(c => c.userId).filter(Boolean) || []
      });

      return data.sos;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to trigger SOS';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [location, getCurrentPosition, startWatching, emit, user]);

  const resolveSOS = useCallback(async (resolution, isFalseAlarm = false) => {
    if (!activeSOS) return;

    try {
      const { data } = await sosAPI.resolve(activeSOS.id, { resolution, isFalseAlarm });
      stopWatching();
      setActiveSOS(null);
      return data.sos;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resolve SOS');
      throw err;
    }
  }, [activeSOS, stopWatching]);

  // Listen for SOS alerts
  useEffect(() => {
    if (!socket) return;

    const handleSOSAlert = (data) => {
      // Play alert sound, show notification, etc.
      console.log('SOS Alert received:', data);
      
      if (Notification.permission === 'granted') {
        new Notification('SOS Alert!', {
          body: `${data.user.name} needs help!`,
          icon: '/sos-icon.png',
          requireInteraction: true
        });
      }
    };

    const handleSOSResolved = (data) => {
      console.log('SOS Resolved:', data);
    };

    socket.on('sos_alert', handleSOSAlert);
    socket.on('sos_resolved', handleSOSResolved);

    return () => {
      socket.off('sos_alert', handleSOSAlert);
      socket.off('sos_resolved', handleSOSResolved);
    };
  }, [socket]);

  return {
    activeSOS,
    loading,
    error,
    triggerSOS,
    resolveSOS,
    checkActiveSOS
  };
};
