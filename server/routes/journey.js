const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createJourney,
  startJourney,
  updateJourneyLocation,
  completeJourney,
  getJourneys,
  getJourney,
  shareJourney,
  getActiveJourney
} = require('../controllers/journeyController');

router.use(protect);

router.route('/')
  .get(getJourneys)
  .post(createJourney);

router.get('/active', getActiveJourney);

router.route('/:id')
  .get(getJourney);

router.post('/:id/start', startJourney);
router.post('/:id/location', updateJourneyLocation);
router.post('/:id/complete', completeJourney);
router.post('/:id/share', shareJourney);

module.exports = router;
