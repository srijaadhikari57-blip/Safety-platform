import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import './Profile.css';

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || ''
  });
  const [settings, setSettings] = useState(user?.settings || {});

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data } = await authAPI.updateProfile({
        ...formData,
        settings
      });
      updateUser(data.user);
      setEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSetting = async (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    
    try {
      await authAPI.updateProfile({ settings: newSettings });
      updateUser({ settings: newSettings });
    } catch (err) {
      console.error('Failed to update setting:', err);
      setSettings(settings);
    }
  };

  return (
    <div className="profile-page">
      <header className="profile-header">
        <h1>Profile</h1>
      </header>

      <section className="profile-section">
        <div className="section-header">
          <h2>Personal Information</h2>
          <button 
            onClick={() => editing ? handleSave() : setEditing(true)}
            className="edit-btn"
            disabled={loading}
          >
            {loading ? 'Saving...' : editing ? 'Save' : 'Edit'}
          </button>
        </div>

        <div className="profile-card">
          <div className="avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          
          <div className="profile-fields">
            <div className="field">
              <label>Name</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              ) : (
                <span>{user?.name}</span>
              )}
            </div>

            <div className="field">
              <label>Email</label>
              <span>{user?.email}</span>
            </div>

            <div className="field">
              <label>Phone</label>
              {editing ? (
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              ) : (
                <span>{user?.phone}</span>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="profile-section">
        <h2>Safety Settings</h2>
        
        <div className="settings-list">
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-name">Auto-share Location</span>
              <span className="setting-description">
                Automatically share location during active journeys
              </span>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.autoShareLocation ?? true}
                onChange={() => toggleSetting('autoShareLocation')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-name">Shake to SOS</span>
              <span className="setting-description">
                Trigger SOS by shaking your phone
              </span>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.sosShakeEnabled ?? false}
                onChange={() => toggleSetting('sosShakeEnabled')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-name">Notifications</span>
              <span className="setting-description">
                Receive safety alerts and journey updates
              </span>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.notificationsEnabled ?? true}
                onChange={() => toggleSetting('notificationsEnabled')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </section>

      <section className="profile-section">
        <h2>Account</h2>
        <button onClick={logout} className="logout-button">
          Sign Out
        </button>
      </section>
    </div>
  );
};

export default Profile;
