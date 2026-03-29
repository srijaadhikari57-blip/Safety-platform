const mongoose = require('mongoose');

const safetyZoneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  type: {
    type: String,
    enum: ['safe', 'caution', 'danger', 'custom'],
    default: 'custom'
  },
  geometry: {
    type: {
      type: String,
      enum: ['Polygon', 'Point'],
      required: true
    },
    coordinates: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    }
  },
  radius: {
    type: Number,
    default: 100
  },
  safetyScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  source: {
    type: String,
    enum: ['user', 'system', 'community', 'authority'],
    default: 'user'
  },
  validFrom: Date,
  validUntil: Date,
  tags: [String],
  incidentCount: {
    type: Number,
    default: 0
  },
  lastIncident: Date,
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

safetyZoneSchema.index({ geometry: '2dsphere' });
safetyZoneSchema.index({ type: 1, isPublic: 1 });

module.exports = mongoose.model('SafetyZone', safetyZoneSchema);
