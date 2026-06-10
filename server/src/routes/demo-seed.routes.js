const router = require('express').Router();
const { authenticate, orgScope, requireRole } = require('../middleware/auth');
const { resetAndSeed } = require('../controllers/demo-seed.controller');

// Admin or manager can trigger; wrap in authenticate + orgScope
router.post('/', authenticate, orgScope, requireRole('admin', 'manager'), resetAndSeed);

module.exports = router;
