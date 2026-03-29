import React, { useState, useRef } from 'react';
import { useSOS } from '../hooks/useSOS';
import './SOSButton.css';

const SOSButton = ({ size = 'large', showLabel = true }) => {
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const { triggerSOS, loading, activeSOS } = useSOS();
  const holdTimer = useRef(null);
  const progressInterval = useRef(null);

  const HOLD_DURATION = 3000;

  const startHold = () => {
    if (activeSOS || loading) return;
    
    setHolding(true);
    setProgress(0);

    const startTime = Date.now();
    
    progressInterval.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / HOLD_DURATION) * 100, 100);
      setProgress(newProgress);
    }, 50);

    holdTimer.current = setTimeout(async () => {
      try {
        await triggerSOS();
      } catch (err) {
        console.error('Failed to trigger SOS:', err);
      }
      resetHold();
    }, HOLD_DURATION);
  };

  const resetHold = () => {
    setHolding(false);
    setProgress(0);
    
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    startHold();
  };

  const handleMouseUp = () => {
    resetHold();
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    startHold();
  };

  const handleTouchEnd = () => {
    resetHold();
  };

  if (activeSOS) {
    return (
      <div className={`sos-button-container ${size}`}>
        <div className="sos-button active">
          <span className="sos-active-pulse"></span>
          <span className="sos-text">SOS ACTIVE</span>
        </div>
        {showLabel && <p className="sos-label">Emergency services notified</p>}
      </div>
    );
  }

  return (
    <div className={`sos-button-container ${size}`}>
      <button
        className={`sos-button ${holding ? 'holding' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={resetHold}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        disabled={loading}
      >
        <svg className="progress-ring" viewBox="0 0 100 100">
          <circle
            className="progress-ring-circle"
            cx="50"
            cy="50"
            r="45"
            style={{
              strokeDasharray: `${2 * Math.PI * 45}`,
              strokeDashoffset: `${2 * Math.PI * 45 * (1 - progress / 100)}`
            }}
          />
        </svg>
        <span className="sos-text">{loading ? '...' : 'SOS'}</span>
      </button>
      {showLabel && (
        <p className="sos-label">
          {holding ? 'Keep holding...' : 'Hold for 3 seconds to trigger'}
        </p>
      )}
    </div>
  );
};

export default SOSButton;
