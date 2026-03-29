const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getSafetyScore,
  createSafetyZone,
  getNearbyZones,
  getUserStats
} = require('../controllers/safetyController');

router.use(protect);

router.get('/score', getSafetyScore);
router.get('/zones', getNearbyZones);
router.post('/zones', createSafetyZone);
router.get('/stats', getUserStats);

module.exports = router;
