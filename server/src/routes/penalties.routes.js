const express = require('express');
const router = express.Router();
const { authenticate, orgScope, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/penalties.controller');

router.use(authenticate, orgScope);

router.get('/',                 ctrl.list);
router.post('/',                requireRole('admin','manager'), ctrl.create);
router.patch('/:id/waive',      requireRole('admin','manager'), ctrl.waive);
router.patch('/:id/mark-paid',  requireRole('admin','manager'), ctrl.markPaid);

module.exports = router;
