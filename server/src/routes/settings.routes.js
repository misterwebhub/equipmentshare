const express = require('express');
const router = express.Router();
const { authenticate, orgScope, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/settings.controller');

router.use(authenticate, orgScope);

router.get('/profile',    ctrl.getProfile);
router.put('/profile',    requireRole('admin'), ctrl.updateProfile);
router.put('/password',   ctrl.changePassword);
router.get('/billing',    ctrl.getBilling);

module.exports = router;
