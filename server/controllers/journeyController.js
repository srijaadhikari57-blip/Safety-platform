const Journey = require('../models/Journey');
const { getIO } = require('../config/socket');

exports.createJourney = async (req, res, next) => {
  try {
    const {
      startLocation,
      endLocation,
      startAddress,
      endAddress,
      transportMode,
      estimatedDuration,
      checkpoints,
      notes
    } = req.body;

    const journey = await Journey.create({
      user: req.user._id,
      startLocation: {
        type: 'Point',
        coordinates: [startLocation.longitude, startLocation.latitude]
      },
      endLocation: {
        type: 'Point',
        coordinates: [endLocation.longitude, endLocation.latitude]
      },
      startAddress,
      endAddress,
      transportMode,
      estimatedDuration,
      expectedArrival: new Date(Date.now() + estimatedDuration * 60 * 1000),
      checkpoints: checkpoints || [],
      notes,
      status: 'planned',
      locationHistory: [],
      alerts: [],
      sharedWith: []
    });

    res.status(201).json({ success: true, journey });
  } catch (error) {
    next(error);
  }
};

exports.startJourney = async (req, res, next) => {
  try {
    const journey = await Journey.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!journey) {
      return res.status(404).json({ success: false, message: 'Journey not found' });
    }

    journey.status = 'active';
    journey.startTime = new Date();
    journey.expectedArrival = new Date(Date.now() + journey.estimatedDuration * 60 * 1000);

    journey.sharedWith = journey.sharedWith || [];

    await journey.save();

    const io = getIO();
    journey.sharedWith.forEach(share => {
      if (share.user) {
        io.to(`user_${share.user}`).emit('journey_started', {
          journeyId: journey._id,
          userId: req.user._id,
          userName: req.user.name
        });
      }
    });

    res.json({ success: true, journey });
  } catch (error) {
    next(error);
  }
};

exports.updateJourneyLocation = async (req, res, next) => {
  try {
    const { latitude, longitude, accuracy, speed, heading } = req.body;

    const journey = await Journey.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: 'active'
    });

    if (!journey) {
      return res.status(404).json({ success: false, message: 'Active journey not found' });
    }

    const locationPoint = {
      type: 'Point',
      coordinates: [longitude, latitude],
      timestamp: new Date(),
      accuracy,
      speed,
      heading
    };

    journey.locationHistory = journey.locationHistory || [];
    journey.locationHistory.push(locationPoint);

    await journey.save();

    const io = getIO();
    io.to(`tracking_${journey._id}`).emit('location_update', {
      journeyId: journey._id,
      location: locationPoint
    });

    res.json({ success: true, message: 'Location updated' });
  } catch (error) {
    next(error);
  }
};

exports.completeJourney = async (req, res, next) => {
  try {
    const journey = await Journey.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!journey) {
      return res.status(404).json({ success: false, message: 'Journey not found' });
    }

    journey.status = 'completed';

    journey.alerts = journey.alerts || [];
    journey.alerts.push({
      type: 'arrived',
      message: 'Journey completed safely'
    });

    journey.sharedWith = journey.sharedWith || [];

    await journey.save();

    const io = getIO();
    journey.sharedWith.forEach(share => {
      if (share.user) {
        io.to(`user_${share.user}`).emit('journey_completed', {
          journeyId: journey._id,
          userId: req.user._id
        });
      }
    });

    res.json({ success: true, journey });
  } catch (error) {
    next(error);
  }
};

exports.getJourneys = async (req, res, next) => {
  try {
    const { status, limit = 20, page = 1 } = req.query;

    const query = { user: req.user._id };
    if (status) query.status = status;

    const journeys = await Journey.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Journey.countDocuments(query);

    res.json({
      success: true,
      journeys,
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

exports.getJourney = async (req, res, next) => {
  try {
    const journey = await Journey.findById(req.params.id)
      .populate('user', 'name phone')
      .populate('sharedWith.user', 'name');

    if (!journey) {
      return res.status(404).json({ success: false, message: 'Journey not found' });
    }

    const isOwner = journey.user._id.toString() === req.user._id.toString();
    const sharedWith = journey.sharedWith || [];

    const isShared = sharedWith.some(
      s => s.user?._id.toString() === req.user._id.toString()
    );

    if (!isOwner && !isShared) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, journey });
  } catch (error) {
    next(error);
  }
};

exports.shareJourney = async (req, res, next) => {
  try {
    const { userId, email, accessLevel } = req.body;

    const journey = await Journey.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!journey) {
      return res.status(404).json({ success: false, message: 'Journey not found' });
    }

    journey.sharedWith = journey.sharedWith || [];

    journey.sharedWith.push({
      user: userId,
      email,
      accessLevel: accessLevel || 'view'
    });

    await journey.save();

    if (userId) {
      const io = getIO();
      io.to(`user_${userId}`).emit('journey_shared', {
        journeyId: journey._id,
        sharedBy: req.user.name
      });
    }

    res.json({ success: true, journey });
  } catch (error) {
    next(error);
  }
};

exports.getActiveJourney = async (req, res, next) => {
  try {
    const journey = await Journey.findOne({
      user: req.user._id,
      status: 'active'
    });

    res.json({ success: true, journey });
  } catch (error) {
    next(error);
  }
};