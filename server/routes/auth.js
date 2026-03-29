const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  register,
  login,
  getMe,
  updateProfile,
  addEmergencyContact,
  removeEmergencyContact,
  updateLocation
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);

// Protected routes
router.use(protect);

router.get('/me', getMe);
router.put('/profile', updateProfile);
router.post('/emergency-contacts', addEmergencyContact);
router.delete('/emergency-contacts/:contactId', removeEmergencyContact);
router.put('/location', updateLocation);

module.exports = router;
