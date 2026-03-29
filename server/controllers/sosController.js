const SOS = require('../models/SOS');
const Journey = require('../models/Journey');
const User = require('../models/User');
const { getIO } = require('../config/socket');

// Trigger SOS
exports.triggerSOS = async (req, res, next) => {
  try {
    const { latitude, longitude, accuracy, address, triggerMethod, severity } = req.body;

    // Find active journey if any
    const activeJourney = await Journey.findOne({
      user: req.user._id,
      status: 'active'
    });

    // Create SOS alert
    const sos = await SOS.create({
      user: req.user._id,
      journey: activeJourney?._id,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude],
        accuracy,
        address
      },
      triggerMethod: triggerMethod || 'button',
      severity: severity || 'high',
      timeline: [{
        event: 'SOS triggered',
        details: { triggerMethod, location: { latitude, longitude } }
      }]
    });

    // Update journey status if active
    if (activeJourney) {
      activeJourney.status = 'sos';
      activeJourney.alerts.push({
        type: 'sos',
        message: 'SOS triggered during journey'
      });
      await activeJourney.save();
    }

    // Get emergency contacts
    const user = await User.findById(req.user._id);
    const contacts = user.emergencyContacts;

    // Notify emergency contacts
    const io = getIO();
    const notifiedContacts = [];

    for (const contact of contacts) {
      notifiedContacts.push({
        contactInfo: {
          name: contact.name,
          phone: contact.phone,
          email: contact.email
        },
        notifiedAt: new Date(),
        notificationMethod: 'push'
      });

      // If contact is a registered user
      if (contact.userId) {
        io.to(`user_${contact.userId}`).emit('sos_alert', {
          sosId: sos._id,
          user: {
            id: req.user._id,
            name: req.user.name,
            phone: req.user.phone
          },
          location: {
            latitude,
            longitude,
            address
          },
          timestamp: new Date()
        });
      }
    }

    sos.notifiedContacts = notifiedContacts;
    await sos.save();

    res.status(201).json({
      success: true,
      sos: {
        id: sos._id,
        status: sos.status,
        location: sos.location,
        notifiedCount: notifiedContacts.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update SOS location
exports.updateSOSLocation = async (req, res, next) => {
  try {
    const { latitude, longitude, accuracy } = req.body;

    const sos = await SOS.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: 'active'
    });

    if (!sos) {
      return res.status(404).json({
        success: false,
        message: 'Active SOS not found'
      });
    }

    sos.location.coordinates = [longitude, latitude];
    sos.location.accuracy = accuracy;
    sos.timeline.push({
      event: 'Location updated',
      details: { latitude, longitude }
    });

    await sos.save();

    // Broadcast location update
    const io = getIO();
    sos.notifiedContacts.forEach(contact => {
      if (contact.contact) {
        io.to(`user_${contact.contact}`).emit('sos_location_update', {
          sosId: sos._id,
          location: { latitude, longitude }
        });
      }
    });

    res.json({
      success: true,
      message: 'SOS location updated'
    });
  } catch (error) {
    next(error);
  }
};

// Resolve SOS
exports.resolveSOS = async (req, res, next) => {
  try {
    const { resolution, isFalseAlarm } = req.body;

    const sos = await SOS.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!sos) {
      return res.status(404).json({
        success: false,
        message: 'SOS not found'
      });
    }

    sos.status = isFalseAlarm ? 'false_alarm' : 'resolved';
    sos.resolution = resolution;
    sos.resolvedBy = req.user._id;
    
    await sos.save();

    // Update journey if linked
    if (sos.journey) {
      await Journey.findByIdAndUpdate(sos.journey, {
        status: 'active',
        $push: {
          alerts: {
            type: 'check_in',
            message: 'SOS resolved, journey resumed'
          }
        }
      });
    }

    // Notify contacts that SOS is resolved
    const io = getIO();
    sos.notifiedContacts.forEach(contact => {
      if (contact.contact) {
        io.to(`user_${contact.contact}`).emit('sos_resolved', {
          sosId: sos._id,
          resolution: sos.status
        });
      }
    });

    res.json({
      success: true,
      sos
    });
  } catch (error) {
    next(error);
  }
};

// Get active SOS
exports.getActiveSOS = async (req, res, next) => {
  try {
    const sos = await SOS.findOne({
      user: req.user._id,
      status: 'active'
    }).populate('journey', 'startAddress endAddress');

    res.json({
      success: true,
      sos
    });
  } catch (error) {
    next(error);
  }
};

// Get SOS history
exports.getSOSHistory = async (req, res, next) => {
  try {
    const { limit = 20, page = 1 } = req.query;

    const alerts = await SOS.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('journey', 'startAddress endAddress');

    const total = await SOS.countDocuments({ user: req.user._id });

    res.json({
      success: true,
      alerts,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Acknowledge SOS as contact
exports.acknowledgeSOS = async (req, res, next) => {
  try {
    const sos = await SOS.findById(req.params.id);

    if (!sos) {
      return res.status(404).json({
        success: false,
        message: 'SOS not found'
      });
    }

    const contactIndex = sos.notifiedContacts.findIndex(
      c => c.contact?.toString() === req.user._id.toString()
    );

    if (contactIndex === -1) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to acknowledge this SOS'
      });
    }

    sos.notifiedContacts[contactIndex].acknowledged = true;
    sos.notifiedContacts[contactIndex].acknowledgedAt = new Date();
    sos.notifiedContacts[contactIndex].responseAction = req.body.action;

    if (sos.status === 'active') {
      sos.status = 'responded';
    }

    sos.timeline.push({
      event: 'Contact responded',
      details: { userId: req.user._id, action: req.body.action }
    });

    await sos.save();

    // Notify the SOS creator
    const io = getIO();
    io.to(`user_${sos.user}`).emit('sos_acknowledged', {
      sosId: sos._id,
      responder: req.user.name,
      action: req.body.action
    });

    res.json({
      success: true,
      message: 'SOS acknowledged'
    });
  } catch (error) {
    next(error);
  }
};
