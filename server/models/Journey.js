const mongoose = require('mongoose');

const locationPointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point'
  },
  coordinates: {
    type: [Number],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  accuracy: Number,
  speed: Number,
  heading: Number
});

const checkpointSchema = new mongoose.Schema({
  location: locationPointSchema,
  name: String,
  reached: {
    type: Boolean,
    default: false
  },
  reachedAt: Date,
  expectedTime: Date
});

const journeySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  startLocation: {
    type: locationPointSchema,
    required: true
  },
  endLocation: {
    type: locationPointSchema,
    required: true
  },
  startAddress: String,
  endAddress: String,
  status: {
    type: String,
    enum: ['planned', 'active', 'completed', 'cancelled', 'sos'],
    default: 'planned',
    index: true
  },
  transportMode: {
    type: String,
    enum: ['walking', 'driving', 'cycling', 'public_transport', 'other'],
    default: 'walking'
  },
  estimatedDuration: {
    type: Number,
    required: true
  },
  actualDuration: Number,
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: Date,
  expectedArrival: Date,

  // ✅ FIX: add defaults
  locationHistory: {
    type: [locationPointSchema],
    default: []
  },

  checkpoints: {
    type: [checkpointSchema],
    default: []
  },

  sharedWith: {
    type: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      email: String,
      accessLevel: {
        type: String,
        enum: ['view', 'track'],
        default: 'view'
      }
    }],
    default: []
  },

  safetyScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },

  alerts: {
    type: [{
      type: {
        type: String,
        enum: ['deviation', 'delay', 'sos', 'check_in', 'arrived']
      },
      message: String,
      timestamp: {
        type: Date,
        default: Date.now
      },
      acknowledged: {
        type: Boolean,
        default: false
      }
    }],
    default: []
  },

  notes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Indexes
journeySchema.index({ startLocation: '2dsphere' });
journeySchema.index({ endLocation: '2dsphere' });
journeySchema.index({ user: 1, status: 1 });
journeySchema.index({ createdAt: -1 });

journeySchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'completed' && this.startTime) {
    this.endTime = new Date();
    this.actualDuration = Math.round((this.endTime - this.startTime) / 1000 / 60);
  }
  next();
});

// ✅ FIXED VIRTUAL
journeySchema.virtual('progress').get(function() {
  if (this.status === 'completed') return 100;
  if (this.status === 'planned') return 0;

  const history = this.locationHistory || [];

  if (history.length === 0) return 0;

  const elapsed = Date.now() - this.startTime;
  const estimated = this.estimatedDuration * 60 * 1000;

  return Math.min(Math.round((elapsed / estimated) * 100), 99);
});

journeySchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Journey', journeySchema);