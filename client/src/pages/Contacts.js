import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import './Contacts.css';

const Contacts = () => {
  const { user, updateUser } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    relationship: 'family',
    isPrimary: false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await authAPI.addEmergencyContact(formData);
      updateUser({ emergencyContacts: data.emergencyContacts });
      setShowForm(false);
      setFormData({
        name: '',
        phone: '',
        email: '',
        relationship: 'family',
        isPrimary: false
      });
    } catch (err) {
      console.error('Failed to add contact:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (contactId) => {
    if (!window.confirm('Remove this emergency contact?')) return;

    try {
      const { data } = await authAPI.removeEmergencyContact(contactId);
      updateUser({ emergencyContacts: data.emergencyContacts });
    } catch (err) {
      console.error('Failed to remove contact:', err);
    }
  };

  const contacts = user?.emergencyContacts || [];

  return (
    <div className="contacts-page">
      <header className="contacts-header">
        <div>
          <h1>Emergency Contacts</h1>
          <p>People who will be notified in an emergency</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)} 
          className="add-btn"
        >
          {showForm ? 'Cancel' : '+ Add'}
        </button>
      </header>

      {showForm && (
        <form onSubmit={handleSubmit} className="contact-form">
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Contact name"
              required
            />
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Phone number"
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Email address"
            />
          </div>

          <div className="form-group">
            <label>Relationship</label>
            <select
              value={formData.relationship}
              onChange={(e) => setFormData(prev => ({ ...prev, relationship: e.target.value }))}
            >
              <option value="family">Family</option>
              <option value="friend">Friend</option>
              <option value="colleague">Colleague</option>
              <option value="other">Other</option>
            </select>
          </div>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.isPrimary}
              onChange={(e) => setFormData(prev => ({ ...prev, isPrimary: e.target.checked }))}
            />
            Set as primary contact
          </label>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Adding...' : 'Add Contact'}
          </button>
        </form>
      )}

      <div className="contacts-list">
        {contacts.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">👥</span>
            <h3>No emergency contacts</h3>
            <p>Add contacts who should be notified in case of emergency</p>
          </div>
        ) : (
          contacts.map((contact) => (
            <div key={contact._id} className="contact-card">
              <div className="contact-info">
                <div className="contact-name">
                  {contact.name}
                  {contact.isPrimary && <span className="primary-badge">Primary</span>}
                </div>
                <div className="contact-details">
                  <span>{contact.phone}</span>
                  {contact.email && <span>{contact.email}</span>}
                </div>
                <span className="relationship-badge">{contact.relationship}</span>
              </div>
              <button 
                onClick={() => handleDelete(contact._id)}
                className="delete-btn"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Contacts;
