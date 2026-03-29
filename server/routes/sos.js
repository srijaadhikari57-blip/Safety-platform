const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  triggerSOS,
  updateSOSLocation,
  resolveSOS,
  getActiveSOS,
  getSOSHistory,
  acknowledgeSOS
} = require('../controllers/sosController');

router.use(protect);

router.post('/trigger', triggerSOS);
router.get('/active', getActiveSOS);
router.get('/history', getSOSHistory);

router.route('/:id')
  .put(updateSOSLocation);

router.post('/:id/resolve', resolveSOS);
router.post('/:id/acknowledge', acknowledgeSOS);

module.exports = router;
