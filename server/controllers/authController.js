const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

// Register new user
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        safetyScore: user.safetyScore
      }
    });
  } catch (error) {
    next(error);
  }
};

// Login user
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password required'
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        safetyScore: user.safetyScore,
        emergencyContacts: user.emergencyContacts,
        settings: user.settings
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get current user
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile
exports.updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'phone', 'settings', 'profileImage'];
    const updates = {};
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// Add emergency contact
exports.addEmergencyContact = async (req, res, next) => {
  try {
    const { name, phone, email, relationship, isPrimary } = req.body;

    const user = await User.findById(req.user._id);

    // If new contact is primary, unset others
    if (isPrimary) {
      user.emergencyContacts.forEach(contact => {
        contact.isPrimary = false;
      });
    }

    user.emergencyContacts.push({
      name,
      phone,
      email,
      relationship,
      isPrimary
    });

    await user.save();

    res.status(201).json({
      success: true,
      emergencyContacts: user.emergencyContacts
    });
  } catch (error) {
    next(error);
  }
};

// Remove emergency contact
exports.removeEmergencyContact = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    user.emergencyContacts = user.emergencyContacts.filter(
      contact => contact._id.toString() !== req.params.contactId
    );

    await user.save();

    res.json({
      success: true,
      emergencyContacts: user.emergencyContacts
    });
  } catch (error) {
    next(error);
  }
};

// Update location
exports.updateLocation = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;

    await User.findByIdAndUpdate(req.user._id, {
      lastKnownLocation: {
        type: 'Point',
        coordinates: [longitude, latitude],
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Location updated'
    });
  } catch (error) {
    next(error);
  }
};
