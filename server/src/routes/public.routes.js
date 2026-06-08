const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/public.controller');

// Public endpoints — no auth required
router.get('/pricing', ctrl.getPricing);

module.exports = router;
