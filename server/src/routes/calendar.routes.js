const express = require('express');
const router = express.Router();
const { authenticate, orgScope, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/calendar.controller');

router.use(authenticate, orgScope);

router.get('/events',  ctrl.getEvents);
router.post('/block',  requireRole('admin','manager'), ctrl.blockDates);

module.exports = router;
