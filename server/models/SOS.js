const mongoose = require('mongoose');

const sosSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  journey: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Journey'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    },
    accuracy: Number,
    address: String
  },
  status: {
    type: String,
    enum: ['active', 'responded', 'resolved', 'false_alarm'],
    default: 'active',
    index: true
  },
  triggerMethod: {
    type: String,
    enum: ['button', 'shake', 'voice', 'auto'],
    default: 'button'
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'high'
  },
  notifiedContacts: [{
    contact: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    contactInfo: {
      name: String,
      phone: String,
      email: String
    },
    notifiedAt: {
      type: Date,
      default: Date.now
    },
    notificationMethod: {
      type: String,
      enum: ['push', 'sms', 'email', 'call']
    },
    acknowledged: {
      type: Boolean,
      default: false
    },
    acknowledgedAt: Date,
    responseAction: String
  }],
  emergencyServicesContacted: {
    type: Boolean,
    default: false
  },
  emergencyServicesDetails: {
    contactedAt: Date,
    serviceType: String,
    referenceNumber: String
  },
  mediaAttachments: [{
    type: {
      type: String,
      enum: ['image', 'audio', 'video']
    },
    url: String,
    capturedAt: {
      type: Date,
      default: Date.now
    }
  }],
  timeline: [{
    event: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: mongoose.Schema.Types.Mixed
  }],
  resolvedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolution: {
    type: String,
    maxlength: 500
  },
  responseTimeSeconds: Number
}, {
  timestamps: true
});

// Geospatial index
sosSchema.index({ location: '2dsphere' });
sosSchema.index({ createdAt: -1 });

// Calculate response time when status changes
sosSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'responded' && !this.responseTimeSeconds) {
      this.responseTimeSeconds = Math.round((Date.now() - this.createdAt) / 1000);
    }
    if (this.status === 'resolved' || this.status === 'false_alarm') {
      this.resolvedAt = new Date();
    }
    
    // Add to timeline
    this.timeline.push({
      event: `Status changed to ${this.status}`,
      timestamp: new Date()
    });
  }
  next();
});

module.exports = mongoose.model('SOS', sosSchema);
