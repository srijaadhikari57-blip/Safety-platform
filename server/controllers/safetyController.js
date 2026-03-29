const SafetyZone = require('../models/SafetyZone');
const Journey = require('../models/Journey');
const SOS = require('../models/SOS');

// Calculate safety score for a location
exports.getSafetyScore = async (req, res, next) => {
  try {
    const { latitude, longitude, radius = 500 } = req.query;

    const lng = parseFloat(longitude);
    const lat = parseFloat(latitude);
    const rad = parseInt(radius);

    const zones = await SafetyZone.find({
      geometry: {
        $geoWithin: {
          $centerSphere: [
            [lng, lat],
            rad / 6378137
          ]
        }
      },
      $or: [
        { isPublic: true },
        { createdBy: req.user._id }
      ]
    });

    const recentIncidents = await SOS.countDocuments({
      location: {
        $geoWithin: {
          $centerSphere: [
            [lng, lat],
            rad / 6378137
          ]
        }
      },
      createdAt: {
        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }
    });

    let score = 100;

    zones.forEach(zone => {
      if (zone.type === 'danger') score -= 30;
      else if (zone.type === 'caution') score -= 15;
      else if (zone.type === 'safe') score += 10;
    });

    score -= recentIncidents * 5;

    score = Math.max(0, Math.min(100, score));

    res.json({
      success: true,
      safetyScore: Math.round(score),
      zones: zones.length,
      recentIncidents,
      location: { latitude, longitude }
    });
  } catch (error) {
    next(error);
  }
};

// Create safety zone
exports.createSafetyZone = async (req, res, next) => {
  try {
    const { name, type, latitude, longitude, radius, safetyScore, tags } = req.body;

    const zone = await SafetyZone.create({
      name,
      type,
      geometry: {
        type: 'Point',
        coordinates: [longitude, latitude]
      },
      radius,
      safetyScore,
      tags,
      createdBy: req.user._id,
      source: 'user'
    });

    res.status(201).json({
      success: true,
      zone
    });
  } catch (error) {
    next(error);
  }
};

// Get nearby safety zones
exports.getNearbyZones = async (req, res, next) => {
  try {
    const { latitude, longitude, radius = 1000 } = req.query;

    const lng = parseFloat(longitude);
    const lat = parseFloat(latitude);
    const rad = parseInt(radius);

    const zones = await SafetyZone.find({
      geometry: {
        $geoWithin: {
          $centerSphere: [
            [lng, lat],
            rad / 6378137
          ]
        }
      },
      $or: [
        { isPublic: true },
        { createdBy: req.user._id }
      ]
    }).limit(50);

    res.json({
      success: true,
      zones
    });
  } catch (error) {
    next(error);
  }
};

// Get user safety statistics
exports.getUserStats = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [journeyStats, sosStats] = await Promise.all([
      Journey.aggregate([
        {
          $match: {
            user: req.user._id,
            createdAt: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            avgDuration: { $avg: '$actualDuration' }
          }
        }
      ]),
      SOS.aggregate([
        {
          $match: {
            user: req.user._id,
            createdAt: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            avgResponseTime: { $avg: '$responseTimeSeconds' }
          }
        }
      ])
    ]);

    const totalJourneys = journeyStats.reduce((sum, s) => sum + s.count, 0);
    const completedJourneys = journeyStats.find(s => s._id === 'completed')?.count || 0;
    const sosTriggered = sosStats.reduce((sum, s) => sum + s.count, 0);

    res.json({
      success: true,
      stats: {
        period: '30days',
        journeys: {
          total: totalJourneys,
          completed: completedJourneys,
          completionRate:
            totalJourneys > 0
              ? Math.round((completedJourneys / totalJourneys) * 100)
              : 0,
          byStatus: journeyStats
        },
        sos: {
          total: sosTriggered,
          byStatus: sosStats
        },
        safetyScore: req.user.safetyScore
      }
    });
  } catch (error) {
    next(error);
  }
};