const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const emergencyContactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: [validator.isEmail, 'Invalid email']
  },
  relationship: {
    type: String,
    enum: ['family', 'friend', 'colleague', 'other'],
    default: 'other'
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'Invalid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    select: false
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  profileImage: {
    type: String,
    default: null
  },
  emergencyContacts: [emergencyContactSchema],
  safetyScore: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  },
  settings: {
    autoShareLocation: {
      type: Boolean,
      default: true
    },
    sosShakeEnabled: {
      type: Boolean,
      default: false
    },
    quietHoursStart: String,
    quietHoursEnd: String,
    notificationsEnabled: {
      type: Boolean,
      default: true
    }
  },
  lastKnownLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    },
    updatedAt: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date
}, {
  timestamps: true
});

// Geospatial index for location queries
userSchema.index({ lastKnownLocation: '2dsphere' });
userSchema.index({ email: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive data from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
