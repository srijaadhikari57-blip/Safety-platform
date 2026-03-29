import React from 'react';
import './SafetyScore.css';

const SafetyScore = ({ score, size = 'medium', showLabel = true }) => {
  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--success)';
    if (score >= 60) return 'var(--warning)';
    return 'var(--danger)';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Safe';
    if (score >= 60) return 'Moderate';
    return 'Caution';
  };

  const circumference = 2 * Math.PI * 45;
  const progress = (score / 100) * circumference;

  return (
    <div className={`safety-score ${size}`}>
      <svg className="score-ring" viewBox="0 0 100 100">
        <circle
          className="score-ring-bg"
          cx="50"
          cy="50"
          r="45"
        />
        <circle
          className="score-ring-progress"
          cx="50"
          cy="50"
          r="45"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: circumference - progress,
            stroke: getScoreColor(score)
          }}
        />
      </svg>
      <div className="score-content">
        <span className="score-value" style={{ color: getScoreColor(score) }}>
          {score}
        </span>
        {showLabel && (
          <span className="score-label">{getScoreLabel(score)}</span>
        )}
      </div>
    </div>
  );
};

export default SafetyScore;
