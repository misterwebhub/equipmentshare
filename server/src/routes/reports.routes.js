const express = require('express');
const router = express.Router();
const { authenticate, orgScope } = require('../middleware/auth');
const ctrl = require('../controllers/reports.controller');

router.use(authenticate, orgScope);

router.get('/dashboard',       ctrl.dashboardStats);
router.get('/revenue',         ctrl.revenue);
router.get('/utilisation',     ctrl.utilisation);

module.exports = router;
